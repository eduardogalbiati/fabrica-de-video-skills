// Monta (ou confere) o estúdio neste computador. Pode rodar quantas vezes quiser: não apaga nada.
// Uso: node scripts/montar.mjs            (na primeira vez, antes de existir node_modules)
//      npm run montar                      (depois)
//      npm run montar -- demo              (termina renderizando o mostruário, como teste de instalação)
//      npm run montar -- explicar          (só mostra o que será baixado e quanto ocupa; não baixa nada)
// O que faz: 1. diz o que vai baixar e quanto ocupa, e confere o espaço livre;
//            2. confere node, ffmpeg e ffprobe (não instala programa nenhum);
//            3. baixa as dependências do projeto (npm install) se faltarem;
//            4. cria a pasta de trabalho e espelha nela os arquivos pequenos de public/;
//            5. confere o código (tsc);
//            6. com "demo": renderiza o mostruário das peças com a marca ativa. Não precisa de chave nem de conta.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, statfsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const win = process.platform === "win32";
const rodar = (cmd, args) => spawnSync(cmd, args, { cwd: RAIZ, stdio: "inherit", shell: win }).status === 0;
const existe = (cmd) => spawnSync(win ? "where" : "which", [cmd], { encoding: "utf8" }).status === 0;
const args = process.argv.slice(2);

// ───────── o que será baixado (medido em novembro de 2026, no Windows) ─────────
const acharPasta = (pasta, teste, nivel = 0) => {
  if (!existsSync(pasta) || nivel > 5) return false;
  for (const item of readdirSync(pasta)) {
    const caminho = path.join(pasta, item);
    if (!statSync(caminho).isDirectory()) continue;
    if (teste(item) || acharPasta(caminho, teste, nivel + 1)) return true;
  }
  return false;
};
const temPacotes = existsSync(path.join(RAIZ, "node_modules", "remotion"));
const temNavegador = existsSync(path.join(RAIZ, "node_modules", ".remotion"));
const temModelo = acharPasta(path.join(RAIZ, "node_modules", "@huggingface", "transformers", ".cache"), (n) => n.includes("whisper"));
const falta = (ja) => (ja ? "já está aqui" : "FALTA");
console.log("O que a Fábrica baixa para este computador (uma vez só):");
const linha = (oQue, tamanho, quando, ja) => console.log(`  ${oQue.padEnd(36)}${tamanho.padEnd(20)}${quando.padEnd(44)}${falta(ja)}`);
linha("1. Dependências do projeto", "~0,9 GB em disco", 'agora, no "npm install"', temPacotes);
linha("2. Navegador interno do Remotion", "~0,3 GB em disco", "no primeiro render (131 MB de download)", temNavegador);
linha("3. Modelo de transcrição (Whisper)", "~4 GB em disco", "só na primeira transcrição de uma fala", temModelo);
console.log("  Tudo fica dentro de node_modules, nesta pasta. Apagar essa pasta desfaz a instalação; nada é instalado no sistema.");
console.log("  O repositório em si tem menos de 1 MB. Vídeos e renders ficam na pasta de trabalho e crescem com o uso.");
try {
  const d = statfsSync(RAIZ);
  const livreGB = (Number(d.bavail) * Number(d.bsize)) / 1024 ** 3;
  const precisa = (temPacotes ? 0 : 0.9) + (temNavegador ? 0 : 0.3) + (temModelo ? 0 : 4) + 1;
  console.log(`  Espaço livre neste disco: ${livreGB.toFixed(0)} GB.${livreGB < precisa ? ` AVISO: é pouco (o que falta baixar pede uns ${precisa.toFixed(0)} GB com folga).` : ""}`);
} catch {
  // sistema sem statfs: segue sem a conta de espaço
}
console.log("");
if (args.includes("explicar")) process.exit(0);

// ───────── programas ─────────
const maior = Number(process.versions.node.split(".")[0]);
console.log(`${maior >= 20 ? "OK   " : "AVISO"} node ${process.versions.node}${maior >= 20 ? "" : " (o estúdio foi testado com o Node 24; use 20 ou mais novo)"}`);
const faltando = ["ffmpeg", "ffprobe"].filter((c) => !existe(c));
for (const c of ["ffmpeg", "ffprobe"]) console.log(`${faltando.includes(c) ? "FALTA" : "OK   "} ${c}`);
if (faltando.length) {
  console.log("\nFalta o FFmpeg. Nada foi instalado. Instale e rode de novo:");
  console.log(win ? "  winget install --id Gyan.FFmpeg -e" : process.platform === "darwin" ? "  brew install ffmpeg" : "  sudo apt install ffmpeg");
  process.exit(1);
}

if (!existsSync(path.join(RAIZ, "node_modules"))) {
  console.log("\nBaixando as dependências do projeto (npm install, ~0,9 GB em disco)...");
  if (!rodar("npm", ["install", "--no-fund", "--no-audit"])) process.exit(1);
}
console.log("");
if (!rodar("node", ["scripts/preparar.mjs"])) process.exit(1);
console.log("\nConferindo o código (tsc)...");
if (!rodar("npx", ["tsc"])) {
  console.log("FALHA: o código tem erro de tipos.");
  process.exit(1);
}
if (args.includes("demo")) {
  console.log(`\nRenderizando a demonstração (o mostruário das peças)${temNavegador ? "" : "; o navegador interno do Remotion é baixado agora, 131 MB"}...`);
  if (!rodar("node", ["scripts/mostruario.mjs"])) process.exit(1);
}
console.log("\nEstúdio pronto. Prévia ao vivo: npm run dev");
if (!temModelo) console.log("Lembrete: a primeira transcrição (corte, legenda, sincronizar com a fala) baixa o modelo de ~4 GB e demora alguns minutos.");
