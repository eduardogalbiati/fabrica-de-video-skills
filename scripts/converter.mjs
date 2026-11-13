// Converte a gravação do celular para o formato do estúdio: em pé (9:16), H.264, cores normais (SDR).
// A QUALIDADE QUE ENTRA É A QUE SAI:
//   resolução           mantida: 4K continua 4K (2160x3840)
//   quadros por segundo mantidos: gravou em 60, fica em 60 (taxa constante, arredondada; no máximo 60)
// O render final (npm run renderizar) lê a resolução e os quadros por segundo deste arquivo e sai neles.
// Só reduz a pedido (1080p, 30fps).
// (Gravação menor que 1080x1920 é ampliada até esse tamanho, como antes; nada passa de 4K.)
// HDR é a exceção, e não tem como ser diferente: o Remotion desenha os quadros num navegador que só trabalha
// em cores normais. Gravação em HDR é convertida para SDR aqui, com o menor prejuízo possível.
// Uso: npm run converter -- "<arquivo original>" <slug> [ate=<segundos>]
//   ate=12   converte só os primeiros 12 s (para um teste rápido de cor e enquadramento)
// Saída: <pasta de trabalho>/public/gravacao-<slug>.mp4   (o original não é alterado)
//
// iPhone recente grava em 4K HDR (HLG / Dolby Vision). Converter sem tratar o HDR deixa a cor lavada.
// O próprio FFmpeg trata o HDR, com zscale + tonemap.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { PUBLICO } from "./pastas.mjs";

const [original, slug, ...extras] = process.argv.slice(2);
if (!original || !slug) {
  console.error('Uso: npm run converter -- "<arquivo original>" <slug> [ate=<segundos>]');
  process.exit(1);
}
const ate = Number(extras.find((e) => e.startsWith("ate="))?.slice(4) ?? 0);
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

// Tamanho de saída: a maior moldura 9:16 que cabe no original, sem passar de 4K e sem ficar abaixo de 1080x1920.
const par = (n) => Math.floor(n / 2) * 2;
const W = par(Math.max(1080, Math.min(2160, largura, Math.floor((altura * 9) / 16))));
const H = par((W * 16) / 9);
// Quadros por segundo: os da gravação, em taxa constante e número inteiro (59,94 vira 60), entre 24 e 60.
const [num, den] = String(v.r_frame_rate ?? "30/1").split("/").map(Number);
const FPS = Math.max(24, Math.min(60, Math.round(num / (den || 1)) || 30));
console.log(`Saída:    ${W}x${H}${W >= 2160 ? " (4K mantido)" : W > 1080 ? " (resolução da gravação mantida)" : ""}, ${FPS} fps${ate ? `, só os primeiros ${ate} s` : ""}`);
if (W <= 1080) console.log("Aviso: a gravação não é 4K. Para os zooms saírem nítidos, grave em 4K.");

const filtros = [`fps=${FPS}`, `scale=${W}:${H}:force_original_aspect_ratio=increase:flags=lanczos`, `crop=${W}:${H}`];
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
  ...(ate ? ["-t", String(ate)] : []),
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
if (hdr) {
  console.log("Era HDR: compare um quadro com o original no celular antes de seguir (a cor não pode estar lavada nem escura).");
  console.log("AVISO: o HDR não tem como ser mantido. O vídeo final sai em cores normais (SDR). Avise quem pediu o vídeo.");
}
