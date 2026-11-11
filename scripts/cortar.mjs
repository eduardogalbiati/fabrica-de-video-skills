// Corte automático: tira silêncios, erros e tomadas repetidas de uma gravação falada.
//
//   1) npm run cortar -- analisar "<vídeo>" [legendas.json] [ruído em dB, ex.: -35]
//        → cortes\<nome>.cortes.json  (silêncios achados no áudio + falas com tempo + lista "remover" vazia)
//        → cortes\<nome>.falas.md     (a gravação como texto, para a IA decidir o que sai)
//   2) a IA lê as falas e preenche "remover" no .cortes.json (erros, gaguejos, tomadas repetidas)
//   3) npm run cortar -- aplicar cortes\<nome>.cortes.json
//        → <pasta do vídeo>\<nome>-limpa.mp4  +  cortes\<nome>.relatorio.md
//   Extra: npm run cortar -- palavras cortes\<nome>.cortes.json <nº da fala>   (tempos palavra por palavra)
//
// As pausas saem sozinhas (pelo áudio, com o silencedetect do FFmpeg). O que é erro ou tomada repetida
// é decisão de quem lê o texto: a IA marca, e quem gravou confere pelo relatório e pelo vídeo.
// A transcrição precisa existir antes: npm run legendar -- "<vídeo>".
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { agruparFalas, lerPalavras, tabelaDeFalas } from "./falas.mjs";

const [modo, ...args] = process.argv.slice(2);
const virgula = (n, casas = 1) => n.toFixed(casas).replace(".", ",");
const falhar = (msg) => {
  console.error(msg);
  process.exit(1);
};
const ffmpeg = (lista, opcoes = {}) => spawnSync("ffmpeg", ["-hide_banner", ...lista], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...opcoes });

// O silencedetect parte uma pausa longa em pedaços quando há um estalo curto no meio (visto na primeira gravação real:
// 74,56–82,55 e 82,58–82,95). Cada pedaço curto ficava no vídeo e somava até 1,9 s de silêncio numa emenda.
// Junta pedaços separados por até 0,1 s de som, desde que nenhuma palavra do Whisper caia nesse som.
const ESTALO = 0.1;
const unirSilencios = (silencios, palavras) => {
  const unidos = [];
  for (const s of [...silencios].sort((a, b) => a.de - b.de)) {
    const u = unidos.at(-1);
    const temPalavra = u && palavras.some((p) => (p.de + p.ate) / 2 > u.ate - 0.02 && (p.de + p.ate) / 2 < s.de + 0.02);
    if (u && s.de - u.ate <= ESTALO && !temPalavra) u.ate = Math.max(u.ate, s.ate);
    else unidos.push({ de: s.de, ate: s.ate });
  }
  return unidos;
};

