// Renderiza uma composição. É o comando do RENDER FINAL e também o que escolhe a MARCA e o ESTILO sem trocar os ativos.
// Uso: npm run renderizar -- <Id> <saída.mp4> [1080p] [30fps] [4k] [60fps] [previa] [marca=<nome>] [estilo=<nome>] [mudo] [props=<arquivo.json>] [quadros=<de>-<até>]
//
// QUALIDADE: a que entra é a que sai. O vídeo sai na resolução e nos quadros por segundo da GRAVAÇÃO
// (o prop `video` da composição): gravou em 4K a 60, sai em 2160x3840 a 60; gravou em 1080p a 30, sai assim.
// Para mudar isso, só com um parâmetro, e só quando a pessoa pedir:
//   1080p    reduz o vídeo final para 1080x1920
//   30fps    reduz o vídeo final para 30 quadros por segundo
//   previa   prévia leve, 540x960 a 30 (nunca é o vídeo final)
// Para um vídeo só de animação, sem gravação (que sem isso sai em 1080x1920 a 30):
//   4k       força 2160x3840          60fps    força 60 quadros por segundo
// As composições continuam desenhadas em 1080x1920 e escritas em 30 quadros por segundo. A resolução maior vem
// da escala do render; os quadros por segundo, do relógio de autoria (src/relogio.tsx), que mantém cada animação
// no mesmo tempo e só deixa o movimento mais liso.
// HDR não entra na regra: o Remotion só desenha em cores normais (SDR).
//
//   marca=   uma pasta de marcas\ (sem marca=, usa a ativa, pasta marca\)
//   estilo=  uma pasta de estilos\ (sem estilo=, usa o ativo, estilos\ativo.ts)
//   mudo     sem trilha de áudio (prévia sem som)
//   quadros= renderiza só um trecho, em quadros de autoria, 30 por segundo (ex.: quadros=630-720), para um teste rápido
// Exemplo: npm run renderizar -- MeuVideo "trabalho\out\meu-video-final.mp4"
//          npm run renderizar -- MeuVideo "trabalho\out\meu-video-orbita.mp4" estilo=orbita mudo previa
// Sem os traços de opção de propósito: no PowerShell o npm engole o que começa com "--".
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { PUBLICO, RAIZ } from "./pastas.mjs";

const PALAVRAS = ["mudo", "1080p", "4k", "30fps", "60fps", "previa"];
const args = process.argv.slice(2);
const tem = (p) => args.some((a) => a.toLowerCase() === p);
const valor = (chave) => args.find((a) => a.startsWith(`${chave}=`))?.slice(chave.length + 1) ?? "";
const [id, saida] = args.filter((a) => !a.includes("=") && !PALAVRAS.includes(a.toLowerCase()));
if (!id || !saida) {
  console.error("Uso: npm run renderizar -- <Id> <saída.mp4> [1080p] [30fps] [4k] [60fps] [previa] [marca=<nome>] [estilo=<nome>] [mudo] [props=<arquivo.json>] [quadros=<de>-<até>]");
  process.exit(1);
}
const marca = valor("marca");
const estilo = valor("estilo");
if (marca && !existsSync(path.join(RAIZ, "marcas", marca, "marca.json"))) (console.error(`Não achei a marca "${marca}" em marcas\\.`), process.exit(1));
if (estilo && !existsSync(path.join(RAIZ, "estilos", estilo, "estilo.json"))) (console.error(`Não achei o estilo "${estilo}" em estilos\\.`), process.exit(1));

