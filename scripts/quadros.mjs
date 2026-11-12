// Quadros escolhidos de uma composição, numa imagem só. Serve para conferir o MEIO de um efeito que se move
// (mergulho, vertigem, órbita, recuo), que a folha de contato não pega: ela tira só o fim de cada cena.
// Uso: npm run quadros -- <IdDaComposicao> <quadros> [escala] [props.json] [guia]
//   quadros: lista separada por vírgula. Número puro = quadro; com "s" no fim = segundo (ex.: 40,60,29.4s,81.5s)
//   escala:  tamanho de cada quadro em relação ao vídeo (padrão 0.33)
//   guia:    liga as zonas do Instagram (prop mostrarGuia), se a composição tiver
// Saída: <pasta de trabalho>/out/quadros-<Id>.jpg (na ordem pedida, 6 por linha)
import { renderStill, selectComposition } from "@remotion/renderer";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { empacotar } from "./empacotar.mjs";
import { SAIDA } from "./pastas.mjs";

const args = process.argv.slice(2);
const comGuia = args.includes("guia");
const [id, lista, ...resto] = args.filter((a) => a !== "guia");
if (!id || !lista) {
  console.error("Uso: npm run quadros -- <IdDaComposicao> <quadros, ex.: 40,60,29.4s> [escala] [props.json] [guia]");
  process.exit(1);
}
const escala = Number(resto.find((a) => /^[0-9.]+$/.test(a)) ?? 0.33);
const propsArq = resto.find((a) => a.endsWith(".json"));
const inputProps = { ...(propsArq ? JSON.parse(readFileSync(propsArq, "utf8")) : {}), ...(comGuia ? { mostrarGuia: true } : {}) };

console.log("Empacotando o projeto...");
const serveUrl = await empacotar();
const composition = await selectComposition({ serveUrl, id, inputProps });
const { fps, durationInFrames } = composition;
const quadros = lista
  .split(",")
  .map((q) => q.trim())
  .filter(Boolean)
  .map((q) => Math.min(durationInFrames - 1, Math.max(0, q.endsWith("s") ? Math.round(Number(q.slice(0, -1)) * fps) : Math.round(Number(q)))));
if (quadros.some((q) => Number.isNaN(q))) {
  console.error(`Não entendi a lista de quadros: ${lista}`);
  process.exit(1);
}

const tmp = mkdtempSync(path.join(os.tmpdir(), "quadros-"));
try {
  for (const [i, frame] of quadros.entries()) {
    await renderStill({ composition, serveUrl, inputProps, frame, scale: escala, imageFormat: "png", output: path.join(tmp, `q-${String(i + 1).padStart(2, "0")}.png`) });
    console.log(`${String(i + 1).padStart(2, " ")}. quadro ${frame} (${(frame / fps).toFixed(2)} s)`);
  }
  const colunas = Math.min(6, quadros.length);
  const linhas = Math.ceil(quadros.length / colunas);
  mkdirSync(SAIDA, { recursive: true });
  const saida = path.join(SAIDA, `quadros-${id}.jpg`);
  const r = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-loglevel", "error", "-y", "-framerate", "1", "-i", path.join(tmp, "q-%02d.png"), "-vf", `tile=${colunas}x${linhas}:padding=6:color=0x9aa8c0`, "-frames:v", "1", "-q:v", "3", saida],
    { stdio: "inherit" },
  );
  if (r.status !== 0) process.exit(r.status ?? 1);
  console.log(`\nQuadros: ${saida}  (${colunas} por linha, na ordem pedida)`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
process.exit(0);
