// Recorta a pessoa do fundo de uma gravação e entrega um WebM com transparência (VP9 + alfa), pronto para o Remotion.
// Uso: npm run recortar -- "<vídeo>" [nome] [--modelo multiclass|simples] [--suavizacao 0.6] [--borda 3] [--crf 24]
//                         [--conferir 2,8,15,22,28] [--pasta "<pasta dos quadros de conferência>"]
// Saída: <pasta de trabalho>/public/recortes/<nome>-pessoa.webm  (vídeo com alfa, sem áudio)
//        <pasta de trabalho>/public/recortes/<nome>-mascara.mp4  (a máscara: branco = pessoa)
//        com --conferir: PNGs da pessoa sobre o fundo da marca e sobre magenta (denuncia sobra de borda)
//        e a montagem original | máscara | recortado, em <pasta de trabalho>/out/recorte-<nome>/
//
// A máscara sai do MediaPipe (scripts/recorte/recortar.py), que roda num Python à parte, fora do projeto:
//   <pasta acima da pasta de trabalho>\ferramentas\recorte\.venv  (e os modelos em ...\recorte\modelos),
//   ou o venv apontado pela variável RECORTE_VENV
// Os outros parâmetros com -- (--encolher, --limiar, --dureza, --refinar, --processos, --inicio, --duracao, --estatisticas)
// vão direto para o recortar.py (lista e padrões no começo dele). Velocidade medida num PC de mesa com 10 núcleos, 4 processos:
// ~14 quadros/s na máscara + ~21 quadros/s no VP9 → 30 s de vídeo em menos de 2 min.
// No Remotion: <OffthreadVideo src={staticFile("recortes/<nome>-pessoa.webm")} transparent /> por cima do fundo,
// e o áudio vem da gravação original.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PUBLICO, RAIZ, SAIDA, TRABALHO } from "./pastas.mjs";
// cor de fundo da marca ativa, para os quadros de conferência
const FUNDO = `0x${JSON.parse(readFileSync(path.join(RAIZ, "marca", "marca.json"), "utf8")).cores.bg000.replace("#", "")}`;

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT_PY = path.join(AQUI, "recorte", "recortar.py");
const VENV = path.resolve(process.env.RECORTE_VENV ?? path.join(path.dirname(TRABALHO), "ferramentas", "recorte", ".venv"));
const PYTHON = path.join(VENV, process.platform === "win32" ? "Scripts\\python.exe" : "bin/python");

// separa os argumentos: posicionais (vídeo, nome), os nossos (--crf, --conferir, --pasta) e os do recortar.py
const posicionais = [];
const nossos = {};
const doPython = [];
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (!a.startsWith("--")) {
    posicionais.push(a);
    continue;
  }
  const valor = args[i + 1];
  i++;
  if (valor === undefined || valor.startsWith("--")) {
    console.error(`Faltou o valor de ${a} (ex.: ${a} 0.6).`);
    process.exit(1);
  }
  if (["--crf", "--conferir", "--pasta"].includes(a)) nossos[a.slice(2)] = valor;
  else doPython.push(a, valor);
}

const [video, nomeArg] = posicionais;
if (!video) {
  console.error('Uso: npm run recortar -- "<vídeo>" [nome] [--modelo multiclass|simples] [--suavizacao 0.6] [--borda 3] [--crf 24] [--conferir 2,8,15]');
  process.exit(1);
}
if (!existsSync(video)) {
  console.error(`Não achei o vídeo: ${video}`);
  process.exit(1);
}
if (!existsSync(PYTHON)) {
  console.error(
    [
      `Não achei o Python do recorte: ${PYTHON}`,
      "Ele fica fora do projeto (é grande). Para montar, no PowerShell:",
      `  py -3.12 -m venv "${VENV}"`,
      `  & "${PYTHON}" -m pip install mediapipe`,
      `  mkdir "${path.join(path.dirname(VENV), "modelos")}"`,
      "  e baixe para essa pasta, do endereço oficial do MediaPipe:",
      "  https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite",
      "  https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite",
      "(Ou aponte outro venv com a variável RECORTE_VENV.)",
    ].join("\n"),
  );
  process.exit(1);
}

const nome = nomeArg ?? path.basename(video, path.extname(video));
const pasta = path.join(PUBLICO, "recortes");
mkdirSync(pasta, { recursive: true });
const mascara = path.join(pasta, `${nome}-mascara.mp4`);
const webm = path.join(pasta, `${nome}-pessoa.webm`);
const crf = String(nossos.crf ?? 24);
const virgula = (n, casas = 1) => Number(n).toFixed(casas).replace(".", ",");

const sonda = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate:format=duration", "-of", "json", video], { encoding: "utf8" });
if (sonda.status !== 0) {
  console.error(sonda.stderr || "ffprobe falhou. O FFmpeg está instalado?");
  process.exit(1);
}
const info = JSON.parse(sonda.stdout);
const v = info.streams[0];
const dur = Number(info.format.duration);
console.log(`Vídeo: ${v.width}x${v.height}, ${v.r_frame_rate} fps, ${virgula(dur)} s`);

