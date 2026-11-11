// Folha de contato: 1 quadro do fim de cada cena, com o guia das zonas do Instagram ligado, tudo numa imagem só.
// Serve para conferir sem assistir: nada em vermelho, nada sobreposto, textos cabendo.
// Uso: npm run folha -- <IdDaComposicao> <src/videos/slug.tempos.json> [props.json] [sem-guia]
// Saída: <pasta de trabalho>/out/folha-<Id>.jpg
import { renderStill, selectComposition } from "@remotion/renderer";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { empacotar } from "./empacotar.mjs";
import { SAIDA } from "./pastas.mjs";

// "sem-guia" vai sem os dois traços: no PowerShell o npm engole opções que começam com "--".
const ehSemGuia = (a) => a === "sem-guia" || a === "--sem-guia";
const args = process.argv.slice(2);
const semGuia = args.some(ehSemGuia);
const [id, temposArq, propsArq] = args.filter((a) => !ehSemGuia(a));
if (!id || !temposArq) {
  console.error("Uso: npm run folha -- <IdDaComposicao> <src/videos/slug.tempos.json> [props.json] [sem-guia]");
  process.exit(1);
}

const tempos = JSON.parse(readFileSync(temposArq, "utf8"));
const extras = propsArq ? JSON.parse(readFileSync(propsArq, "utf8")) : {};
const inputProps = { ...extras, tempos: extras.tempos ?? tempos, mostrarGuia: !semGuia };

console.log("Empacotando o projeto...");
// respeita FABRICA_MARCA e FABRICA_ESTILO (folha de um vídeo noutra marca ou noutro estilo)
const serveUrl = await empacotar();
const composition = await selectComposition({ serveUrl, id, inputProps });
const { fps, durationInFrames } = composition;

// Fim de cada batida = 3 quadros antes da batida seguinte (antes do fade de saída terminar de sumir com a cena).
const batidas = Object.entries(inputProps.tempos)
  .filter(([nome]) => nome !== "duracaoFala")
  .sort((a, b) => a[1] - b[1]);
const fimDaFala = inputProps.tempos.duracaoFala ?? durationInFrames / fps;
const quadros = batidas.map(([nome], i) => {
  const proximo = i + 1 < batidas.length ? batidas[i + 1][1] : fimDaFala;
  return { nome, frame: Math.max(0, Math.round(proximo * fps) - 8) };
});
quadros.push({ nome: "(final)", frame: Math.min(durationInFrames - 1, Math.round(fimDaFala * fps) + fps) });

const tmp = mkdtempSync(path.join(os.tmpdir(), "folha-"));
try {
  for (const [i, q] of quadros.entries()) {
    const frame = Math.min(q.frame, durationInFrames - 1);
    await renderStill({
      composition,
      serveUrl,
      inputProps,
      frame,
      scale: 0.25,
      imageFormat: "png",
      output: path.join(tmp, `q-${String(i + 1).padStart(2, "0")}.png`),
    });
    console.log(`${String(i + 1).padStart(2, " ")}. ${q.nome} (quadro ${frame}, ${(frame / fps).toFixed(1)} s)`);
  }

  const colunas = Math.min(8, quadros.length);
  const linhas = Math.ceil(quadros.length / colunas);
  mkdirSync(SAIDA, { recursive: true });
  const saida = path.join(SAIDA, `folha-${id}.jpg`);
  const r = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-loglevel", "error", "-y", "-framerate", "1", "-i", path.join(tmp, "q-%02d.png"), "-vf", `tile=${colunas}x${linhas}:padding=6:color=0x9aa8c0`, "-frames:v", "1", "-q:v", "3", saida],
    { stdio: "inherit" },
  );
  if (r.status !== 0) process.exit(r.status ?? 1);
  console.log(`\nFolha: ${saida}  (${colunas} por linha, na ordem da lista acima)`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
process.exit(0);
