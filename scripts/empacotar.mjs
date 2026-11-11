// Empacota o projeto para os scripts que renderizam pela API (mostruário, folha, retrato).
// Normalmente usa a marca ativa (pasta marca\) e o estilo ativo (estilos\ativo.ts). Para TESTAR outra marca
// e/ou outro estilo sem mexer nos ativos:
//   $env:FABRICA_MARCA = "neutra"; $env:FABRICA_ESTILO = "orbita"; npm run mostruario; Remove-Item Env:FABRICA_MARCA, Env:FABRICA_ESTILO
// Nesse caso os arquivos da marca (marca.json e fontes.ts) são trocados pelos de marcas\<nome>\ e o estilo ativo
// pelo de estilos\<nome>\estilo.json, só dentro deste empacotamento. Nada muda no disco.
// O render pela linha de comando e o Studio fazem a mesma troca pelo remotion.config.ts (ver scripts\renderizar.mjs).
import { bundle, webpack } from "@remotion/bundler";
import { existsSync } from "node:fs";
import path from "node:path";
import { PUBLICO, RAIZ } from "./pastas.mjs";

export const MARCA_DE_TESTE = process.env.FABRICA_MARCA ?? "";
export const ESTILO_DE_TESTE = process.env.FABRICA_ESTILO ?? "";

// Plugins do webpack que trocam a marca e o estilo (lista vazia quando nada foi pedido).
export const trocasDeCamada = (raiz = RAIZ, marca = MARCA_DE_TESTE, estilo = ESTILO_DE_TESTE) => {
  const plugins = [];
  if (marca) {
    const pasta = path.join(raiz, "marcas", marca);
    if (!existsSync(path.join(pasta, "marca.json")) || !existsSync(path.join(pasta, "fontes.ts"))) {
      throw new Error(`Não achei a marca "${marca}" (precisa de marca.json e fontes.ts em ${pasta}).`);
    }
    plugins.push(
      new webpack.NormalModuleReplacementPlugin(/[\\/]marca[\\/](marca\.json|fontes)$/, (recurso) => {
        recurso.request = path.join(pasta, recurso.request.endsWith("marca.json") ? "marca.json" : "fontes.ts");
      }),
    );
  }
  if (estilo) {
    const arquivo = path.join(raiz, "estilos", estilo, "estilo.json");
    if (!existsSync(arquivo)) throw new Error(`Não achei o estilo "${estilo}" (precisa de ${arquivo}).`);
    plugins.push(
      new webpack.NormalModuleReplacementPlugin(/[\\/]estilos[\\/]ativo$/, (recurso) => {
        recurso.request = arquivo;
      }),
    );
  }
  return plugins;
};

export const empacotar = async () => {
  const plugins = trocasDeCamada();
  if (MARCA_DE_TESTE) console.log(`Marca de teste: ${MARCA_DE_TESTE} (a marca ativa não muda)`);
  if (ESTILO_DE_TESTE) console.log(`Estilo de teste: ${ESTILO_DE_TESTE} (o estilo ativo não muda)`);
  const webpackOverride = plugins.length ? (config) => ({ ...config, plugins: [...(config.plugins ?? []), ...plugins] }) : (config) => config;
  return bundle({ entryPoint: path.join(RAIZ, "src", "index.ts"), publicDir: PUBLICO, webpackOverride });
};