// 1) máscara (MediaPipe, quadro a quadro)
console.log("1/2 Máscara da pessoa (MediaPipe)...");
const t0 = Date.now();
const py = spawnSync(PYTHON, ["-I", SCRIPT_PY, video, mascara, ...doPython], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "inherit"],
  env: { ...process.env, GLOG_minloglevel: "2", TF_CPP_MIN_LOG_LEVEL: "2", PYTHONIOENCODING: "utf-8" },
  maxBuffer: 16 * 1024 * 1024,
});
if (py.status !== 0) {
  console.error(py.stdout || "");
  console.error("O recortar.py falhou (veja a mensagem acima).");
  process.exit(1);
}
const resumo = JSON.parse(py.stdout.trim().split("\n").pop());
const tMascara = (Date.now() - t0) / 1000;

// 2) junta vídeo e máscara num WebM VP9 com alfa (sem áudio)
console.log(`2/2 WebM com transparência (VP9, crf ${crf})...`);
const t1 = Date.now();
const ff = spawnSync(
  "ffmpeg",
  [
    "-hide_banner", "-loglevel", "error", "-stats", "-y",
    "-i", video, "-i", mascara,
    "-filter_complex", "[1:v]format=gray[a];[0:v][a]alphamerge,format=yuva420p[v]",
    "-map", "[v]", "-an",
    "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-crf", crf, "-b:v", "0",
    "-deadline", "good", "-cpu-used", "4", "-row-mt", "1", "-tile-columns", "2",
    webm,
  ],
  { stdio: "inherit" },
);
if (ff.status !== 0) {
  console.error("O ffmpeg falhou ao montar o WebM.");
  process.exit(1);
}
const tWebm = (Date.now() - t1) / 1000;

// confere se o alfa ficou mesmo no arquivo (o WebM marca alpha_mode=1)
const tags = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream_tags=alpha_mode", "-of", "default=nw=1:nk=1", webm], { encoding: "utf8" }).stdout.trim();
const comAlfa = tags === "1";

// quadros de conferência (opcional)
let pastaConf = null;
if (nossos.conferir) {
  pastaConf = path.resolve(nossos.pasta ?? path.join(SAIDA, `recorte-${nome}`));
  mkdirSync(pastaConf, { recursive: true });
  const segundos = nossos.conferir.split(",").map(Number).filter((s) => s >= 0 && s < dur);
  const q = (cmd) => spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...cmd], { stdio: "inherit" });
  const linhas = [];
  for (const s of segundos) {
    const ss = String(s);
    const tag = String(Math.round(s)).padStart(2, "0");
    for (const [fundo, cor] of [["escuro", FUNDO], ["magenta", "0xff00ff"]]) {
      q(["-f", "lavfi", "-i", `color=c=${cor}:s=${v.width}x${v.height}`, "-c:v", "libvpx-vp9", "-ss", ss, "-i", webm,
        "-filter_complex", "[0:v][1:v]overlay=format=auto:shortest=1,scale=540:-2", "-frames:v", "1", path.join(pastaConf, `${nome}-${fundo}-${tag}s.png`)]);
    }
    const linha = path.join(pastaConf, `_linha-${tag}.png`);
    q(["-ss", ss, "-i", video, "-ss", ss, "-i", mascara, "-f", "lavfi", "-i", `color=c=${FUNDO}:s=${v.width}x${v.height}`, "-c:v", "libvpx-vp9", "-ss", ss, "-i", webm,
      "-filter_complex", "[0:v]scale=360:-2[o];[1:v]format=gray,format=rgb24,scale=360:-2[m];[2:v][3:v]overlay=format=auto:shortest=1,scale=360:-2[c];[o][m][c]hstack=3",
      "-frames:v", "1", linha]);
    linhas.push(linha);
  }
  if (linhas.length) {
    q([...linhas.flatMap((l) => ["-i", l]), "-filter_complex", linhas.length > 1 ? `vstack=${linhas.length}` : "null", "-frames:v", "1", path.join(pastaConf, `${nome}-lado-a-lado.png`)]);
    for (const l of linhas) rmSync(l, { force: true });
  }
}

const mb = (f) => virgula(statSync(f).size / 1048576);
console.log("");
console.log(`Modelo: ${resumo.modelo} (MediaPipe ${resumo.mediapipe}), suavização ${resumo.suavizacao}, borda ${resumo.borda} px, refino ${resumo.refinar}`);
console.log(`Máscara: ${resumo.quadros} quadros em ${virgula(tMascara)} s → ${virgula(resumo.quadros_por_segundo)} quadros/s no MediaPipe`);
console.log(`WebM: ${virgula(tWebm)} s → ${virgula(resumo.quadros / tWebm)} quadros/s no VP9`);
console.log(`Total: ${virgula(tMascara + tWebm)} s para ${virgula(dur)} s de vídeo`);
console.log(`Pessoa (com alfa): ${webm} (${mb(webm)} MB) ${comAlfa ? "— alpha_mode=1, transparência OK" : "— AVISO: o arquivo NÃO marcou alpha_mode=1"}`);
console.log(`Máscara: ${mascara} (${mb(mascara)} MB)`);
if (pastaConf) console.log(`Conferência: ${pastaConf} (olhe os PNGs antes de usar; o magenta mostra sobra de fundo na borda)`);
