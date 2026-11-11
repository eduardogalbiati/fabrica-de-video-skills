// Fala provisória: lê o texto do roteiro com a voz do sistema e gera um vídeo só com o áudio,
// para testar as animações antes da gravação de verdade.
// Uso: npm run fala -- <slug> <arquivo.txt ou "texto entre aspas"> [ritmo]
// Saída: <pasta de trabalho>/public/previa/fala-<slug>.mp4 (1080x960). No vídeo: video = "previa/fala-<slug>.mp4".
//   Windows: voz do sistema (SAPI), pelo scripts/fala-provisoria.ps1
//   macOS:   comando `say` (voz Luciana, se existir) + ffmpeg. Caminho escrito a partir do fluxo original no Mac;
//            NÃO foi testado depois da migração para o Windows.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { PUBLICO, RAIZ } from "./pastas.mjs";

const [slug, texto, ritmo] = process.argv.slice(2);
if (!slug || !texto) {
  console.error('Uso: npm run fala -- <slug> <arquivo.txt ou "texto"> [ritmo]');
  process.exit(1);
}

if (process.platform === "win32") {
  const args = ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", path.join(RAIZ, "scripts", "fala-provisoria.ps1"), slug, texto];
  if (ritmo) args.push(ritmo);
  process.exit(spawnSync("powershell", args, { stdio: "inherit" }).status ?? 1);
}

if (process.platform === "darwin") {
  const destino = path.join(PUBLICO, "previa");
  mkdirSync(destino, { recursive: true });
  const conteudo = existsSync(texto) ? readFileSync(texto, "utf8") : texto;
  const aiff = path.join(os.tmpdir(), `fala-${slug}.aiff`);
  const vozes = spawnSync("say", ["-v", "?"], { encoding: "utf8" }).stdout ?? "";
  const voz = /^Luciana\b/m.test(vozes) ? ["-v", "Luciana"] : [];
  if (spawnSync("say", [...voz, "-o", aiff, conteudo], { stdio: "inherit" }).status !== 0) process.exit(1);
  const saida = path.join(destino, `fala-${slug}.mp4`);
  const r = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i", "color=c=0x18233b:s=1080x960:r=30", "-i", aiff, "-shortest", "-c:v", "libx264", "-crf", "28", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-movflags", "+faststart", saida],
    { stdio: "inherit" },
  );
  if (r.status !== 0) process.exit(r.status ?? 1);
  console.log(`Pronto: ${saida}`);
  process.exit(0);
}

console.error("Fala provisória só existe para Windows e macOS. No Linux, grave um áudio qualquer e use como vídeo provisório.");
process.exit(1);
