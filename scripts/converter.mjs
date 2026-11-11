// Converte a gravação do celular para o formato do estúdio: 1080x1920, 30 fps, H.264, cores normais (SDR).
// Uso: npm run converter -- "<arquivo original>" <slug>
// Saída: <pasta de trabalho>/public/gravacao-<slug>.mp4   (o original não é alterado)
//
// iPhone recente grava em 4K HDR (HLG / Dolby Vision). Converter sem tratar o HDR deixa a cor lavada.
// O próprio FFmpeg trata o HDR, com zscale + tonemap.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { PUBLICO } from "./pastas.mjs";

const [original, slug] = process.argv.slice(2);
if (!original || !slug) {
  console.error('Uso: npm run converter -- "<arquivo original>" <slug>');
  process.exit(1);
}
if (!existsSync(original)) {
  console.error(`Não achei o arquivo: ${original}`);
  process.exit(1);
}

const sonda = spawnSync(
  "ffprobe",
  ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_name,width,height,r_frame_rate,pix_fmt,color_transfer,color_primaries,color_space:stream_side_data=rotation:format=duration", "-of", "json", original],
  { encoding: "utf8" },
);
if (sonda.status !== 0) {
  console.error(sonda.stderr || "ffprobe falhou. O FFmpeg está instalado?");
  process.exit(1);
}
const info = JSON.parse(sonda.stdout);
const v = info.streams?.[0];
if (!v) {
  console.error("O arquivo não tem faixa de vídeo.");
  process.exit(1);
}

const HDR = { "arib-std-b67": "HLG", smpte2084: "PQ" };
const hdr = HDR[v.color_transfer];
// O iPhone grava o sensor deitado e marca a rotação; o FFmpeg gira sozinho. Mostra o tamanho já girado.
const rotacao = Number(v.side_data_list?.find((d) => d.rotation !== undefined)?.rotation ?? 0);
const deitado = Math.abs(rotacao) % 180 === 90;
const [largura, altura] = deitado ? [v.height, v.width] : [v.width, v.height];
console.log(
  `Original: ${v.codec_name} ${largura}x${altura}${altura > largura ? " (em pé)" : ""}, ${v.r_frame_rate} fps, ${v.pix_fmt}, ` +
    `${Number(info.format?.duration ?? 0).toFixed(1)} s, ${hdr ? `HDR (${hdr})` : "cores normais (SDR)"}`,
);

const filtros = ["fps=30", "scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos", "crop=1080:1920"];
if (hdr) {
  // HDR -> SDR: lineariza, troca as primárias para bt709, aplica a curva (hable) e volta para bt709.
  filtros.push(
    `zscale=tin=${v.color_transfer}:min=bt2020nc:pin=bt2020:rin=tv:t=linear:npl=100`,
    "format=gbrpf32le",
    "zscale=p=bt709",
    "tonemap=tonemap=hable:desat=0",
    "zscale=t=bt709:m=bt709:r=tv",
  );
}
filtros.push("format=yuv420p", "setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709");

mkdirSync(PUBLICO, { recursive: true });
const saida = path.join(PUBLICO, `gravacao-${slug}.mp4`);
const args = [
  "-hide_banner", "-loglevel", "warning", "-stats", "-y",
  "-i", original,
  "-map", "0:v:0", "-map", "0:a:0?",
  "-vf", filtros.join(","),
  "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p",
  "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
  "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
  "-movflags", "+faststart",
  saida,
];
console.log("Convertendo (pode levar alguns minutos em 4K)...");
const r = spawnSync("ffmpeg", args, { stdio: "inherit" });
if (r.status !== 0) process.exit(r.status ?? 1);

console.log(`\nPronto: ${saida}`);
console.log(`No vídeo, use o prop video = "gravacao-${slug}.mp4".`);
if (hdr) console.log("Era HDR: compare um quadro com o original no celular antes de seguir (a cor não pode estar lavada nem escura).");
