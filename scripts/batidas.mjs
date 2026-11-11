// Acha no áudio transcrito o segundo em que cada cena começa.
// Uso: node scripts/batidas.mjs legendas/<fala>.json roteiros/<video>.ancoras.json src/videos/<video>.tempos.json ["<vídeo>"]
// ancoras.json: { "nomeDaCena": "primeiras palavras faladas nessa cena", ... } (na ordem da fala)
// Com o vídeo no fim, a duracaoFala nunca passa da duração dele (senão sobra um instante sem imagem embaixo).
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const [legendasArq, ancorasArq, saidaArq, videoArq] = process.argv.slice(2);
if (!saidaArq) {
  console.error("Uso: node scripts/batidas.mjs legendas/x.json roteiros/x.ancoras.json src/videos/x.tempos.json");
  process.exit(1);
}
const ANTECIPA = 0.15; // a animação entra um pouco antes da palavra

const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
const parecido = (a, b) => a === b || (a.length >= 4 && b.length >= 4 && a.slice(0, 4) === b.slice(0, 4));

const palavras = JSON.parse(readFileSync(legendasArq, "utf8"))
  .flatMap((c) => c.text.trim().split(/\s+/).map((t) => ({ t: norm(t), s: c.startMs / 1000, e: c.endMs / 1000 })))
  .filter((w) => w.t);
const ancoras = JSON.parse(readFileSync(ancorasArq, "utf8"));

const tempos = {};
let cursor = 0;
let faltando = [];
for (const [cena, frase] of Object.entries(ancoras)) {
  const alvo = frase.split(/\s+/).map(norm).filter(Boolean);
  let achou = -1;
  for (let i = cursor; i <= palavras.length - alvo.length; i++) {
    if (alvo.every((a, k) => parecido(palavras[i + k].t, a))) {
      achou = i;
      break;
    }
  }
  if (achou === -1) {
    faltando.push(cena);
    continue;
  }
  tempos[cena] = Math.max(0, +(palavras[achou].s - ANTECIPA).toFixed(2));
  cursor = achou + alvo.length;
}
tempos.duracaoFala = +(palavras.at(-1).e + 0.6).toFixed(2);
if (videoArq) {
  if (!existsSync(videoArq)) {
    console.error(`Não achei o vídeo: ${videoArq}`);
    process.exit(1);
  }
  const sonda = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", videoArq], { encoding: "utf8" });
  const dur = Number(sonda.stdout?.trim());
  // um quadro a menos que o vídeo, para o último quadro da fala ainda ter imagem
  if (dur > 0 && tempos.duracaoFala > dur - 0.04) tempos.duracaoFala = +Math.floor((dur - 0.04) * 100) / 100;
}
writeFileSync(saidaArq, JSON.stringify(tempos, null, 2) + "\n");
console.log(tempos);
if (faltando.length) {
  console.error(`⚠️  Não encontrei no áudio: ${faltando.join(", ")} — ajuste as âncoras ou edite os tempos à mão.`);
  process.exit(2);
}
