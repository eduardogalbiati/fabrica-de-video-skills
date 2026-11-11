// Gera legendas (palavra por palavra) a partir de um vídeo/áudio usando Whisper local.
// Uso: npm run legendar -- public/meu-video.mp4 [modelo]
//   modelo: large-v3-turbo (padrão, mais preciso) | medium | small (mais rápido)
// Saída: legendas/<nome-do-arquivo>.json
import { registerMediabunnyServer } from "@mediabunny/server";
import {
  WHISPER_WEBGPU_SAMPLE_RATE,
  canUseWhisperWebGpu,
  disposeWhisperModel,
  downloadWhisperModel,
  loadWhisperModel,
  toCaptions,
  transcribe,
} from "@remotion/whisper-webgpu";
import {
  ALL_FORMATS,
  Conversion,
  FilePathSource,
  Input,
  NullTarget,
  Output,
  WavOutputFormat,
} from "mediabunny";
import { existsSync, readdirSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const arquivo = process.argv[2];
const model = process.argv[3] ?? "large-v3-turbo";
const language = process.env.IDIOMA ?? "portuguese";
if (!arquivo) {
  console.error("Uso: npm run legendar -- public/meu-video.mp4 [modelo]");
  process.exit(1);
}

registerMediabunnyServer();

const support = await canUseWhisperWebGpu();
if (!support.supported) throw new Error(support.detailedReason);

console.log(`🎧 Extraindo áudio de ${arquivo}...`);
const chunks = [];
const input = new Input({ formats: ALL_FORMATS, source: new FilePathSource(arquivo) });
const audioTrack = await input.getPrimaryAudioTrack();
if (audioTrack === null) throw new Error("O arquivo não tem faixa de áudio.");

const conversion = await Conversion.init({
  input,
  output: new Output({ format: new WavOutputFormat(), target: new NullTarget() }),
  video: { discard: true },
  audio: (track) => {
    if (track.id !== audioTrack.id) return { discard: true };
    return {
      codec: "pcm-f32",
      forceTranscode: true,
      numberOfChannels: 1,
      sampleFormat: "f32",
      sampleRate: WHISPER_WEBGPU_SAMPLE_RATE,
      process: (sample) => {
        const waveform = new Float32Array(
          sample.allocationSize({ format: "f32", planeIndex: 0 }) / Float32Array.BYTES_PER_ELEMENT,
        );
        sample.copyTo(waveform, { format: "f32", planeIndex: 0 });
        chunks.push({ startFrame: Math.round(sample.timestamp * WHISPER_WEBGPU_SAMPLE_RATE), waveform });
        return sample;
      },
    };
  },
});
if (!conversion.isValid) throw new Error("Não foi possível decodificar o áudio.");
await conversion.execute();
input.dispose?.();

const length = chunks.reduce((m, c) => Math.max(m, c.startFrame + c.waveform.length), 0);
const channelWaveform = new Float32Array(length);
for (const c of chunks) {
  const dst = Math.max(0, c.startFrame);
  const src = Math.max(0, -c.startFrame);
  const n = Math.min(c.waveform.length - src, channelWaveform.length - dst);
  if (n > 0) channelWaveform.set(c.waveform.subarray(src, src + n), dst);
}

// Na primeira transcrição o modelo é baixado para dentro de node_modules. Avisa antes, com o tamanho.
const cacheDoModelo = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "node_modules", "@huggingface", "transformers", ".cache");
const jaBaixado = (pasta, nivel = 0) =>
  existsSync(pasta) && nivel < 6 && readdirSync(pasta, { withFileTypes: true }).some((i) => i.isDirectory() && (i.name.includes(`whisper-${model}`) || jaBaixado(path.join(pasta, i.name), nivel + 1)));
if (!jaBaixado(cacheDoModelo)) {
  console.log(`⬇️  Primeira vez com o modelo "${model}": ele será baixado agora e fica guardado em node_modules.`);
  console.log(model === "large-v3-turbo" ? "   São cerca de 4 GB (alguns minutos, conforme a internet). As próximas transcrições não baixam nada." : "   O tamanho depende do modelo (o padrão, large-v3-turbo, tem cerca de 4 GB). As próximas transcrições não baixam nada.");
}
console.log(`🧠 Carregando modelo Whisper "${model}"...`);
await downloadWhisperModel({ model });
await loadWhisperModel({ model });
try {
  console.log(`✍️  Transcrevendo (${language})...`);
  const transcription = await transcribe({ channelWaveform, model, language });
  const { captions } = toCaptions({ whisperWebGpuOutput: transcription });
  await mkdir("legendas", { recursive: true });
  const saida = path.join("legendas", path.parse(arquivo).name + ".json");
  await writeFile(saida, JSON.stringify(captions, null, 2));
  console.log(`✅ ${captions.length} palavras → ${saida}`);
} finally {
  await disposeWhisperModel({ model });
  process.exit(0);
}
