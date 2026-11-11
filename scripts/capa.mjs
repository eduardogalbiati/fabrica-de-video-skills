// Prepara a capa de um Reels: tira o quadro de fundo (de um vídeo ou de uma foto) e cria o arquivo de props.
// Uso: npm run capa -- <slug> "<vídeo ou imagem>" [segundo do vídeo, padrão 1.5]
//      npm run capa -- <slug>                      (sem fundo: capa só com o fundo noite)
// Saída: <pasta de trabalho>\public\capas\<slug>-fundo.jpg  e  roteiros\<slug>.capa.json
// Depois: edite o título em roteiros\<slug>.capa.json e renderize
//      npx remotion still Capa "<pasta de trabalho>\out\<slug>-capa.png" --props=roteiros\<slug>.capa.json
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PUBLICO, RAIZ, SAIDA } from "./pastas.mjs";

// o tema inicial da capa é o tema padrão da marca ativa
const temaPadrao = JSON.parse(readFileSync(path.join(RAIZ, "marca", "marca.json"), "utf8")).temaPadrao;

const [slug, origem, segundoArg] = process.argv.slice(2);
if (!slug) {
  console.error('Uso: npm run capa -- <slug> ["<vídeo ou imagem>"] [segundo]');
  process.exit(1);
}

let fundo = "";
if (origem) {
  if (!existsSync(origem)) {
    console.error(`Não achei o arquivo: ${origem}`);
    process.exit(1);
  }
  const pasta = path.join(PUBLICO, "capas");
  mkdirSync(pasta, { recursive: true });
  const destino = path.join(pasta, `${slug}-fundo.jpg`);
  const ehImagem = /\.(png|jpe?g|webp)$/i.test(origem);
  const args = ["-hide_banner", "-loglevel", "error", "-y"];
  if (!ehImagem) args.push("-ss", String(Number(segundoArg ?? 1.5)));
  args.push("-i", origem, "-frames:v", "1", "-vf", "scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1920", "-q:v", "2", destino);
  const r = spawnSync("ffmpeg", args, { stdio: "inherit" });
  if (r.status !== 0 || !existsSync(destino)) process.exit(r.status ?? 1);
  fundo = `capas/${slug}-fundo.jpg`;
  console.log(`Fundo: ${destino}`);
}

const props = path.join("roteiros", `${slug}.capa.json`);
if (existsSync(props)) {
  console.log(`${props} já existe e não foi alterado (o título pode estar editado). Confira o campo "fundo": "${fundo}".`);
} else {
  writeFileSync(
    props,
    JSON.stringify(
      { pilar: temaPadrao, fundo, enquadramento: "50% 30%", escurecer: fundo ? 0.45 : 0, rotulo: "", titulo: "Título com a *palavra-chave*", canto: "", posicao: "baixo", tamanho: 124, mostrarGuia: false },
      null,
      2,
    ) + "\n",
  );
  console.log(`Props: ${props}`);
}
mkdirSync(SAIDA, { recursive: true });
console.log(`Edite o título e renderize:\n  npx remotion still Capa "${path.join(SAIDA, `${slug}-capa.png`)}" --props=${props}`);
