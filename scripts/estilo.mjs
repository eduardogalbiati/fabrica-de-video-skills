// Estilos: o jeito de mover e de desenhar, independente da marca (qualquer marca combina com qualquer estilo).
//   npm run estilo -- listar                os estilos de estilos\ e qual é o ativo
//   npm run estilo -- ver <nome>            mostruário com esse estilo, sem trocar o ativo → out\mostruario-estilo-<nome>.jpg
//   npm run estilo -- usar <nome>           troca o estilo ATIVO (reescreve estilos\ativo.ts)
// Para um vídeo só: npm run renderizar -- <Id> <saída.mp4> estilo=<nome>
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { RAIZ, SAIDA } from "./pastas.mjs";

const [modo, nome] = process.argv.slice(2);
const ESTILOS = path.join(RAIZ, "estilos");
const ATIVO = path.join(ESTILOS, "ativo.ts");
const ativo = () => /\.\/([^/]+)\/estilo\.json/.exec(readFileSync(ATIVO, "utf8"))?.[1] ?? "?";
const existe = (n) => existsSync(path.join(ESTILOS, n, "estilo.json"));

if (modo === "listar") {
  const atual = ativo();
  for (const n of readdirSync(ESTILOS).filter(existe)) {
    const e = JSON.parse(readFileSync(path.join(ESTILOS, n, "estilo.json"), "utf8"));
    console.log(`${n === atual ? "*" : " "} ${n.padEnd(14)} ${e.nome} — ${e.descricao}`);
  }
  console.log("\n* = ativo");
  process.exit(0);
}

if (modo === "ver" && nome) {
  if (!existe(nome)) (console.error(`Não achei o estilo "${nome}" em estilos\\.`), process.exit(1));
  const r = spawnSync(process.execPath, [path.join(RAIZ, "scripts", "mostruario.mjs")], { cwd: RAIZ, stdio: "inherit", env: { ...process.env, FABRICA_ESTILO: nome } });
  if (r.status !== 0) process.exit(r.status ?? 1);
  const gerado = path.join(SAIDA, `mostruario-estilo-${nome}.jpg`);
  console.log(`\nMostruário no estilo ${nome}: ${gerado}`);
  process.exit(0);
}

if (modo === "usar" && nome) {
  if (!existe(nome)) (console.error(`Não achei o estilo "${nome}" em estilos\\.`), process.exit(1));
  const texto = readFileSync(ATIVO, "utf8").replace(/\.\/[^/]+\/estilo\.json/, `./${nome}/estilo.json`);
  copyFileSync(ATIVO, `${ATIVO}.anterior`);
  writeFileSync(ATIVO, texto);
  console.log(`Estilo ativo agora: ${nome} (o arquivo anterior ficou em estilos\\ativo.ts.anterior). Rode npx tsc e npm run mostruario.`);
  process.exit(0);
}

console.error("Uso: npm run estilo -- listar | ver <nome> | usar <nome>");
process.exit(1);
