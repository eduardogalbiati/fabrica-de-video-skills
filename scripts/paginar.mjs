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
// "fluida": legenda de 1 a 3 palavras por vez, cada uma no seu tempo (LegendaFluida) → legendas\<nome>.fluida.json
const fluida = args.includes("fluida");
const pilar = args.find((a) => PILARES.includes(a)) ?? marcaAtiva.temaPadrao;
const [arquivo, video] = args.filter((a) => a !== "refazer" && a !== "fluida" && !PILARES.includes(a));
if (!arquivo) {
  console.error('Uso: npm run paginar -- legendas\\<nome>.json ["<vídeo>"] [pilar] [fluida] [refazer]');
  process.exit(1);
}
const nome = path.parse(arquivo).name;
const saida = path.join("legendas", `${nome}.${fluida ? "fluida" : "legenda"}.json`);
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

if (fluida) {
  // ── legenda fluida: blocos de 1 a 3 palavras, cada palavra com o segundo em que é falada ──
  const MAX_PALAVRAS = 3;
  const MAX_LETRAS_BLOCO = 20; // cabe numa linha da letra de título a 70 px
  const PAUSA_BLOCO = 0.35;
  const ws = [];
  for (const p of palavras) {
    if (ws.length && /^\.[a-z]/i.test(p.texto)) {
      ws.at(-1).texto += p.texto; // "llms .txt" → "llms.txt"
      ws.at(-1).ate = p.ate;
    } else ws.push({ ...p });
  }
  // sem pontuação na tela; a palavra maiúscula que só abre frase vira minúscula (nomes próprios: revisar à mão)
  ws.forEach((p, i) => {
    const abre = i === 0 || /[.?!…]$/.test(ws[i - 1].texto);
    let m = p.texto.replace(/^["“”'(]+/, "").replace(/[.,;:!?…"“”')]+$/, "");
    if (abre && /^\p{Lu}(\p{Ll}|$)/u.test(m)) m = m[0].toLowerCase() + m.slice(1);
    p.mostrar = m;
  });
  const blocosP = [];
  let bl = [];
  const fecharBloco = () => {
    if (bl.length) blocosP.push(bl);
    bl = [];
  };
  ws.filter((p) => p.mostrar).forEach((p) => {
    const letrasBl = bl.reduce((n, x) => n + x.mostrar.length + 1, 0);
    if (bl.length && (bl.length >= MAX_PALAVRAS || letrasBl + p.mostrar.length > MAX_LETRAS_BLOCO || p.de - bl.at(-1).ate >= PAUSA_BLOCO)) fecharBloco();
    bl.push(p);
    if (/[.,;:?!…]$/.test(p.texto)) fecharBloco();
  });
  fecharBloco();
  // palavra pendurada ("de", "a", "no"…) no fim do bloco passa para o seguinte, se couber e não houver pausa
  for (let i = 0; i < blocosP.length - 1; i++) {
    const g = blocosP[i];
    const prox = blocosP[i + 1];
    while (g.length > 1 && prox.length < MAX_PALAVRAS) {
      const ult = g.at(-1);
      if (/[.,;:?!…]$/.test(ult.texto) || !PENDURADAS.has(normalizar(ult.mostrar)) || prox[0].de - ult.ate >= PAUSA_BLOCO) break;
      prox.unshift(g.pop());
    }
  }
  // bloco de uma palavra só que pede continuação ("o", "a", "de") entra no começo do seguinte (pode ficar com 4)
  for (let i = blocosP.length - 2; i >= 0; i--) {
    const g = blocosP[i];
    const prox = blocosP[i + 1];
    if (g.length === 1 && PENDURADAS.has(normalizar(g[0].mostrar)) && prox[0].de - g[0].ate < PAUSA_BLOCO) {
      prox.unshift(g[0]);
      blocosP.splice(i, 1);
    }
  }
  const blocos = blocosP.map((g, i) => {
    const prox = blocosP[i + 1];
    const fim = g.at(-1).ate;
    const ate = prox && prox[0].de - fim < 0.6 ? prox[0].de : Math.min(fim + 0.3, prox ? prox[0].de : fim + 0.3);
    return { de: +g[0].de.toFixed(2), ate: +ate.toFixed(2), palavras: g.map((p) => ({ texto: p.mostrar, de: +p.de.toFixed(2) })) };
  });
  const propsFluida = { pilar, video: propVideo, duracaoSeg, enquadramento: "50% 50%", posicao: "faixa", mostrarGuia: false, modelo: "fluida", centroLegenda: 0, paginas: [], blocos };
  writeFileSync(saida, JSON.stringify(propsFluida, null, 2) + "\n");
  for (const b of blocos) console.log(`${b.de.toFixed(2).padStart(7)} – ${b.ate.toFixed(2).padStart(7)}  ${b.palavras.map((p) => p.texto).join(" ")}`);
  console.log(`\n${blocos.length} blocos → ${saida}`);
  console.log("Revise: nomes próprios (a primeira palavra de cada frase saiu em minúscula) e marque as palavras-chave com *asteriscos* (uma a cada 2 ou 3 blocos).");
  process.exit(0);
}

const props = { pilar, video: propVideo, duracaoSeg, enquadramento: "50% 50%", posicao: "faixa", mostrarGuia: false, paginas };
writeFileSync(saida, JSON.stringify(props, null, 2) + "\n");
for (const pg of paginas) console.log(`${pg.de.toFixed(2).padStart(7)} – ${pg.ate.toFixed(2).padStart(7)}  ${pg.texto}`);
console.log(`\n${paginas.length} páginas → ${saida}`);
console.log(`Revise: nomes próprios, e marque uma *palavra-chave* por página. Campos: pilar (${PILARES.join("|")}), posicao (faixa|terco-superior|base).`);
