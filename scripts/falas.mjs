// Agrupa a transcrição (palavra por palavra) em falas com tempo, para a IA ler a gravação como texto.
// Uso: npm run falas -- legendas\<nome>.json      → cortes\<nome>.falas.md
// Também é usado pelo cortar.mjs.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PAUSA_QUE_SEPARA = 0.45; // silêncio entre palavras que abre uma fala nova (s)
const MAX_PALAVRAS = 22; // fala longa sem ponto também é quebrada

export const normalizar = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

export const lerPalavras = (arquivo) =>
  JSON.parse(readFileSync(arquivo, "utf8"))
    .map((c) => ({ texto: c.text.trim(), de: c.startMs / 1000, ate: c.endMs / 1000 }))
    .filter((p) => p.texto);

export const agruparFalas = (palavras) => {
  const falas = [];
  let atual = [];
  const fechar = () => {
    if (!atual.length) return;
    falas.push({
      n: falas.length + 1,
      de: +atual[0].de.toFixed(2),
      ate: +atual.at(-1).ate.toFixed(2),
      texto: atual.map((p) => p.texto).join(" "),
    });
    atual = [];
  };
  palavras.forEach((p, i) => {
    atual.push(p);
    const proxima = palavras[i + 1];
    const pausa = proxima ? proxima.de - p.ate : 0;
    if (!proxima || /[.?!…]$/.test(p.texto) || pausa >= PAUSA_QUE_SEPARA || atual.length >= MAX_PALAVRAS) fechar();
  });
  // tomada repetida: a fala começa igual a uma das 3 seguintes, ou tem quase as mesmas palavras
  falas.forEach((f, i) => {
    const a = f.texto.split(/\s+/).map(normalizar).filter(Boolean);
    for (const g of falas.slice(i + 1, i + 4)) {
      const b = g.texto.split(/\s+/).map(normalizar).filter(Boolean);
      const mesmoComeco = a.length >= 2 && b.length >= 2 && a[0] === b[0] && a[1] === b[1];
      const comuns = a.filter((x) => b.includes(x)).length;
      const parecidas = comuns / Math.max(1, new Set([...a, ...b]).size) >= 0.6;
      if (mesmoComeco || parecidas) {
        f.pareceCom = g.n;
        break;
      }
    }
  });
  return falas;
};

export const tabelaDeFalas = (falas) => {
  const linhas = ["| # | de (s) | até (s) | fala | pausa depois | aviso |", "|---|---|---|---|---|---|"];
  falas.forEach((f, i) => {
    const pausa = falas[i + 1] ? falas[i + 1].de - f.ate : 0;
    linhas.push(
      `| ${f.n} | ${f.de.toFixed(2)} | ${f.ate.toFixed(2)} | ${f.texto.replace(/\|/g, "/")} | ${pausa >= 0.3 ? pausa.toFixed(1) + " s" : ""} | ${
        f.pareceCom ? `parece repetir na fala ${f.pareceCom}` : ""
      } |`,
    );
  });
  return linhas.join("\n");
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arquivo = process.argv[2];
  if (!arquivo) {
    console.error("Uso: npm run falas -- legendas\\<nome>.json");
    process.exit(1);
  }
  const falas = agruparFalas(lerPalavras(arquivo));
  const nome = path.parse(arquivo).name;
  mkdirSync("cortes", { recursive: true });
  const saida = path.join("cortes", `${nome}.falas.md`);
  writeFileSync(saida, `# Falas de ${nome}\n\n${tabelaDeFalas(falas)}\n`);
  console.log(tabelaDeFalas(falas));
  console.log(`\n${falas.length} falas → ${saida}`);
}
