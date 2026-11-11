// Cria e testa marcas (o que muda de pessoa para pessoa na aparência dos vídeos).
//
//   npm run marca -- do-site <url>              lê cores e fontes de um site e sugere por onde começar
//   npm run marca -- do-video "<arquivo>"       lê cores, ritmo de corte e tira uma folha de quadros de um vídeo de referência
//   npm run marca -- criar <nome> <respostas.json>   monta marcas\<nome>\ (marca.json + fontes.ts) e confere contraste e fontes
//   npm run marca -- ver <nome>                 mostruário com essa marca, sem trocar a ativa → out\mostruario-<nome>.jpg
//   npm run marca -- usar <nome>                troca a marca ATIVA (guarda a anterior em marcas\_anterior-<data>\)
//   npm run marca -- listar
//
// respostas.json (só "assinatura" e "acento" são obrigatórios; o resto tem padrão):
// {
//   "nome": "Minha Marca", "assinatura": "@meunome", "pessoa": { "nome": "Meu Nome", "cargo": "O que eu faço" },
//   "fundo": "escuro" | "claro" | "#101014",       cor de fundo (ou o tom geral)
//   "acento": "#22c55e",                            a cor principal
//   "temas": [ { "chave": "principal", "nome": "Canal", "acento": "#22c55e" } ],   opcional: uma cor por linha editorial
//   "fontes": { "titulos": "Inter", "texto": "Inter", "mono": "JetBrains Mono" },  nomes do Google Fonts
//   "estrelas": false,
//   "encerramento": { "frase": "Vídeo novo toda semana", "cta": "Me segue" }
// }
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { RAIZ } from "./pastas.mjs";

const [modo, ...args] = process.argv.slice(2);
const MARCAS = path.join(RAIZ, "marcas");
const ATIVA = path.join(RAIZ, "marca");
const falhar = (msg) => {
  console.error(msg);
  process.exit(1);
};

