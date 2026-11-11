#!/usr/bin/env node
// Testa a documentação como se fosse código: o que as skills citam precisa existir.
//   node ferramentas/verificar-guias.mjs
// Confere, em cada SKILL.md e nos .md da raiz:
//   - cabeçalho da skill: `name` igual ao nome da pasta e `description` preenchida;
//   - tamanho: no máximo 500 linhas por skill;
//   - todo caminho de arquivo do projeto citado entre crases existe;
//   - todo `npm run <comando>` citado existe no package.json;
//   - toda skill `fabrica-videos-...` citada existe.
// Sem dependências: Node 18 ou mais novo.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS = path.join(RAIZ, ".claude", "skills");
const scripts = Object.keys(JSON.parse(readFileSync(path.join(RAIZ, "package.json"), "utf8")).scripts ?? {});
const skills = existsSync(SKILLS) ? readdirSync(SKILLS).filter((d) => statSync(path.join(SKILLS, d)).isDirectory()) : [];
// pastas cujo conteúdo precisa existir no repositório (as outras são criadas em tempo de uso)
const FIXAS = /^(src|scripts|marca|marcas|roteiros|public|docs|ferramentas|\.claude)\//;
const RAIZ_FIXOS = new Set(["CLAUDE.md", "README.md", "estudio.config.json", "package.json", "remotion.config.ts", "tsconfig.json"]);

const problemas = [];
const conferir = (arquivo, ehSkill) => {
  const rel = path.relative(RAIZ, arquivo);
  const texto = readFileSync(arquivo, "utf8");
  const linhas = texto.split(/\r?\n/);
  if (ehSkill) {
    const pasta = path.basename(path.dirname(arquivo));
    const cab = /^---\r?\n([\s\S]*?)\r?\n---/.exec(texto)?.[1] ?? "";
    const nome = /^name:\s*(.+)$/m.exec(cab)?.[1]?.trim();
    const desc = /^description:\s*(.+)$/m.exec(cab)?.[1]?.trim();
    if (nome !== pasta) problemas.push(`${rel}: o "name" do cabeçalho (${nome ?? "ausente"}) não bate com a pasta (${pasta})`);
    if (!desc) problemas.push(`${rel}: falta a "description" no cabeçalho`);
    else if (desc.length > 1024) problemas.push(`${rel}: "description" com ${desc.length} letras (máximo 1024)`);
    if (linhas.length > 500) problemas.push(`${rel}: ${linhas.length} linhas (máximo 500; mova detalhes para um arquivo de referência)`);
  }
  linhas.forEach((linha, i) => {
    for (const m of linha.matchAll(/`([^`]+)`/g)) {
      const citado = m[1].trim();
      for (const c of citado.matchAll(/npm run ([a-z][a-z0-9-]*)/g)) if (!scripts.includes(c[1])) problemas.push(`${rel}:${i + 1}: \`npm run ${c[1]}\` não existe no package.json`);
      if (/[<>*{}…|]|AAAA|\s/.test(citado)) continue; // modelo de caminho, não caminho
      const caminho = citado.replace(/\\/g, "/").replace(/^\.\//, "").replace(/[.,;:]$/, "");
      if (FIXAS.test(caminho) || RAIZ_FIXOS.has(caminho)) {
        if (!existsSync(path.join(RAIZ, caminho))) problemas.push(`${rel}:${i + 1}: \`${citado}\` não existe`);
      }
    }
    for (const m of linha.matchAll(/\bfabrica-videos-[a-z-]+/g)) if (!skills.includes(m[0])) problemas.push(`${rel}:${i + 1}: a skill ${m[0]} não existe`);
  });
};

let conferidos = 0;
for (const s of skills) {
  for (const arq of readdirSync(path.join(SKILLS, s)).filter((a) => a.endsWith(".md"))) {
    conferir(path.join(SKILLS, s, arq), arq === "SKILL.md");
    conferidos++;
  }
}
for (const arq of ["README.md", "CLAUDE.md", path.join("marca", "README.md")]) {
  if (existsSync(path.join(RAIZ, arq))) {
    conferir(path.join(RAIZ, arq), false);
    conferidos++;
  }
}

if (problemas.length) {
  console.log(problemas.join("\n"));
  console.log(`\n${problemas.length} problema(s) em ${conferidos} arquivo(s).`);
  process.exit(1);
}
console.log(`Guias em ordem: ${conferidos} arquivo(s), ${skills.length} skill(s), nenhum caminho ou comando quebrado.`);
