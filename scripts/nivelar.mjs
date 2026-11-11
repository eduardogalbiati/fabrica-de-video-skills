// Ajusta o volume de um vídeo para o padrão das redes: −14 LUFS, pico até −1,5 dBTP.
// Duas passadas do loudnorm (mede, depois aplica) + limitador. A imagem não é recodificada.
// Uso: npm run nivelar -- "<vídeo>"
// Saída: <mesma pasta>\<nome>-14lufs.mp4   (o original não é alterado)
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const [video] = process.argv.slice(2);
if (!video || !existsSync(video)) {
  console.error('Uso: npm run nivelar -- "<vídeo>"');
  process.exit(1);
}
const alvo = "loudnorm=I=-14:TP=-1.5:LRA=11";
const med = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", video, "-vn", "-af", `${alvo}:print_format=json`, "-f", "null", "-"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).stderr;
const pega = (k) => new RegExp(`"${k}"\\s*:\\s*"(-?[\\d.]+|-?inf)"`).exec(med)?.[1];
const m = { i: pega("input_i"), tp: pega("input_tp"), lra: pega("input_lra"), thresh: pega("input_thresh"), offset: pega("target_offset") };
if (Object.values(m).some((x) => x === undefined || /inf/.test(x))) {
  console.error("Não consegui medir o volume (o vídeo tem áudio? está mudo?).");
  process.exit(1);
}
console.log(`Antes: ${m.i} LUFS, pico ${m.tp} dBTP`);

const { dir, name } = path.parse(video);
const saida = path.join(dir, `${name}-14lufs.mp4`);
const filtro = `${alvo}:measured_I=${m.i}:measured_TP=${m.tp}:measured_LRA=${m.lra}:measured_thresh=${m.thresh}:offset=${m.offset}:linear=true,aresample=48000,alimiter=limit=0.8:attack=5:release=50:level=false`;
const r = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", video, "-map", "0:v:0", "-map", "0:a:0", "-c:v", "copy", "-af", filtro, "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", saida], { stdio: "inherit" });
if (r.status !== 0) process.exit(r.status ?? 1);

const dep = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", saida, "-vn", "-af", `${alvo}:print_format=json`, "-f", "null", "-"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).stderr;
const depois = (k) => new RegExp(`"${k}"\\s*:\\s*"(-?[\\d.]+)"`).exec(dep)?.[1];
console.log(`Depois: ${depois("input_i")} LUFS, pico ${depois("input_tp")} dBTP`);
console.log(`Pronto: ${saida}`);