const analisar = () => {
  const [video, legendasArg, ruidoArg] = args;
  if (!video) falhar('Uso: npm run cortar -- analisar "<vídeo>" [legendas.json] [ruído em dB]');
  if (!existsSync(video)) falhar(`Não achei o vídeo: ${video}`);
  const nome = path.parse(video).name;
  const legendas = legendasArg ?? path.join("legendas", `${nome}.json`);
  if (!existsSync(legendas)) falhar(`Falta a transcrição ${legendas}. Rode antes: npm run legendar -- "${video}"`);

  const sonda = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate:format=duration", "-of", "json", video], { encoding: "utf8" });
  if (sonda.status !== 0) falhar(sonda.stderr || "ffprobe falhou");
  const info = JSON.parse(sonda.stdout);
  const duracao = Number(info.format.duration);
  const [num, den] = (info.streams?.[0]?.r_frame_rate ?? "30/1").split("/").map(Number);
  const fps = Math.round((num / (den || 1)) * 1000) / 1000;

  // volume médio → limite do que conta como silêncio
  const vol = ffmpeg(["-i", video, "-vn", "-af", "volumedetect", "-f", "null", "-"]).stderr;
  const media = Number(/mean_volume:\s*(-?[\d.]+)/.exec(vol)?.[1] ?? -25);
  const pico = Number(/max_volume:\s*(-?[\d.]+)/.exec(vol)?.[1] ?? 0);
  const ruidoDb = ruidoArg ? Number(ruidoArg) : Math.max(-50, Math.min(-28, Math.round(media - 14)));

  const det = ffmpeg(["-i", video, "-vn", "-af", `silencedetect=noise=${ruidoDb}dB:d=0.15`, "-f", "null", "-"]).stderr;
  const silencios = [];
  let aberto = null;
  for (const linha of det.split(/\r?\n/)) {
    const ini = /silence_start:\s*(-?[\d.]+)/.exec(linha);
    const fim = /silence_end:\s*(-?[\d.]+)/.exec(linha);
    if (ini) aberto = Math.max(0, Number(ini[1]));
    if (fim && aberto !== null) {
      silencios.push({ de: +aberto.toFixed(3), ate: +Math.min(duracao, Number(fim[1])).toFixed(3) });
      aberto = null;
    }
  }
  if (aberto !== null) silencios.push({ de: +aberto.toFixed(3), ate: +duracao.toFixed(3) });

  const palavras = lerPalavras(legendas);
  const falas = agruparFalas(palavras);
  const config = { ruidoDb, pausaMin: 0.5, folga: 0.12, folgaFinal: 0.35 };
  const dados = { video: path.resolve(video), legendas, duracao: +duracao.toFixed(3), fps, config, silencios, falas, remover: [], manter: [] };

  mkdirSync("cortes", { recursive: true });
  const saida = path.join("cortes", `${nome}.cortes.json`);
  writeFileSync(saida, JSON.stringify(dados, null, 2) + "\n");

  const pausas = unirSilencios(silencios, palavras).filter((s) => s.ate - s.de >= config.pausaMin);
  const sobra = pausas.reduce((t, s) => t + Math.max(0, s.ate - s.de - 2 * config.folga), 0);
  const md = [
    `# Falas de ${nome}`,
    "",
    `Duração ${virgula(duracao)} s · volume médio ${virgula(media)} dB, pico ${virgula(pico)} dB · silêncio abaixo de ${ruidoDb} dB.`,
    `Pausas de ${virgula(config.pausaMin)} s ou mais: ${pausas.length} (saem sozinhas, cerca de ${virgula(sobra)} s).`,
    "",
    tabelaDeFalas(falas),
    "",
    "## Como marcar o que sai",
    `No arquivo \`${saida}\`, preencha a lista \`remover\`:`,
    '- fala inteira: `{ "falas": [3, 4], "motivo": "tomada repetida" }`',
    '- só um pedaço: `{ "de": 12.30, "ate": 13.10, "motivo": "gaguejou" }` (tempos por palavra: `npm run cortar -- palavras ' + saida + " <nº>`)",
    '- pausa que deve ficar: ponha em `manter`, ex.: `{ "de": 20.1, "ate": 21.4 }`',
    "",
  ].join("\n");
  writeFileSync(path.join("cortes", `${nome}.falas.md`), md);
  console.log(md);
  console.log(`→ ${saida}`);
};

const palavrasDaFala = () => {
  const [arquivo, n] = args;
  if (!arquivo || !n) falhar("Uso: npm run cortar -- palavras cortes\\<nome>.cortes.json <nº da fala>");
  const dados = JSON.parse(readFileSync(arquivo, "utf8"));
  const fala = dados.falas.find((f) => f.n === Number(n));
  if (!fala) falhar(`Não existe a fala ${n}.`);
  for (const p of lerPalavras(dados.legendas).filter((p) => p.de >= fala.de - 0.01 && p.ate <= fala.ate + 0.01)) {
    console.log(`${p.de.toFixed(2).padStart(7)} – ${p.ate.toFixed(2).padStart(7)}  ${p.texto}`);
  }
};

