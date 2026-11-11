// Transforma a transcrição (palavra por palavra) em páginas de legenda: frases inteiras, no máximo 2 linhas.
// Uso: npm run paginar -- legendas\<nome>.json ["<vídeo>"] [pilar] [refazer]     (pilar: um tema da marca ativa)
// Saída: legendas\<nome>.legenda.json  → são as props da composição VideoLegendado:
//   npx remotion render VideoLegendado "<saída>.mp4" --props=legendas\<nome>.legenda.json
// Depois de gerar, a IA revisa o arquivo: corrige nomes que o Whisper errou e marca UMA palavra-chave
// por página com *asteriscos* (ela sai na cor do pilar). Padrão do design system: sem animação palavra a palavra.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { lerPalavras, normalizar } from "./falas.mjs";
import { PUBLICO, RAIZ } from "./pastas.mjs";

const MAX_LETRAS = 56; // cabe em 2 linhas da fonte de texto (peso 600, 40 px) na faixa da legenda
const MAX_SEGUNDOS = 3.2;
const PAUSA_QUE_QUEBRA = 0.6;
const PAGINA_CURTA = 1; // página com menos que isso (s) junta com a anterior, se couber
// palavras que pedem continuação: página não termina nelas (visto na gravação real: "aparece direto no / Claude")
const PENDURADAS = new Set("a o as os um uma uns umas de do da dos das no na nos nas em e ou que com por pra pro para ao aos se me te seu sua meu minha".split(" "));
// os temas (pilares) e o tema padrão vêm da marca ativa
const marcaAtiva = JSON.parse(readFileSync(path.join(RAIZ, "marca", "marca.json"), "utf8"));
const PILARES = Object.keys(marcaAtiva.temas);

const args = process.argv.slice(2);
const refazer = args.includes("refazer");
const pilar = args.find((a) => PILARES.includes(a)) ?? marcaAtiva.temaPadrao;
const [arquivo, video] = args.filter((a) => a !== "refazer" && !PILARES.includes(a));
if (!arquivo) {
  console.error('Uso: npm run paginar -- legendas\\<nome>.json ["<vídeo>"] [pilar] [refazer]');
  process.exit(1);
}
const nome = path.parse(arquivo).name;
const saida = path.join("legendas", `${nome}.legenda.json`);
if (existsSync(saida) && !refazer) {
  console.error(`${saida} já existe (pode ter palavras-chave marcadas). Para gerar de novo: acrescente "refazer" no fim do comando.`);
  process.exit(1);
}

