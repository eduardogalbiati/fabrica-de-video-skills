// Conferência final de um vídeo antes de entregar: mede o arquivo, tira a capa e uma folha de quadros,
// e abre a pasta de entrega (estudio.config.json → entregas) com o NOTAS.md.
// Uso: npm run conferir -- "<vídeo final>" <slug> [segundo da capa, padrão 1.5]
// Saída: <entregas>\AAAA-MM-DD-<slug>\  (capa.jpg, folha-final.jpg, NOTAS.md)
// O vídeo final continua onde está (na pasta de trabalho); na entrega ficam só os arquivos pequenos.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ENTREGAS } from "./pastas.mjs";

const [video, slug, capaArg] = process.argv.slice(2);
if (!video || !slug) {
  console.error('Uso: npm run conferir -- "<vídeo final>" <slug> [segundo da capa]');
  process.exit(1);
}
if (!existsSync(video)) {
  console.error(`Não achei o vídeo: ${video}`);
  process.exit(1);
}
const virgula = (n, casas = 1) => Number(n).toFixed(casas).replace(".", ",");

const sonda = spawnSync("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type,codec_name,width,height,r_frame_rate,pix_fmt,sample_rate:format=duration,size,bit_rate", "-of", "json", video], { encoding: "utf8" });
if (sonda.status !== 0) {
  console.error(sonda.stderr || "ffprobe falhou");
  process.exit(1);
}
const info = JSON.parse(sonda.stdout);
const v = info.streams.find((s) => s.codec_type === "video");
const a = info.streams.find((s) => s.codec_type === "audio");
const dur = Number(info.format.duration);
const [num, den] = (v?.r_frame_rate ?? "0/1").split("/").map(Number);
const fps = num / (den || 1);

// volume (EBU R128): alvo −14 LUFS, pico até −1 dBTP
let lufs = null;
let pico = null;
if (a) {
  const med = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", video, "-vn", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).stderr;
  lufs = Number(/"input_i"\s*:\s*"(-?[\d.]+)"/.exec(med)?.[1]);
  pico = Number(/"input_tp"\s*:\s*"(-?[\d.]+)"/.exec(med)?.[1]);
}

// tamanho: em pé (9:16), no mínimo 1080x1920. Acima disso está certo: o vídeo sai na resolução da gravação.
const emPe = v ? Math.abs(v.width / v.height - 9 / 16) < 0.003 : false;
const itens = [
  ["Tamanho", `${v?.width}x${v?.height}`, emPe && v.width >= 1080 ? (v.width > 1080 ? "OK (resolução da gravação mantida)" : "OK") : "AVISO: o formato do Reels é 9:16, com pelo menos 1080x1920"],
  ["Quadros por segundo", virgula(fps, 2), fps >= 23.9 && fps <= 60.1 ? (Math.abs(fps - 30) < 0.01 ? "OK" : "OK (os da gravação)") : "AVISO: fora da faixa de 24 a 60"],
  ["Vídeo", `${v?.codec_name} ${v?.pix_fmt}`, v?.codec_name === "h264" && /^yuvj?420p$/.test(v?.pix_fmt ?? "") ? "OK" : "AVISO: o Instagram espera H.264 em yuv420p"],
  ["Áudio", a ? `${a.codec_name} ${a.sample_rate} Hz` : "sem áudio", a ? (a.codec_name === "aac" ? "OK" : "AVISO: o padrão é AAC") : "AVISO: vídeo sem áudio"],
  ["Duração", `${virgula(dur)} s`, dur <= 90 ? "OK" : "AVISO: passa de 90 s (limite do Reels)"],
  ["Tamanho do arquivo", `${virgula(Number(info.format.size) / 1048576)} MB`, "OK"],
];
if (a) {
  itens.push(["Volume", `${virgula(lufs)} LUFS`, lufs >= -16 && lufs <= -12 ? "OK" : 'AVISO: alvo −14 LUFS (corrija com: npm run nivelar -- "<vídeo>")']);
  itens.push(["Pico", `${virgula(pico)} dBTP`, pico <= -1 ? "OK" : "AVISO: pico acima de −1 dBTP (pode distorcer)"]);
}

