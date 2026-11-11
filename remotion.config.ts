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