// A composição e a gravação dela: duração e quadros por segundo da composição; largura útil (em pé, 9:16) e
// quadros por segundo da gravação (0 se a composição não tem gravação). A gravação é o prop `video`.
const conferir = async () => {
  let inputProps = {};
  if (valor("props") && existsSync(valor("props"))) {
    try {
      inputProps = JSON.parse(readFileSync(valor("props"), "utf8"));
    } catch {
      /* props ilegíveis: o render avisa adiante */
    }
  }
  process.env.FABRICA_MARCA = marca;
  process.env.FABRICA_ESTILO = estilo;
  const { empacotar } = await import("./empacotar.mjs");
  const { selectComposition } = await import("@remotion/renderer");
  const composicao = await selectComposition({ serveUrl: await empacotar(), id, inputProps });
  const r = { quadros: composicao.durationInFrames, fpsDaComposicao: composicao.fps, largura: 0, fps: 0 };
  const video = typeof composicao.props?.video === "string" ? composicao.props.video : "";
  const arquivo = video ? path.join(PUBLICO, video) : "";
  if (!arquivo || !existsSync(arquivo)) return r;
  const sonda = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate", "-of", "json", arquivo], { encoding: "utf8" });
  const s = JSON.parse(sonda.stdout || "{}").streams?.[0];
  if (!s) return r;
  const [num, den] = String(s.r_frame_rate ?? "0/1").split("/").map(Number);
  return { ...r, largura: Math.min(s.width, Math.round((s.height * 9) / 16)), fps: Math.round(num / (den || 1)) || 0 };
};

let escala = 1;
let fps = 30; // os quadros por segundo de autoria
let quadros = 0; // duração da composição nos quadros por segundo de saída (0 = não mexe)
const motivos = [];
if (tem("previa")) {
  escala = 0.5;
  motivos.push("prévia leve, não é o vídeo final");
} else {
  console.log("Conferindo a gravação (resolução e quadros por segundo)...");
  const c = await conferir();
  const inteira = (n) => Number.isInteger(n) && n % 2 === 0;
  // resolução
  if (tem("1080p")) motivos.push("resolução reduzida a pedido (1080p)");
  else if (tem("4k")) {
    escala = 2;
    motivos.push("4K a pedido");
  } else if (c.largura > 1080) {
    const e = Math.min(2, c.largura / 1080);
    if (inteira(1080 * e) && inteira(1920 * e)) escala = e;
    else motivos.push(`gravação de tamanho incomum (${c.largura} px): saindo em 1080x1920`);
  }
  // quadros por segundo
  if (tem("30fps")) motivos.push("quadros por segundo reduzidos a pedido (30fps)");
  else if (tem("60fps")) fps = 60;
  else if (c.fps > 30) fps = Math.min(60, c.fps);
  else if (c.fps >= 24) fps = c.fps;
  if (fps !== c.fpsDaComposicao) quadros = Math.max(1, Math.round((c.quadros * fps) / c.fpsDaComposicao));
  else fps = c.fpsDaComposicao;
  motivos.push(c.largura ? `gravação: ${c.largura} px de largura, ${c.fps} fps` : "vídeo sem gravação (4k e 60fps forçam)");
}

// Ler um quadro de gravação em 4K demora mais que o limite padrão do Remotion (30 s), ainda mais em máquina ocupada.
const opcoes = [id, saida, "--timeout=240000"];
if (escala !== 1) opcoes.push(`--scale=${escala}`);
if (quadros) opcoes.push(`--fps=${fps}`, `--duration=${quadros}`);
if (tem("mudo")) opcoes.push("--muted");
if (valor("props")) opcoes.push(`--props=${valor("props")}`);
if (valor("quadros")) {
  // o trecho vem em quadros de autoria (30 por segundo) e vai para o Remotion nos quadros por segundo de saída
  const [de, ate] = valor("quadros").split("-").map(Number);
  const k = fps / 30;
  opcoes.push(`--frames=${Math.round(de * k)}-${Math.round(((ate ?? de) + 1) * k) - 1}`);
}
console.log(`Renderizando ${id} · ${Math.round(1080 * escala)}x${Math.round(1920 * escala)} a ${fps} fps (${motivos.join("; ")}) · marca: ${marca || "a ativa"} · estilo: ${estilo || "o ativo"}`);
const r = spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", ["remotion", "render", ...opcoes], {
  cwd: RAIZ,
  stdio: "inherit",
  shell: process.platform === "win32",
  env: { ...process.env, FABRICA_MARCA: marca, FABRICA_ESTILO: estilo },
});
process.exit(r.status ?? 1);