// pasta de entrega: reaproveita a que já existir para o slug
const entregas = ENTREGAS;
const hoje = new Date();
const data = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
const existente = existsSync(entregas) ? readdirSync(entregas).find((d) => d.endsWith(`-${slug}`) && statSync(path.join(entregas, d)).isDirectory()) : null;
const pasta = path.join(entregas, existente ?? `${data}-${slug}`);
mkdirSync(pasta, { recursive: true });

const capaSeg = Math.min(Number(capaArg ?? 1.5), Math.max(0, dur - 0.1));
spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-ss", String(capaSeg), "-i", video, "-frames:v", "1", "-q:v", "2", path.join(pasta, "capa.jpg")], { stdio: "inherit" });
const quadros = Math.min(24, Math.max(8, Math.ceil(dur / 2)));
const colunas = 8;
spawnSync(
  "ffmpeg",
  ["-hide_banner", "-loglevel", "error", "-y", "-i", video, "-vf", `fps=${(quadros / dur).toFixed(4)},scale=270:-2,tile=${colunas}x${Math.ceil(quadros / colunas)}:padding=6:color=0x9aa8c0`, "-frames:v", "1", "-q:v", "3", path.join(pasta, "folha-final.jpg")],
  { stdio: "inherit" },
);

const tabela = ["| Item | Medido | Situação |", "|---|---|---|", ...itens.map((i) => `| ${i.join(" | ")} |`)].join("\n");
const avisos = itens.filter((i) => i[2] !== "OK").length;
const notas = path.join(pasta, "NOTAS.md");
if (!existsSync(notas)) {
  writeFileSync(
    notas,
    [
      `# ${slug} — notas de entrega`,
      "",
      `Conferido em ${data}.`,
      "",
      "## Arquivo final",
      `- Vídeo: \`${path.resolve(video)}\` (na pasta de trabalho)`,
      `- Capa: \`capa.jpg\` (quadro do segundo ${virgula(capaSeg)})`,
      "- Folha de quadros: `folha-final.jpg`",
      "",
      "## Conferência técnica",
      tabela,
      "",
      "## Como refazer",
      "- Composição (Id) e comando de render: ",
      "- Gravação usada: ",
      "- Enquadramento: ",
      "",
      "## O que conferir de olho e de ouvido (só uma pessoa consegue)",
      "- [ ] Som: voz, trilha e efeitos (nenhuma IA consegue ouvir)",
      "- [ ] Sincronia das animações e da legenda com a fala",
      "- [ ] Nada importante coberto pela interface do Instagram",
      "- [ ] Dados pessoais na tela (abas, e-mails, caminhos de pasta)",
      "",
      "## O que mudou em relação ao roteiro",
      "- ",
      "",
      "## Sugestão de legenda do post",
      "- ",
      "",
    ].join("\n"),
  );
} else {
  // Visto na primeira entrega real: depois do `nivelar`, a segunda conferência deixava no NOTAS.md a tabela antiga
  // (volume com AVISO) e o caminho do vídeo antes de nivelar. Agora troca só esses dois pedaços; o resto é de quem escreveu.
  const antes = readFileSync(notas, "utf8");
  const depois = antes
    .replace(/^- Vídeo: `[^`]*`/m, `- Vídeo: \`${path.resolve(video)}\``)
    .replace(/(## Conferência técnica\r?\n)[\s\S]*?(?=\r?\n## |$)/, `$1${tabela}\n`);
  if (depois !== antes) {
    writeFileSync(notas, depois);
    console.log("(NOTAS.md já existia: atualizei o caminho do vídeo e a tabela da conferência técnica.)");
  } else console.log("(NOTAS.md já existia e não foi alterado; a tabela abaixo é a medição de agora.)");
}

console.log(tabela);
console.log(`\n${avisos ? `${avisos} aviso(s).` : "Tudo certo na parte técnica."} Pasta de entrega: ${pasta}`);
console.log("Olhe folha-final.jpg e capa.jpg antes de avisar quem pediu o vídeo.");
