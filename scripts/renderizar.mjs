// Renderiza uma composição escolhendo a MARCA e o ESTILO, sem trocar os ativos (marca X no estilo Y).
// Uso: npm run renderizar -- <Id> <saída.mp4> [marca=<nome>] [estilo=<nome>] [mudo] [props=<arquivo.json>]
//   marca=   uma pasta de marcas\ (sem marca=, usa a ativa, pasta marca\)
//   estilo=  uma pasta de estilos\ (sem estilo=, usa o ativo, estilos\ativo.ts)
//   mudo     sem trilha de áudio (prévia sem som)
// Exemplo: npm run renderizar -- MeuVideo "trabalho\out\meu-video-orbita.mp4" estilo=orbita mudo
// Sem os traços de opção de propósito: no PowerShell o npm engole o que começa com "--".
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { RAIZ } from "./pastas.mjs";

const args = process.argv.slice(2);
const valor = (chave) => args.find((a) => a.startsWith(`${chave}=`))?.slice(chave.length + 1) ?? "";
const [id, saida] = args.filter((a) => !a.includes("=") && a !== "mudo");
if (!id || !saida) {
  console.error("Uso: npm run renderizar -- <Id> <saída.mp4> [marca=<nome>] [estilo=<nome>] [mudo] [props=<arquivo.json>]");
  process.exit(1);
}
const marca = valor("marca");
const estilo = valor("estilo");
if (marca && !existsSync(path.join(RAIZ, "marcas", marca, "marca.json"))) (console.error(`Não achei a marca "${marca}" em marcas\\.`), process.exit(1));
if (estilo && !existsSync(path.join(RAIZ, "estilos", estilo, "estilo.json"))) (console.error(`Não achei o estilo "${estilo}" em estilos\\.`), process.exit(1));

const opcoes = [id, saida];
if (args.includes("mudo")) opcoes.push("--muted");
if (valor("props")) opcoes.push(`--props=${valor("props")}`);
console.log(`Renderizando ${id} · marca: ${marca || "a ativa"} · estilo: ${estilo || "o ativo"}`);
const r = spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", ["remotion", "render", ...opcoes], {
  cwd: RAIZ,
  stdio: "inherit",
  shell: process.platform === "win32",
  env: { ...process.env, FABRICA_MARCA: marca, FABRICA_ESTILO: estilo },
});
process.exit(r.status ?? 1);