const aplicar = () => {
  const [arquivo] = args;
  if (!arquivo) falhar("Uso: npm run cortar -- aplicar cortes\\<nome>.cortes.json");
  const dados = JSON.parse(readFileSync(arquivo, "utf8"));
  const { video, duracao, fps, config, falas } = dados;
  if (!existsSync(video)) falhar(`Não achei o vídeo: ${video}`);
  const cobre = (lista, a, b) => (lista ?? []).some((m) => m.de < b && m.ate > a);
  const palavras = existsSync(dados.legendas) ? lerPalavras(dados.legendas) : [];
  const silencios = unirSilencios(dados.silencios, palavras);

  // 1. o que sai
  const sai = [];
  const primeira = palavras[0];
  const ultima = palavras.at(-1);
  for (const s of silencios) {
    if (cobre(dados.manter, s.de, s.ate)) continue;
    if (ultima && s.ate > ultima.ate && s.de >= ultima.ate - 0.4) continue; // depois da última palavra: regra do fim, abaixo
    const dur = s.ate - s.de;
    if (s.de <= 0.05) {
      if (s.ate - config.folga > 0.1) sai.push({ de: 0, ate: s.ate - config.folga, motivo: "silêncio no começo" });
    } else if (s.ate >= duracao - 0.05) {
      if (dur > config.folgaFinal + 0.1) sai.push({ de: s.de + config.folgaFinal, ate: duracao, motivo: "silêncio no fim" });
    } else if (dur >= config.pausaMin) {
      sai.push({ de: s.de + config.folga, ate: s.ate - config.folga, motivo: "pausa" });
    }
  }
  // Antes da primeira palavra e depois da última só há ruído: ele se ajeitando, saindo do quadro, a mão no celular.
  // Na primeira gravação real o vídeo limpo terminava com 0,7 s da mesa vazia, porque o silêncio do fim tinha um barulho no meio.
  if (primeira) {
    const s = silencios.filter((s) => s.ate <= primeira.de + 0.1).at(-1);
    const ate = s ? s.ate - Math.min(config.folga, (s.ate - s.de) / 2) : 0;
    if (ate > 0.1 && !cobre(dados.manter, 0, ate)) sai.push({ de: 0, ate, motivo: "antes da primeira palavra" });
  }
  if (ultima) {
    const s = silencios.filter((s) => s.ate > ultima.ate && s.de >= ultima.ate - 0.4).sort((a, b) => a.de - b.de)[0];
    const de = s ? s.de + Math.min(config.folgaFinal, s.ate - s.de) : duracao;
    if (duracao - de > 0.1 && !cobre(dados.manter, de, duracao)) sai.push({ de, ate: duracao, motivo: "depois da última palavra" });
  }
  for (const r of dados.remover ?? []) {
    let de = r.de;
    let ate = r.ate;
    if (r.falas) {
      const escolhidas = r.falas.map((n) => falas.find((f) => f.n === n));
      if (escolhidas.some((f) => !f)) falhar(`"remover" cita uma fala que não existe: ${JSON.stringify(r)}`);
      de = Math.min(...escolhidas.map((f) => f.de));
      ate = Math.max(...escolhidas.map((f) => f.ate));
    }
    if (!(ate > de)) falhar(`Item inválido em "remover": ${JSON.stringify(r)}`);
    // Encosta o corte no silêncio medido no áudio entre a fala que fica e a que sai. Os tempos do Whisper erram:
    // na gravação real o começo de uma fala depois de pausa longa veio até 0,4 s atrasado e o fim de palavra,
    // até 0,25 s para mais ou para menos. Por isso o corte vai da primeira pausa depois da última palavra que fica
    // antes dele até a última pausa antes da primeira palavra que fica depois dele.
    const meio = (p) => (p.de + p.ate) / 2;
    const anterior = palavras.filter((p) => meio(p) < de).at(-1);
    const seguinte = palavras.find((p) => meio(p) > ate);
    if (!anterior) de = 0; // tira tudo desde o começo do vídeo
    else {
      const s = silencios.filter((s) => s.ate > anterior.ate && s.de >= anterior.ate - 0.4 && s.de < de + 0.1).sort((a, b) => a.de - b.de)[0];
      const respiro = seguinte ? config.folga : config.folgaFinal;
      if (s) de = s.de + Math.min(respiro, (s.ate - s.de) / 2);
    }
    if (!seguinte) ate = duracao; // tira tudo até o fim do vídeo
    else {
      const s = silencios.filter((s) => s.de < seguinte.de && s.ate <= seguinte.de + 0.1 && s.ate > ate - 0.1).sort((a, b) => b.ate - a.ate)[0];
      if (s) ate = s.ate - Math.min(config.folga, (s.ate - s.de) / 2);
    }
    if (!(ate > de)) falhar(`Depois de encostar nos silêncios, o item ficou vazio: ${JSON.stringify(r)}`);
    sai.push({ de, ate, motivo: r.motivo ?? "marcado pela IA" });
  }

  // 2. junta o que sai e calcula o que fica, em quadros inteiros
  sai.sort((a, b) => a.de - b.de);
  const unido = [];
  for (const s of sai) {
    const ultimo = unido.at(-1);
    if (ultimo && s.de <= ultimo.ate + 0.001) {
      ultimo.ate = Math.max(ultimo.ate, s.ate);
      if (!ultimo.motivo.includes(s.motivo)) ultimo.motivo += " + " + s.motivo;
    } else unido.push({ ...s });
  }
  const noQuadro = (t) => Math.round(t * fps) / fps;
  let fica = [];
  let cursor = 0;
  for (const s of unido) {
    if (s.de > cursor) fica.push({ de: noQuadro(cursor), ate: noQuadro(s.de) });
    cursor = Math.max(cursor, s.ate);
  }
  if (cursor < duracao) fica.push({ de: noQuadro(cursor), ate: noQuadro(duracao) });
  fica = fica.filter((f) => f.ate - f.de >= 0.2);
  if (!fica.length) falhar("Não sobrou nada para manter. Confira a lista remover.");
  if (fica.length > 150) falhar(`São ${fica.length} trechos: é corte demais para uma passada. Aumente pausaMin no arquivo e aplique de novo.`);

  // o que saiu de verdade (complemento do que fica), com o texto que estava ali
  const saiu = [];
  let anterior = 0;
  for (const f of [...fica, { de: duracao, ate: duracao }]) {
    if (f.de - anterior > 0.001) {
      const motivo = unido.filter((u) => u.de < f.de && u.ate > anterior).map((u) => u.motivo).join(" + ") || "sobra curta";
      const texto = palavras.filter((p) => (p.de + p.ate) / 2 >= anterior && (p.de + p.ate) / 2 < f.de).map((p) => p.texto).join(" ");
      saiu.push({ de: anterior, ate: f.de, motivo, texto });
    }
    anterior = f.ate;
  }

  // 3. monta com o FFmpeg: um trim por trecho, com fade de 10 ms no áudio de cada emenda
  const n = fica.length;
  const s3 = (x) => x.toFixed(4);
  const grafo = [
    `[0:v]fps=${fps},split=${n}${fica.map((_, i) => `[v${i}]`).join("")}`,
    `[0:a]asplit=${n}${fica.map((_, i) => `[a${i}]`).join("")}`,
    ...fica.flatMap((f, i) => {
      const d = f.ate - f.de;
      return [
        `[v${i}]trim=start=${s3(f.de)}:end=${s3(f.ate)},setpts=PTS-STARTPTS[tv${i}]`,
        `[a${i}]atrim=start=${s3(f.de)}:end=${s3(f.ate)},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.01,afade=t=out:st=${s3(Math.max(0, d - 0.01))}:d=0.01[ta${i}]`,
      ];
    }),
    `${fica.map((_, i) => `[tv${i}][ta${i}]`).join("")}concat=n=${n}:v=1:a=1[v][a]`,
  ].join(";");

  const nome = path.parse(video).name;
  const saida = path.join(path.dirname(video), `${nome}-limpa.mp4`);
  console.log(`Montando ${n} trecho(s)...`);
  const r = ffmpeg(
    ["-loglevel", "error", "-y", "-i", video, "-filter_complex", grafo, "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", saida],
    { stdio: "inherit" },
  );
  if (r.status !== 0) process.exit(r.status ?? 1);

  const nova = fica.reduce((t, f) => t + (f.ate - f.de), 0);
  const md = [
    `# Cortes de ${nome}`,
    "",
    `Duração: ${virgula(duracao)} s → **${virgula(nova)} s** (${virgula(duracao - nova)} s a menos, ${saiu.length} corte(s)).`,
    `Vídeo limpo: \`${saida}\``,
    "",
    "| # | de (s) | até (s) | tirou | motivo | o que tinha ali |",
    "|---|---|---|---|---|---|",
    ...saiu.map((s, i) => `| ${i + 1} | ${s.de.toFixed(2)} | ${s.ate.toFixed(2)} | ${virgula(s.ate - s.de)} s | ${s.motivo} | ${s.texto.replace(/\|/g, "/")} |`),
    "",
    "Para desfazer um corte: tire o item de `remover` (ou ponha a pausa em `manter`) no `.cortes.json` e aplique de novo. O original não é alterado.",
    "",
  ].join("\n");
  mkdirSync("cortes", { recursive: true });
  const relatorio = path.join("cortes", `${nome}.relatorio.md`);
  writeFileSync(relatorio, md);
  dados.resultado = { video: saida, duracao: +nova.toFixed(3), cortes: saiu.length, fica };
  writeFileSync(arquivo, JSON.stringify(dados, null, 2) + "\n");
  console.log(md);
  console.log(`→ ${relatorio}`);
  console.log(`Confira transcrevendo o vídeo limpo: npm run legendar -- "${saida}"`);
};

if (modo === "analisar") analisar();
else if (modo === "aplicar") aplicar();
else if (modo === "palavras") palavrasDaFala();
else falhar('Uso: npm run cortar -- analisar "<vídeo>"   |   npm run cortar -- aplicar cortes\\<nome>.cortes.json   |   npm run cortar -- palavras <arquivo> <nº>');
