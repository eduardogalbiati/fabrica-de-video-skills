import { webpack } from "@remotion/bundler";
import { Config } from "@remotion/cli/config";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// Porta fixa do Studio: a 3000 (padrão do Remotion) costuma estar ocupada por outros projetos.
Config.setStudioPort(3210);

// O Remotion lê os arquivos de staticFile() na pasta de trabalho, que pode ficar fora do projeto
// (gravações são grandes e não devem entrar em backup nem em repositório). O caminho fica em estudio.config.json;
// "npm run preparar" espelha ali os arquivos pequenos da pasta public/ daqui.
// Rode os comandos sempre da raiz do projeto.
const arquivoConfig = path.join(process.cwd(), "estudio.config.json");
if (existsSync(arquivoConfig)) {
  const { trabalho } = JSON.parse(readFileSync(arquivoConfig, "utf8"));
  const publico = path.resolve(process.cwd(), process.env.REELS_TRABALHO ?? trabalho ?? "trabalho", "public");
  if (existsSync(publico)) Config.setPublicDir(publico);
}

// Marca e estilo de um render ou do Studio sem trocar os ativos: variáveis FABRICA_MARCA (pasta de marcas/)
// e FABRICA_ESTILO (pasta de estilos/). O jeito fácil: npm run renderizar -- <Id> <saída> marca=<nome> estilo=<nome>
// (mesma troca do scripts/empacotar.mjs, que serve aos scripts que renderizam pela API).
Config.overrideWebpackConfig((config) => {
  const marca = process.env.FABRICA_MARCA;
  const estilo = process.env.FABRICA_ESTILO;
  if (!marca && !estilo) return config;
  const plugins = [...(config.plugins ?? [])];
  if (marca) {
    const pasta = path.join(process.cwd(), "marcas", marca);
    plugins.push(
      new webpack.NormalModuleReplacementPlugin(/[\\/]marca[\\/](marca\.json|fontes)$/, (recurso: { request: string }) => {
        recurso.request = path.join(pasta, recurso.request.endsWith("marca.json") ? "marca.json" : "fontes.ts");
      }),
    );
  }
  if (estilo) {
    const arquivo = path.join(process.cwd(), "estilos", estilo, "estilo.json");
    plugins.push(
      new webpack.NormalModuleReplacementPlugin(/[\\/]estilos[\\/]ativo$/, (recurso: { request: string }) => {
        recurso.request = arquivo;
      }),
    );
  }
  return { ...config, plugins };
});
