// Onde cada coisa do estúdio mora. Tudo vem de estudio.config.json, na raiz do estúdio:
//   trabalho  pasta dos arquivos GRANDES (gravações, prévias, vídeos finais). Pode ficar fora do projeto,
//             para não entrar em backup nem em repositório. Caminho absoluto, ou relativo à raiz do estúdio.
//   entregas  onde ficam as notas e a capa de cada vídeo entregue (arquivos pequenos).
//   catalogo  onde o mostruário das peças é guardado como imagem.
// Dentro do projeto ficam só código, roteiros, legendas .json e os arquivos pequenos de public/ (sons, prints).
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const CONFIG = JSON.parse(readFileSync(path.join(RAIZ, "estudio.config.json"), "utf8"));

const resolver = (caminho) => path.resolve(RAIZ, caminho);

export const TRABALHO = resolver(process.env.REELS_TRABALHO ?? CONFIG.trabalho ?? "trabalho");
export const PUBLICO_DO_PROJETO = path.join(RAIZ, "public"); // só arquivos pequenos; é a origem do espelho
export const PUBLICO = path.join(TRABALHO, "public"); // o que o Remotion lê (staticFile)
export const SAIDA = path.join(TRABALHO, "out"); // prévias, folhas de contato e vídeos finais
export const ORIGINAIS = path.join(TRABALHO, "originais"); // gravações como saíram do celular
export const ENTREGAS = resolver(CONFIG.entregas ?? "entregas");
export const CATALOGO = resolver(CONFIG.catalogo ?? "docs");
