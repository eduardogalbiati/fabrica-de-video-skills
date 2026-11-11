// Empacota o projeto para os scripts que renderizam pela API (mostruário, folha).
// Normalmente usa a marca ativa (pasta marca\). Para TESTAR outra marca sem mexer na ativa:
//   $env:FABRICA_MARCA = "neutra"; npm run mostruario; Remove-Item Env:FABRICA_MARCA
// Nesse caso os dois arquivos da marca (marca.json e fontes.ts) são trocados pelos de marcas\<nome>\
// só dentro deste empacotamento. Nada muda no disco, e os renders normais continuam com a marca ativa.
import { bundle, webpack } from "@remotion/bundler";
import { existsSync } from "node:fs";
import path from "node:path";
import { PUBLICO, RAIZ } from "./pastas.mjs";

export const MARCA_DE_TESTE = process.env.FABRICA_MARCA ?? "";

export const empacotar = async () => {
  let webpackOverride = (config) => config;
  if (MARCA_DE_TESTE) {
    const pasta = path.join(RAIZ, "marcas", MARCA_DE_TESTE);
    if (!existsSync(path.join(pasta, "marca.json")) || !existsSync(path.join(pasta, "fontes.ts"))) {
      throw new Error(`Não achei a marca "${MARCA_DE_TESTE}" (precisa de marca.json e fontes.ts em ${pasta}).`);
    }
    console.log(`Marca de teste: ${MARCA_DE_TESTE} (a marca ativa não muda)`);
    webpackOverride = (config) => ({
      ...config,
      plugins: [
        ...(config.plugins ?? []),
        new webpack.NormalModuleReplacementPlugin(/[\\/]marca[\\/](marca\.json|fontes)$/, (recurso) => {
          recurso.request = path.join(pasta, recurso.request.endsWith("marca.json") ? "marca.json" : "fontes.ts");
        }),
      ],
    });
  }
  return bundle({ entryPoint: path.join(RAIZ, "src", "index.ts"), publicDir: PUBLICO, webpackOverride });
};
