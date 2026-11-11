// Tira um print de um site para usar na peça TelaSite (ou no TrocaPrints).
// Uso: npm run print-site -- <url> <slug> [nome] [celular|computador] [altura em px] [espera em ms]
//   celular (padrão): layout de celular, imagem de 1080 px de largura (o mais legível num vídeo vertical)
//   computador: layout de computador (1280 px), para mostrar a página como ela é no PC
//   espera: tempo depois de carregar, para animações e conteúdo que chega depois (padrão 2500)
// Saída: public\<slug>\<nome>.png (no projeto; é arquivo pequeno) e a cópia na pasta de trabalho.
//
// Usa o navegador interno do Remotion, num perfil temporário: sem login e sem cookies, só pega o que é público.
// Não clica em nada: aviso de cookies e pop-up saem no print. Se atrapalhar, peça um print a quem pediu o vídeo.
// (O "--screenshot" de linha de comando desse navegador trava; por isso a conversa é pelo protocolo DevTools.)
import { ensureBrowser } from "@remotion/renderer";
import { spawn } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { PUBLICO, PUBLICO_DO_PROJETO, RAIZ } from "./pastas.mjs";

const [url, slug, nomeArg, modoArg, alturaArg, esperaArg] = process.argv.slice(2);
if (!url || !slug) {
  console.error("Uso: npm run print-site -- <url> <slug> [nome] [celular|computador] [altura em px] [espera em ms]");
  process.exit(1);
}
let endereco;
try {
  endereco = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
} catch {
  console.error(`Endereço inválido: ${url}`);
  process.exit(1);
}
if (!["http:", "https:"].includes(endereco.protocol)) {
  console.error("Só http e https.");
  process.exit(1);
}
const celular = modoArg !== "computador";
const nome = (nomeArg ?? endereco.hostname.replace(/^www\./, "")).replace(/[^a-z0-9.-]+/gi, "-").toLowerCase();
const largura = celular ? 540 : 1280;
const fator = celular ? 2 : 1;
const altura = Math.min(6000, Math.max(400, Number(alturaArg ?? (celular ? 1600 : 1400))));
const espera = Math.min(20000, Math.max(0, Number(esperaArg ?? 2500)));

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
const pastaNavegador = path.join(RAIZ, "node_modules", ".remotion");
let navegador = acharNavegador(pastaNavegador);
if (!navegador) {
  await ensureBrowser();
  navegador = acharNavegador(pastaNavegador);
}
if (!navegador) {
  console.error("Não achei o navegador interno do Remotion. Rode um render qualquer antes (ele baixa na primeira vez).");
  process.exit(1);
}

const perfil = mkdtempSync(path.join(os.tmpdir(), "print-site-"));
const processo = spawn(navegador, ["--headless", "--remote-debugging-port=0", `--user-data-dir=${perfil}`, "--hide-scrollbars", "--no-first-run", "--mute-audio", "--enable-unsafe-swiftshader", "about:blank"], {
  stdio: ["ignore", "ignore", "pipe"],
});
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
  console.error("O site demorou mais de 60 s. Tente de novo ou peça um print a quem pediu o vídeo.");
  encerrar(1);
}, 60000);

try {
  // 1. espera o navegador dizer em que porta está
  const porta = await new Promise((ok, erro) => {
    let texto = "";
    processo.stderr.on("data", (d) => {
      texto += d;
      const m = /DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//.exec(texto);
      if (m) ok(Number(m[1]));
    });
    processo.on("exit", () => erro(new Error("o navegador fechou antes de abrir")));
  });
  const abas = await (await fetch(`http://127.0.0.1:${porta}/json/list`)).json();
  const aba = abas.find((a) => a.type === "page");
  if (!aba) throw new Error("o navegador não abriu nenhuma aba");

  // 2. conversa pelo protocolo DevTools
  const ws = new WebSocket(aba.webSocketDebuggerUrl);
  await new Promise((ok, erro) => {
    ws.onopen = ok;
    ws.onerror = () => erro(new Error("não consegui conectar ao navegador"));
  });
  let proximoId = 1;
  const pendentes = new Map();
  const ouvintes = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pendentes.has(msg.id)) {
      const { ok, erro } = pendentes.get(msg.id);
      pendentes.delete(msg.id);
      msg.error ? erro(new Error(msg.error.message)) : ok(msg.result);
    } else if (msg.method && ouvintes.has(msg.method)) ouvintes.get(msg.method)(msg.params);
  };
  const cdp = (method, params = {}) =>
    new Promise((ok, erro) => {
      const id = proximoId++;
      pendentes.set(id, { ok, erro });
      ws.send(JSON.stringify({ id, method, params }));
    });
  const evento = (method, ms) =>
    new Promise((ok) => {
      const t = setTimeout(() => ok(false), ms);
      ouvintes.set(method, () => {
        clearTimeout(t);
        ok(true);
      });
    });

  await cdp("Page.enable");
  await cdp("Emulation.setDeviceMetricsOverride", { width: largura, height: altura, deviceScaleFactor: fator, mobile: celular });
  if (celular) {
    await cdp("Emulation.setUserAgentOverride", {
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
    });
  }
  console.log(`Abrindo ${endereco.href} (${celular ? "celular" : "computador"}, ${largura * fator}x${altura * fator} px)...`);
  const carregou = evento("Page.loadEventFired", 30000);
  const nav = await cdp("Page.navigate", { url: endereco.href });
  if (nav.errorText) throw new Error(`o site não abriu (${nav.errorText})`);
  if (!(await carregou)) console.warn("AVISO: a página não terminou de carregar em 30 s; o print pode sair incompleto.");
  await new Promise((r) => setTimeout(r, espera));
  const { data } = await cdp("Page.captureScreenshot", { format: "png" });
  ws.close();

  const pastaProjeto = path.join(PUBLICO_DO_PROJETO, slug);
  mkdirSync(pastaProjeto, { recursive: true });
  const saida = path.join(pastaProjeto, `${nome}.png`);
  writeFileSync(saida, Buffer.from(data, "base64"));
  const pastaTrabalho = path.join(PUBLICO, slug);
  mkdirSync(pastaTrabalho, { recursive: true });
  copyFileSync(saida, path.join(pastaTrabalho, `${nome}.png`));

  console.log(`Pronto: ${saida} (${(statSync(saida).size / 1024).toFixed(0)} KB)`);
  console.log(`Na peça: <TelaSite imagem="${slug}/${nome}.png" url="${endereco.hostname.replace(/^www\./, "")}${endereco.pathname === "/" ? "" : endereco.pathname}" ... />`);
  console.log("Olhe a imagem antes de usar: aviso de cookies, pop-up, dado pessoal ou página de erro.");
  clearTimeout(limite);
  encerrar(0);
} catch (e) {
  console.error(`O print não saiu: ${e.message}`);
  clearTimeout(limite);
  encerrar(1);
}
