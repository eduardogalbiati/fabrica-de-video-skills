// Retrato do motor: renderiza quadros de TODAS as composições para comparar antes e depois de mexer no motor.
// Serve para provar que uma mudança não alterou o visual (ou para ver exatamente o que mudou).
//   npm run retrato -- tirar <nome>          → <trabalho>/out/retrato-<nome>/<Id>-<quadro>.png
//   npm run retrato -- comparar <a> <b>      → lista os quadros iguais, diferentes e os que só existem num dos lados
// Um quadro a cada 3 s de cada composição (no mínimo 3). Composição que não renderiza (falta gravação, por
// exemplo) é pulada com aviso. Respeita FABRICA_MARCA e FABRICA_ESTILO, como o mostruário.
import { getCompositions, renderStill } from "@remotion/renderer";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { empacotar } from "./empacotar.mjs";
import { SAIDA } from "./pastas.mjs";

const [modo, a, b] = process.argv.slice(2);
const pastaDe = (nome) => path.join(SAIDA, `retrato-${nome}`);

if (modo === "tirar" && a) {
  const pasta = pastaDe(a);
  rmSync(pasta, { recursive: true, force: true });
  mkdirSync(pasta, { recursive: true });
  console.log("Empacotando o projeto...");
  const serveUrl = await empacotar();
  const composicoes = await getCompositions(serveUrl);
  let total = 0;
  for (const composition of composicoes) {
    const { id, fps, durationInFrames } = composition;
    const passo = 3 * fps;
    const quadros = [];
    for (let f = Math.round(2.5 * fps); f < durationInFrames; f += passo) quadros.push(f);
    while (quadros.length < 3) quadros.push(Math.min(durationInFrames - 1, Math.round(((quadros.length + 1) * durationInFrames) / 4)));
    try {
      for (const frame of [...new Set(quadros)]) {
        await renderStill({ composition, serveUrl, frame, imageFormat: "png", scale: 0.5, output: path.join(pasta, `${id}-${String(frame).padStart(5, "0")}.png`) });
        total++;
      }
      console.log(`${id}: ${quadros.length} quadros`);
    } catch (e) {
      console.warn(`${id}: pulada (${String(e.message ?? e).split("\n")[0].slice(0, 120)})`);
    }
  }
  console.log(`\nRetrato "${a}": ${total} quadros em ${pasta}`);
  process.exit(0);
}

if (modo === "comparar" && a && b) {
  const [pa, pb] = [pastaDe(a), pastaDe(b)];
  for (const p of [pa, pb]) if (!existsSync(p)) (console.error(`Não achei ${p}`), process.exit(1));
  const hash = (arq) => createHash("sha256").update(readFileSync(arq)).digest("hex");
  const la = new Set(readdirSync(pa));
  const lb = new Set(readdirSync(pb));
  const iguais = [];
  const diferentes = [];
  for (const nome of la) if (lb.has(nome)) (hash(path.join(pa, nome)) === hash(path.join(pb, nome)) ? iguais : diferentes).push(nome);
  const soA = [...la].filter((n) => !lb.has(n));
  const soB = [...lb].filter((n) => !la.has(n));
  console.log(`Iguais: ${iguais.length}`);
  console.log(`Diferentes: ${diferentes.length}${diferentes.length ? "\n  " + diferentes.join("\n  ") : ""}`);
  if (soA.length) console.log(`Só em "${a}": ${soA.length}\n  ${soA.join("\n  ")}`);
  if (soB.length) console.log(`Só em "${b}": ${soB.length}\n  ${soB.join("\n  ")}`);
  process.exit(diferentes.length || soA.length || soB.length ? 2 : 0);
}

console.error("Uso: npm run retrato -- tirar <nome>  |  npm run retrato -- comparar <a> <b>");
process.exit(1);