const palavras = lerPalavras(arquivo);
const grupos = []; // cada página como lista de palavras
let atual = [];
const fechar = () => {
  if (!atual.length) return;
  grupos.push(atual);
  atual = [];
};
const letras = (lista) => lista.reduce((t, x) => t + x.texto.length + 1, 0);
// quando a página estoura o limite, volta até a última vírgula para não partir a frase no meio
const fecharNoLimite = () => {
  let k = -1;
  for (let j = atual.length - 2; j >= 1; j--) {
    if (/[,;:]$/.test(atual[j].texto)) {
      k = j;
      break;
    }
  }
  if (k < 0) return fechar();
  const resto = atual.slice(k + 1);
  atual = atual.slice(0, k + 1);
  fechar();
  atual = resto;
};
palavras.forEach((p, i) => {
  const letras = atual.reduce((t, x) => t + x.texto.length + 1, 0);
  // tolera 0,8 s a mais quando a palavra fecha a frase (melhor que deixar uma palavra sozinha na página seguinte)
  const fechaFrase = /[.,;:?!…]$/.test(p.texto);
  const estouraTempo = atual.length && p.ate - atual[0].de > MAX_SEGUNDOS + (fechaFrase ? 0.8 : 0);
  if (atual.length && (letras + p.texto.length > MAX_LETRAS || estouraTempo)) fecharNoLimite();
  atual.push(p);
  const proxima = palavras[i + 1];
  const tamanho = atual.reduce((t, x) => t + x.texto.length + 1, 0);
  const fimDeFrase = /[.?!…]$/.test(p.texto) && atual.length >= 2;
  const virgulaBoa = /[,;:]$/.test(p.texto) && tamanho >= 20;
  if (!proxima || fimDeFrase || virgulaBoa || proxima.de - p.ate >= PAUSA_QUE_QUEBRA) fechar();
});
// palavra pendurada no fim da página passa para a seguinte (sem pausa entre elas e se couber)
for (let i = 0; i < grupos.length - 1; i++) {
  const g = grupos[i];
  const prox = grupos[i + 1];
  while (g.length > 1) {
    const ult = g.at(-1);
    if (/[.,;:?!…]$/.test(ult.texto) || !PENDURADAS.has(normalizar(ult.texto))) break;
    if (prox[0].de - ult.ate >= PAUSA_QUE_QUEBRA || letras([ult, ...prox]) > MAX_LETRAS) break;
    prox.unshift(g.pop());
  }
}
// página curta demais junta com a anterior, se a anterior não fecha frase, não há pausa e cabe
for (let i = grupos.length - 1; i > 0; i--) {
  const g = grupos[i];
  const ant = grupos[i - 1];
  const curta = g.at(-1).ate - g[0].de < PAGINA_CURTA;
  if (curta && !/[.?!…]$/.test(ant.at(-1).texto) && g[0].de - ant.at(-1).ate < PAUSA_QUE_QUEBRA && letras([...ant, ...g]) <= MAX_LETRAS) {
    ant.push(...g);
    grupos.splice(i, 1);
  }
}
// o Whisper separa a extensão do nome ("llms .txt", "meusite .com"): cola de volta
const juntar = (g) => g.reduce((s, p, i) => (i && /^\.[a-z]/i.test(p.texto) ? s + p.texto : s + (i ? " " : "") + p.texto), "");
const paginas = grupos.map((g) => ({
  de: g[0].de,
  ate: g.at(-1).ate,
  texto: juntar(g).replace(/[.,;:]+$/, ""),
}));
// a página fica na tela até a próxima entrar (sem piscar); no silêncio, some 0,25 s depois da última palavra
paginas.forEach((pg, i) => {
  const prox = paginas[i + 1];
  pg.ate = prox && prox.de - pg.ate < 0.4 ? prox.de : Math.min(pg.ate + 0.25, prox ? prox.de : pg.ate + 0.25);
  pg.de = +pg.de.toFixed(2);
  pg.ate = +pg.ate.toFixed(2);
});

let duracaoSeg = +(palavras.at(-1).ate + 0.6).toFixed(2);
let propVideo = "";
if (video) {
  if (!existsSync(video)) {
    console.error(`Não achei o vídeo: ${video}`);
    process.exit(1);
  }
  const sonda = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video], { encoding: "utf8" });
  if (sonda.status === 0) duracaoSeg = +Number(sonda.stdout.trim()).toFixed(2);
  const relativo = path.relative(PUBLICO, path.resolve(video));
  if (relativo.startsWith("..") || path.isAbsolute(relativo)) {
    console.warn(`AVISO: o vídeo está fora de ${PUBLICO}. O Remotion só lê o que está lá: copie o arquivo e ajuste o campo "video".`);
    propVideo = path.basename(video);
  } else propVideo = relativo.split(path.sep).join("/");
}

const props = { pilar, video: propVideo, duracaoSeg, enquadramento: "50% 50%", posicao: "faixa", mostrarGuia: false, paginas };
writeFileSync(saida, JSON.stringify(props, null, 2) + "\n");
for (const pg of paginas) console.log(`${pg.de.toFixed(2).padStart(7)} – ${pg.ate.toFixed(2).padStart(7)}  ${pg.texto}`);
console.log(`\n${paginas.length} páginas → ${saida}`);
console.log(`Revise: nomes próprios, e marque uma *palavra-chave* por página. Campos: pilar (${PILARES.join("|")}), posicao (faixa|terco-superior|base).`);
