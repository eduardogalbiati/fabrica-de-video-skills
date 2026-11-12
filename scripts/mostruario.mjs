// Mostruário em uma imagem: um quadro de cada peça da biblioteca (o fim da animação), com o nome.
// Também serve para conferir os formatos e a capa: passe os Ids no fim.
// Uso: npm run mostruario                      → <catalogo>\mostruario.jpg (catálogo das peças; a pasta vem de estudio.config.json)
//      npm run mostruario -- formatos          → <pasta de trabalho>\out\formatos.jpg (demos dos formatos e capa, com o guia)
//      npm run mostruario -- efeitos           → <catalogo>\efeitos.jpg (efeitos sobre a gravação, com a pessoa de exemplo)
//      npm run mostruario -- efeitos <vídeo> [segundo] [pessoa.webm] [duração]  → <pasta de trabalho>\out\efeitos-gravacao.jpg
//                                              (sobre uma gravação, com a pessoa recortada; não vai ao catálogo)
//
// Para ver o mostruário com OUTRA marca, sem mexer na ativa (PowerShell):
//      $env:FABRICA_MARCA = "neutra"; npm run mostruario; Remove-Item Env:FABRICA_MARCA
//   → <pasta de trabalho>\out\mostruario-neutra.jpg  (o catálogo não é alterado)
import { renderStill, selectComposition } from "@remotion/renderer";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { empacotar, ESTILO_DE_TESTE, MARCA_DE_TESTE } from "./empacotar.mjs";
import { CATALOGO, RAIZ, SAIDA } from "./pastas.mjs";

const modo = process.argv[2] ?? "pecas";
// com marca ou estilo de teste, a imagem ganha o nome deles e não substitui a do catálogo
const sufixo = `${MARCA_DE_TESTE ? `-${MARCA_DE_TESTE}` : ""}${ESTILO_DE_TESTE ? `-estilo-${ESTILO_DE_TESTE}` : ""}`;
console.log("Empacotando o projeto...");
const serveUrl = await empacotar();
const tmp = mkdtempSync(path.join(os.tmpdir(), "mostruario-"));
mkdirSync(SAIDA, { recursive: true });
const tirar = async (id, frame, arquivo, inputProps = {}, escala = 0.4) => {
  const composition = await selectComposition({ serveUrl, id, inputProps });
  await renderStill({ composition, serveUrl, inputProps, frame: Math.min(frame, composition.durationInFrames - 1), scale: escala, imageFormat: "png", output: arquivo });
};
const juntar = (colunas, total, filtroAntes, saida) => {
  const r = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-loglevel", "error", "-y", "-framerate", "1", "-i", path.join(tmp, "q-%02d.png"), "-vf", `${filtroAntes}tile=${colunas}x${Math.ceil(total / colunas)}:padding=6:color=0x9aa8c0`, "-frames:v", "1", "-q:v", "3", saida],
    { stdio: "inherit" },
  );
  if (r.status !== 0) process.exit(r.status ?? 1);
};

try {
  if (modo === "efeitos") {
    // efeitos sobre a gravação: com a pessoa de exemplo (vai para o catálogo) ou, se vier um vídeo, sobre ele (só em out\)
    const video = process.argv[3] ?? "";
    const inicioVideo = Number(process.argv[4] ?? 0);
    const pessoa = process.argv[5] ?? ""; // o WebM da pessoa recortada (npm run recortar), para os efeitos que precisam dele
    const duracaoVideo = Number(process.argv[6] ?? 0); // se o mostruário for mais longo que a gravação, volta ao começo
    const tempos = JSON.parse(readFileSync(path.join(RAIZ, "src", "mostruario-efeitos.tempos.json"), "utf8"));
    const nomes = Object.keys(tempos).filter((k) => k !== "duracaoFala");
    // quadro de cada efeito: perto do fim; o corte de mergulho, no meio do mergulho
    // o zoom-out termina aberto: o quadro do catálogo é do começo, ainda fechado
    const quadroDe = { CorteMergulho: (inicio) => inicio + 43, ZoomOut: (inicio) => inicio + 8 };
    for (const [i, nome] of nomes.entries()) {
      const fim = i + 1 < nomes.length ? tempos[nomes[i + 1]] : tempos.duracaoFala;
      const quadro = quadroDe[nome] ? quadroDe[nome](Math.round(tempos[nome] * 30)) : Math.round(fim * 30) - 6;
      await tirar("MostruarioEfeitos", quadro, path.join(tmp, `q-${String(i + 1).padStart(2, "0")}.png`), { video, inicioVideo, pessoa, duracaoVideo }, 0.3);
      console.log(`${String(i + 1).padStart(2, " ")}. ${nome}`);
    }
    const saida = path.join(SAIDA, `efeitos${video ? "-gravacao" : ""}${sufixo}.jpg`);
    juntar(5, nomes.length, "", saida);
    if (video || MARCA_DE_TESTE || ESTILO_DE_TESTE) {
      console.log(`\nEfeitos (teste): ${saida}  (5 por linha, na ordem da lista acima)`);
    } else {
      mkdirSync(CATALOGO, { recursive: true });
      const noCatalogo = path.join(CATALOGO, "efeitos.jpg");
      copyFileSync(saida, noCatalogo);
      console.log(`\nEfeitos: ${noCatalogo}  (5 por linha, na ordem da lista acima)`);
    }
  } else if (modo === "formatos") {
    const quadros = [
      ["DemoRostoComJanela", 30],
      ["DemoRostoComJanela", 150],
      ["DemoTelaComRosto", 150],
      ["DemoTutorialMudo", 100],
      ["DemoTutorialMudo", 190],
      ["Capa", 0],
    ];
    for (const [i, [id, frame]] of quadros.entries()) {
      await tirar(id, frame, path.join(tmp, `q-${String(i + 1).padStart(2, "0")}.png`), { mostrarGuia: true }, 0.3);
      console.log(`${i + 1}. ${id} (quadro ${frame})`);
    }
    const saida = path.join(SAIDA, `formatos${sufixo}.jpg`);
    juntar(6, quadros.length, "", saida);
    console.log(`\nFormatos: ${saida}`);
  } else {
    const tempos = JSON.parse(readFileSync(path.join(RAIZ, "src", "mostruario.tempos.json"), "utf8"));
    const nomes = Object.keys(tempos).filter((k) => k !== "duracaoFala");
    for (const [i, nome] of nomes.entries()) {
      const fim = i + 1 < nomes.length ? tempos[nomes[i + 1]] : tempos.duracaoFala;
      await tirar("Mostruario", Math.round(fim * 30) - 6, path.join(tmp, `q-${String(i + 1).padStart(2, "0")}.png`));
      console.log(`${String(i + 1).padStart(2, " ")}. ${nome}`);
    }
    // só a metade de cima do quadro (é onde as peças vivem)
    const saida = path.join(SAIDA, `mostruario${sufixo}.jpg`);
    juntar(5, nomes.length, "crop=iw:ih/2:0:0,", saida);
    if (MARCA_DE_TESTE || ESTILO_DE_TESTE) {
      console.log(`\nMostruário de teste: ${saida}  (5 por linha, na ordem da lista acima)`);
    } else {
      mkdirSync(CATALOGO, { recursive: true });
      const noCatalogo = path.join(CATALOGO, "mostruario.jpg");
      copyFileSync(saida, noCatalogo);
      console.log(`\nMostruário: ${noCatalogo}  (5 por linha, na ordem da lista acima)`);
    }
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
process.exit(0);
