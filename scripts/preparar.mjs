// Prepara a pasta de trabalho (onde ficam os arquivos grandes) e espelha nela os arquivos pequenos de public/.
// Uso: npm run preparar        (roda sozinho antes de "npm run dev")
// Só copia do projeto para a pasta de trabalho, nunca apaga nada e nunca copia de volta.
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { CONFIG, ORIGINAIS, PUBLICO, PUBLICO_DO_PROJETO, SAIDA } from "./pastas.mjs";

for (const pasta of [PUBLICO, SAIDA, ORIGINAIS]) mkdirSync(pasta, { recursive: true });

const limite = (CONFIG.limiteArquivoPequenoMB ?? 20) * 1024 * 1024;
let copiados = 0;
let iguais = 0;
const grandes = [];

const espelhar = (origem, destino) => {
  mkdirSync(destino, { recursive: true });
  for (const item of readdirSync(origem, { withFileTypes: true })) {
    const de = path.join(origem, item.name);
    const para = path.join(destino, item.name);
    if (item.isDirectory()) {
      espelhar(de, para);
      continue;
    }
    if (!item.isFile()) continue;
    const info = statSync(de);
    if (info.size > limite) grandes.push(`${path.relative(PUBLICO_DO_PROJETO, de)} (${(info.size / 1048576).toFixed(0)} MB)`);
    const jaTem = existsSync(para) ? statSync(para) : null;
    if (jaTem && jaTem.size === info.size && jaTem.mtimeMs >= info.mtimeMs) {
      iguais++;
      continue;
    }
    copyFileSync(de, para);
    copiados++;
  }
};

if (existsSync(PUBLICO_DO_PROJETO)) espelhar(PUBLICO_DO_PROJETO, PUBLICO);

console.log(`Pasta de trabalho: ${path.dirname(PUBLICO)}`);
console.log(`public/: ${copiados} arquivo(s) copiado(s), ${iguais} já em dia.`);
if (grandes.length) {
  console.warn(`AVISO: arquivo grande dentro de public/ do projeto (vai parar em backup e repositório). Mova para ${PUBLICO}:`);
  for (const g of grandes) console.warn(`  - public/${g}`);
}