// ───────── cores ─────────
const hexParaRgb = (hex) => {
  const h = hex.replace("#", "");
  const c = h.length === 3 ? [...h].map((x) => x + x).join("") : h.slice(0, 6);
  return [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16));
};
const rgbParaHex = (rgb) => "#" + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
const misturar = (a, b, t) => rgbParaHex(hexParaRgb(a).map((v, i) => v + (hexParaRgb(b)[i] - v) * t));
const luminancia = (hex) => {
  const [r, g, b] = hexParaRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contraste = (a, b) => {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const ehHex = (v) => typeof v === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v);

// ───────── fontes ─────────
const pastaFontes = path.join(RAIZ, "node_modules", "@remotion", "google-fonts", "dist", "esm");
const nomeDeImport = (familia) => familia.replace(/[^A-Za-z0-9]/g, "");
const fonteExiste = (familia) => existsSync(path.join(pastaFontes, `${nomeDeImport(familia)}.mjs`));
const pesosDaFonte = (familia) => {
  const texto = readFileSync(path.join(pastaFontes, `${nomeDeImport(familia)}.mjs`), "utf8");
  const normal = /normal:\s*\{([\s\S]*?)\n\s{4}\}/.exec(texto)?.[1] ?? texto;
  return [...new Set([...normal.matchAll(/["']?(\d{3})["']?\s*:\s*\{/g)].map((m) => m[1]))].sort();
};
const escolherPesos = (familia, desejados) => {
  const tem = pesosDaFonte(familia);
  if (!tem.length) return desejados;
  return [...new Set(desejados.map((d) => tem.reduce((melhor, p) => (Math.abs(p - d) < Math.abs(melhor - d) ? p : melhor), tem[0])))];
};

const listar = () => {
  const ativa = JSON.parse(readFileSync(path.join(ATIVA, "marca.json"), "utf8"));
  console.log(`Ativa: ${ativa.nome} (pasta marca\\)`);
  if (existsSync(MARCAS)) for (const d of readdirSync(MARCAS)) if (existsSync(path.join(MARCAS, d, "marca.json"))) console.log(`  marcas\\${d}: ${JSON.parse(readFileSync(path.join(MARCAS, d, "marca.json"), "utf8")).nome}`);
};

const criar = () => {
  const [nome, arquivo] = args;
  if (!nome || !arquivo) falhar("Uso: npm run marca -- criar <nome> <respostas.json>");
  if (!/^[a-z0-9-]+$/.test(nome)) falhar("O nome da pasta da marca usa só letras minúsculas, números e hífen (ex.: minha-marca).");
  const r = JSON.parse(readFileSync(arquivo, "utf8"));
  if (!r.assinatura) falhar('Falta "assinatura" (o que aparece no canto dos vídeos, ex.: "@meunome" ou "meusite.com").');
  if (!ehHex(r.acento)) falhar('Falta "acento" em #hex (a cor principal).');

  // fundo: "escuro", "claro" ou um #hex
  const fundoPedido = r.fundo ?? "escuro";
  const bg000 = ehHex(fundoPedido) ? fundoPedido : fundoPedido === "claro" ? "#f7f7f5" : "#101014";
  const claro = luminancia(bg000) > 0.4;
  const tinta = claro ? "#16161a" : "#f4f4f5";
  const cores = {
    bg000,
    bg100: misturar(bg000, tinta, 0.05),
    bg200: misturar(bg000, tinta, 0.11),
    ink: tinta,
    inkMuted: misturar(tinta, bg000, 0.38),
    line: tinta + "1f",
    danger: claro ? "#c62828" : "#ef4444",
  };
  const listaDeTemas = r.temas?.length ? r.temas : [{ chave: "principal", nome: r.nome ?? "Canal", acento: r.acento }];
  const temas = {};
  const avisos = [];
  for (const t of listaDeTemas) {
    if (!/^[a-z0-9]+$/.test(t.chave ?? "")) falhar(`Tema com "chave" inválida (só letras minúsculas e números): ${JSON.stringify(t)}`);
    if (!ehHex(t.acento)) falhar(`Tema "${t.chave}" sem "acento" em #hex.`);
    const noBotao = contraste(t.acento, cores.bg000) >= contraste(t.acento, cores.ink) ? "bg000" : "ink";
    temas[t.chave] = { acento: t.acento, soft: misturar(t.acento, claro ? "#000000" : "#ffffff", claro ? 0.25 : 0.45), nome: t.nome ?? t.chave, textoNoBotao: noBotao };
    const c = contraste(t.acento, cores.bg000);
    if (c < 3) avisos.push(`tema "${t.chave}": o acento ${t.acento} tem pouco contraste com o fundo (${c.toFixed(1)}; o mínimo para texto grande é 3). Escolha um tom mais ${claro ? "escuro" : "claro"}.`);
  }
  if (contraste(cores.ink, cores.bg000) < 7) avisos.push("o texto tem contraste baixo com o fundo: escolha um fundo mais extremo (bem escuro ou bem claro).");

  const f = { titulos: "Inter", texto: "Inter", mono: "JetBrains Mono", ...(r.fontes ?? {}) };
  for (const [papel, familia] of Object.entries(f)) {
    if (!fonteExiste(familia)) falhar(`A fonte "${familia}" (${papel}) não está no Google Fonts do Remotion. Confira o nome exato (ex.: "Inter", "Space Grotesk").`);
  }
  const linha = (alias, familia, pesos) => `const ${alias} = load${alias}("normal", { weights: ${JSON.stringify(escolherPesos(familia, pesos).map(String))}, subsets: ["latin", "latin-ext"] }).fontFamily;`;
  const fontesTs = [
    `// Fontes da marca "${r.nome ?? nome}" (Google Fonts). Gerado por npm run marca -- criar.`,
    `import { loadFont as loadTitulos } from "@remotion/google-fonts/${nomeDeImport(f.titulos)}";`,
    `import { loadFont as loadTexto } from "@remotion/google-fonts/${nomeDeImport(f.texto)}";`,
    `import { loadFont as loadMono } from "@remotion/google-fonts/${nomeDeImport(f.mono)}";`,
    "",
    linha("Titulos", f.titulos, [500, 700, 800]),
    linha("Texto", f.texto, [400, 600]),
    linha("Mono", f.mono, [400, 500, 700]),
    "",
    "export const fonteDisplay = Titulos;",
    "export const fonteBody = Texto;",
    "export const fonteMono = Mono;",
    "",
  ].join("\n");

  const primeiro = Object.keys(temas)[0];
  const marca = {
    nome: r.nome ?? nome,
    referencia: r.referencia ?? "",
    versao: `criada em ${new Date().toISOString().slice(0, 10)}`,
    site: r.assinatura,
    pessoa: { nome: r.pessoa?.nome ?? "", cargo: r.pessoa?.cargo ?? "" },
    cores,
    temas,
    temaPadrao: r.temaPadrao && temas[r.temaPadrao] ? r.temaPadrao : primeiro,
    fundo: { estrelas: Boolean(r.estrelas) },
    encerramento: { tema: primeiro, frase: r.encerramento?.frase ?? "", cta: r.encerramento?.cta ?? "Me segue" },
  };
  const pasta = path.join(MARCAS, nome);
  mkdirSync(pasta, { recursive: true });
  writeFileSync(path.join(pasta, "marca.json"), JSON.stringify(marca, null, 2) + "\n");
  writeFileSync(path.join(pasta, "fontes.ts"), fontesTs);
  console.log(`Marca criada em ${pasta}`);
  console.log(`  fundo ${cores.bg000} (${claro ? "claro" : "escuro"}), texto ${cores.ink}, temas: ${Object.entries(temas).map(([k, t]) => `${k} ${t.acento}`).join(", ")}`);
  console.log(`  fontes: ${f.titulos} / ${f.texto} / ${f.mono}`);
  for (const a of avisos) console.warn(`AVISO: ${a}`);
  console.log(`Veja como fica: npm run marca -- ver ${nome}`);
};

const ver = () => {
  const [nome] = args;
  if (!nome || !existsSync(path.join(MARCAS, nome, "marca.json"))) falhar("Uso: npm run marca -- ver <nome>   (veja as que existem com: npm run marca -- listar)");
  const r = spawnSync(process.execPath, [path.join(RAIZ, "scripts", "mostruario.mjs")], { cwd: RAIZ, stdio: "inherit", env: { ...process.env, FABRICA_MARCA: nome } });
  process.exit(r.status ?? 1);
};

const usar = () => {
  const [nome] = args;
  const origem = path.join(MARCAS, nome ?? "");
  if (!nome || !existsSync(path.join(origem, "marca.json")) || !existsSync(path.join(origem, "fontes.ts"))) falhar("Uso: npm run marca -- usar <nome>");
  const data = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  const guarda = path.join(MARCAS, `_anterior-${data}`);
  mkdirSync(guarda, { recursive: true });
  for (const arq of ["marca.json", "fontes.ts"]) {
    cpSync(path.join(ATIVA, arq), path.join(guarda, arq));
    cpSync(path.join(origem, arq), path.join(ATIVA, arq));
  }
  console.log(`Marca ativa agora: ${nome}. A anterior ficou em ${guarda}.`);
  console.log("Os vídeos já feitos com temas da marca antiga (prop pilar) podem não abrir: confira com npx tsc.");
};

// Lê cores e fontes de um site pelo navegador interno do Remotion (mesmo caminho do print-site).
const doSite = async () => {
  const [url] = args;
  if (!url) falhar("Uso: npm run marca -- do-site <url>");
  const endereco = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
  const { spawn } = await import("node:child_process");
  const { mkdtempSync, rmSync } = await import("node:fs");
  const os = await import("node:os");
  const acharNavegador = (pasta) => {
    if (!existsSync(pasta)) return null;
    for (const item of readdirSync(pasta)) {
      const caminho = path.join(pasta, item);
      if (statSync(caminho).isDirectory()) {
        const achou = acharNavegador(caminho);
        if (achou) return achou;
      } else if (/^chrome-headless-shell(\.exe)?$/.test(item)) return caminho;
    }
    return null;
  };
  const navegador = acharNavegador(path.join(RAIZ, "node_modules", ".remotion"));
  if (!navegador) falhar("Não achei o navegador interno do Remotion. Rode um render qualquer antes (ele baixa na primeira vez).");
  const perfil = mkdtempSync(path.join(os.tmpdir(), "marca-site-"));
  const processo = spawn(navegador, ["--headless", "--remote-debugging-port=0", `--user-data-dir=${perfil}`, "--no-first-run", "--mute-audio", "--enable-unsafe-swiftshader", "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
  const encerrar = (codigo) => {
    try {
      processo.kill();
    } catch {}
    setTimeout(() => {
      rmSync(perfil, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
      process.exit(codigo);
    }, 400);
  };
  const limite = setTimeout(() => {
    console.error("O site demorou mais de 60 s.");
    encerrar(1);
  }, 60000);
  try {
    const porta = await new Promise((ok, erro) => {
      let texto = "";
      processo.stderr.on("data", (d) => {
        texto += d;
        const m = /DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//.exec(texto);
        if (m) ok(Number(m[1]));
      });
      processo.on("exit", () => erro(new Error("o navegador fechou antes de abrir")));
    });
    const aba = (await (await fetch(`http://127.0.0.1:${porta}/json/list`)).json()).find((a) => a.type === "page");
    const ws = new WebSocket(aba.webSocketDebuggerUrl);
    await new Promise((ok, erro) => {
      ws.onopen = ok;
      ws.onerror = () => erro(new Error("não consegui conectar ao navegador"));
    });
    let id = 1;
    const pendentes = new Map();
    let aoCarregar = () => {};
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pendentes.has(msg.id)) {
        pendentes.get(msg.id)(msg);
        pendentes.delete(msg.id);
      } else if (msg.method === "Page.loadEventFired") aoCarregar();
    };
    const cdp = (method, params = {}) =>
      new Promise((ok, erro) => {
        const n = id++;
        pendentes.set(n, (msg) => (msg.error ? erro(new Error(msg.error.message)) : ok(msg.result)));
        ws.send(JSON.stringify({ id: n, method, params }));
      });
    await cdp("Page.enable");
    await cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    const carregou = new Promise((ok) => {
      aoCarregar = ok;
      setTimeout(ok, 30000);
    });
    await cdp("Page.navigate", { url: endereco.href });
    await carregou;
    await new Promise((r) => setTimeout(r, 2500));
    const coleta = `(() => {
      const hex = (c) => { const m = /rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?/.exec(c); if (!m || m[4] === "0") return null; return "#" + [m[1], m[2], m[3]].map((v) => Number(v).toString(16).padStart(2, "0")).join(""); };
      const estilo = (el) => (el ? getComputedStyle(el) : null);
      const conta = {};
      const somar = (c, peso) => { if (c) conta[c] = (conta[c] || 0) + peso; };
      for (const el of document.querySelectorAll("a, button, [class*=btn], [class*=button], h1, h2, mark, strong")) {
        const s = getComputedStyle(el); const r = el.getBoundingClientRect(); if (r.width < 4 || r.height < 4) continue;
        somar(hex(s.backgroundColor), /button|btn/i.test(el.tagName + el.className) ? 3 : 1); somar(hex(s.color), 1);
      }
      const fundo = hex(estilo(document.body).backgroundColor) || hex(estilo(document.documentElement).backgroundColor) || "#ffffff";
      const texto = hex(estilo(document.body).color);
      const cinza = (c) => { const v = [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)); return Math.max(...v) - Math.min(...v) < 28; };
      const coloridas = Object.entries(conta).filter(([c]) => !cinza(c) && c !== fundo).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([c, n]) => ({ cor: c, vezes: n }));
      const familia = (el) => (el ? getComputedStyle(el).fontFamily.split(",")[0].replace(/["']/g, "").trim() : null);
      const variaveis = [...document.styleSheets].flatMap((f) => { try { return [...f.cssRules]; } catch { return []; } }).filter((r) => r.selectorText === ":root").flatMap((r) => [...r.style].filter((p) => p.startsWith("--")).map((p) => [p, r.style.getPropertyValue(p).trim()])).filter(([, v]) => /^#|^rgb|^hsl/.test(v)).slice(0, 24);
      return JSON.stringify({ titulo: document.title, fundo, texto, coloridas, fontes: { titulos: familia(document.querySelector("h1, h2")), texto: familia(document.body), mono: familia(document.querySelector("code, pre, kbd")) }, variaveis });
    })()`;
    const { result } = await cdp("Runtime.evaluate", { expression: coleta, returnByValue: true });
    ws.close();
    const dados = JSON.parse(result.value);
    console.log(`Site: ${dados.titulo}`);
    console.log(`Fundo ${dados.fundo}  ·  texto ${dados.texto}`);
    console.log(`Cores que mais aparecem em botões, links e títulos: ${dados.coloridas.map((c) => `${c.cor} (${c.vezes})`).join(", ") || "nenhuma colorida"}`);
    console.log(`Fontes: títulos "${dados.fontes.titulos}", texto "${dados.fontes.texto}"${dados.fontes.mono ? `, código "${dados.fontes.mono}"` : ""}`);
    for (const [papel, f] of Object.entries(dados.fontes)) if (f && !fonteExiste(f)) console.log(`  (a fonte "${f}" de ${papel} não está no Google Fonts: escolha uma parecida)`);
    if (dados.variaveis.length) console.log(`Variáveis de cor do site: ${dados.variaveis.map(([k, v]) => `${k}=${v}`).join("  ")}`);
    console.log("\nIsso é ponto de partida para o respostas.json. Só use as cores e fontes de um site que é da própria pessoa.");
    clearTimeout(limite);
    encerrar(0);
  } catch (e) {
    console.error(`Não consegui ler o site: ${e.message}`);
    clearTimeout(limite);
    encerrar(1);
  }
};

// Lê o estilo de um vídeo de referência (arquivo no PC): cores que dominam, ritmo de corte e uma folha de quadros.
// Serve de inspiração para o respostas.json. Copia o estilo geral, nunca logo, vinheta, personagem ou fonte de outra pessoa.
const doVideo = async () => {
  const [arquivo] = args;
  if (!arquivo || !existsSync(arquivo)) falhar('Uso: npm run marca -- do-video "<arquivo de vídeo>"   (link não serve: a pessoa baixa o vídeo que tem direito de usar)');
  const { SAIDA } = await import("./pastas.mjs");
  const sonda = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration", "-of", "json", arquivo], { encoding: "utf8" });
  if (sonda.status !== 0) falhar(sonda.stderr || "ffprobe falhou");
  const info = JSON.parse(sonda.stdout);
  const dur = Number(info.format.duration);
  const { width, height } = info.streams[0];

  // 1. cores: um quadro por segundo, bem pequeno; conta as cores arredondadas
  const L = 96;
  const bruto = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", arquivo, "-vf", `fps=1,scale=${L}:${L}`, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], { maxBuffer: 512 * 1024 * 1024 });
  if (bruto.status !== 0) falhar("Não consegui ler os quadros do vídeo.");
  const juntar = (mapa, chave, r, g, b) => {
    const c = mapa.get(chave) ?? { n: 0, r: 0, g: 0, b: 0 };
    c.n++;
    c.r += r;
    c.g += g;
    c.b += b;
    mapa.set(chave, c);
  };
  const caixas = new Map(); // todas as cores, arredondadas: acha o fundo e os tons claros
  const matizes = new Map(); // só as cores vivas, por faixa de matiz de 15 graus: acha os acentos, mesmo em traços finos
  const picos = new Map();
  const px = bruto.stdout;
  for (let i = 0; i + 2 < px.length; i += 3) {
    const [r, g, b] = [px[i], px[i + 1], px[i + 2]];
    juntar(caixas, ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4), r, g, b);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max > 110 && (max - min) / max > 0.5) {
      const d = max - min;
      const h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      const faixa = Math.floor((h * 60) / 15);
      juntar(matizes, faixa, r, g, b);
      // guarda também o tom mais puro da faixa: a média sai apagada pela compressão e pelas bordas
      const forca = ((max - min) / max) * max;
      if (forca > (picos.get(faixa)?.forca ?? 0)) picos.set(faixa, { forca, hex: rgbParaHex([r, g, b]) });
    }
  }
  const total = px.length / 3;
  const resumir = (mapa) =>
    [...mapa.entries()]
      .map(([chave, c]) => {
        const rgb = [c.r / c.n, c.g / c.n, c.b / c.n];
        const max = Math.max(...rgb);
        return { chave, hex: rgbParaHex(rgb), parte: c.n / total, saturacao: max === 0 ? 0 : (max - Math.min(...rgb)) / max, brilho: max / 255 };
      })
      .sort((a, b) => b.parte - a.parte);
  const cores = resumir(caixas);
  const pct = (v) => `${(v * 100).toFixed(1)}%`;
  const fundo = cores[0];
  const vivas = resumir(matizes)
    .filter((c) => c.parte > 0.0005)
    .slice(0, 4)
    .map((c) => ({ ...c, hex: picos.get(c.chave)?.hex ?? c.hex }));
  const claras = cores.filter((c) => c.brilho > 0.85 && c.saturacao < 0.2).slice(0, 2);

  // 2. ritmo: quantas trocas de cena
  const cenas = spawnSync("ffmpeg", ["-hide_banner", "-i", arquivo, "-vf", "select='gt(scene,0.3)',showinfo", "-an", "-f", "null", "-"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).stderr;
  const cortes = (cenas.match(/pts_time:/g) ?? []).length;

  // 3. folha de quadros para a IA olhar (layout, legenda, onde fica o rosto)
  mkdirSync(SAIDA, { recursive: true });
  const folha = path.join(SAIDA, `estilo-${path.parse(arquivo).name.replace(/[^a-z0-9-]+/gi, "-").toLowerCase()}.jpg`);
  spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", arquivo, "-vf", `fps=${(12 / dur).toFixed(4)},scale=270:-2,tile=6x2:padding=6:color=0x9aa8c0`, "-frames:v", "1", "-q:v", "3", folha], { stdio: "inherit" });

  console.log(`Vídeo: ${width}x${height}, ${dur.toFixed(1)} s`);
  console.log(`Fundo provável: ${fundo.hex} (${pct(fundo.parte)} da imagem, ${luminancia(fundo.hex) > 0.4 ? "claro" : "escuro"})`);
  console.log(`Cores vivas (candidatas a acento): ${vivas.map((c) => `${c.hex} ${pct(c.parte)}`).join(", ") || "nenhuma: vídeo quase sem cor"}`);
  if (claras.length) console.log(`Tons claros (texto ou cartões): ${claras.map((c) => c.hex).join(", ")}`);
  console.log(`Trocas bruscas de imagem: ${cortes} em ${dur.toFixed(0)} s${cortes ? ` (uma a cada ${(dur / cortes).toFixed(1)} s)` : ""}. Corte seco no mesmo enquadramento e troca com fade quase não entram nessa conta: confira o ritmo na folha.`);
  console.log(`Folha de quadros: ${folha}`);
  console.log("\nOlhe a folha para o que os números não dizem: onde fica a legenda, o rosto, os cartões e que tipo de letra é.");
  console.log("Aproveite o estilo geral (cores, ritmo, posição da legenda). Logo, vinheta, personagem e fonte paga de outra pessoa não se copiam.");
};

if (modo === "listar") listar();
else if (modo === "criar") criar();
else if (modo === "ver") ver();
else if (modo === "usar") usar();
else if (modo === "do-site") await doSite();
else if (modo === "do-video") await doVideo();
else falhar('Uso: npm run marca -- listar | do-site <url> | do-video "<arquivo>" | criar <nome> <respostas.json> | ver <nome> | usar <nome>');
