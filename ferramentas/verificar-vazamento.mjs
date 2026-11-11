#!/usr/bin/env node
// Confere que nenhum dado pessoal ou caminho de máquina está nos arquivos do projeto.
//   node ferramentas/verificar-vazamento.mjs
// Procura: caminhos absolutos de computador, e-mails, chaves e tokens, CPF e CNPJ, e as SUAS palavras proibidas
// (nome, apelido, domínio, clientes): uma por linha em .vazamento.local.txt, que fica fora do git.
// Nessa lista, uma linha começando com "!" libera um trecho exato (ex.: !github.com/voce/seu-repositorio).
// Uma linha com "vazamento:ok" é liberada de propósito. Sem dependências: Node 18 ou mais novo.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PULAR_PASTAS = new Set(["node_modules", ".git", "trabalho", "out"]);
const PULAR_ARQUIVOS = new Set(["package-lock.json", ".vazamento.local.txt"]);
const BINARIOS = /\.(png|jpe?g|gif|webp|ico|pdf|zip|woff2?|ttf|otf|mp3|wav|mp4|mov|webm)$/i;

const PADROES = [
  [/\b[A-Za-z]:\\(?!n|t|r|s|d|w|b)[A-Za-z0-9_]/, "caminho absoluto do Windows"],
  [/\/(Users|home)\/[A-Za-z0-9._-]+\//, "caminho da pasta de um usuário"],
  [/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}/, "e-mail"],
  [/\b(ghp_|gho_|github_pat_|sk-[A-Za-z0-9]{8}|AKIA[0-9A-Z]{8}|xox[bap]-)/, "chave ou token"], // vazamento:ok (é o próprio padrão de busca)
  [/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/, "CPF"],
  [/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/, "CNPJ"],
];
const locais = path.join(RAIZ, ".vazamento.local.txt");
const linhasLocais = existsSync(locais)
  ? readFileSync(locais, "utf8").split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"))
  : [];
const semAcento = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
// Na lista local, uma linha que começa com "!" é um trecho PERMITIDO (ex.: o endereço público do próprio repositório):
// ele é ignorado antes de procurar as palavras proibidas.
const palavras = linhasLocais.filter((l) => !l.startsWith("!"));
const permitidos = linhasLocais.filter((l) => l.startsWith("!")).map((l) => semAcento(l.slice(1).trim())).filter(Boolean);

const achados = [];
const andar = (pasta) => {
  for (const item of readdirSync(pasta)) {
    const caminho = path.join(pasta, item);
    if (statSync(caminho).isDirectory()) {
      if (!PULAR_PASTAS.has(item)) andar(caminho);
      continue;
    }
    if (PULAR_ARQUIVOS.has(item) || BINARIOS.test(item)) continue;
    const rel = path.relative(RAIZ, caminho);
    readFileSync(caminho, "utf8")
      .split(/\r?\n/)
      .forEach((linha, i) => {
        if (linha.includes("vazamento:ok")) return;
        for (const [re, nome] of PADROES) if (re.test(linha)) achados.push(`${rel}:${i + 1}  ${nome}  → ${linha.trim().slice(0, 110)}`);
        const baixa = permitidos.reduce((t, ok) => t.split(ok).join(" "), semAcento(linha));
        for (const p of palavras) if (baixa.includes(semAcento(p))) achados.push(`${rel}:${i + 1}  palavra proibida "${p}"  → ${linha.trim().slice(0, 110)}`);
      });
  }
};
andar(RAIZ);

if (achados.length) {
  console.log(achados.join("\n"));
  console.log(`\n${achados.length} achado(s). Corrija, ou marque a linha com "vazamento:ok" se for de propósito.`);
  process.exit(1);
}
console.log(`Nenhum vazamento${palavras.length ? ` (${palavras.length} palavras suas conferidas)` : " (sem lista local de palavras: crie .vazamento.local.txt com o seu nome e o seu domínio)"}.`);
