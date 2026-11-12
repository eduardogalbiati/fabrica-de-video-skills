import { Video } from "@remotion/media";
import { AbsoluteFill, interpolate, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { comAlfa } from "../animacoes/estilo";
import { ds } from "../animacoes/tema";

// A gravação do rosto em tela cheia (1080×1920), que é a base de todos os EFEITOS SOBRE A GRAVAÇÃO.
// Os efeitos que mexem na imagem (ZoomCamera, CorteMergulho, VarreduraAntesDepois, RecuoEditor) recebem a
// <Gravacao> como filho; os que flutuam por cima (MuralManchetes, CelularFlutuante, ...) vão depois dela.
//   video:   caminho na pasta de trabalho (staticFile). Vazio = pessoa de exemplo (mostruário e modelo público).
//   inicio:  em que segundo da gravação esta cena começa (para a fala seguir contínua entre cenas)
//   filtro:  filtro CSS na imagem (ex.: FILTRO_CRU, para o "antes" de uma comparação)
export const Gravacao: React.FC<{
  video: string;
  inicio?: number;
  enquadramento?: string;
  filtro?: string;
  mudo?: boolean;
}> = ({ video, inicio = 0, enquadramento = "50% 50%", filtro, mudo = true }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: ds.bg000, filter: filtro }}>
      {video ? (
        <Video
          src={staticFile(video)}
          trimBefore={Math.max(0, Math.round(inicio * fps))}
          muted={mudo}
          objectFit="cover"
          style={{ width: "100%", height: "100%", objectPosition: enquadramento }}
        />
      ) : (
        <PessoaDeExemplo />
      )}
    </AbsoluteFill>
  );
};

// A pessoa RECORTADA da mesma gravação (WebM com transparência, de `npm run recortar`), alinhada pelo mesmo `inicio`.
// Vai por cima de tudo que deve passar ATRÁS dela (órbita com camada="atras", texto atrás da cabeça, fundo trocado).
export const PessoaRecortada: React.FC<{ pessoa: string; inicio?: number }> = ({ pessoa, inicio = 0 }) => {
  const { fps } = useVideoConfig();
  return pessoa ? (
    <OffthreadVideo src={staticFile(pessoa)} transparent muted trimBefore={Math.max(0, Math.round(inicio * fps))} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
  ) : null;
};

// Um "antes" rápido a partir da mesma gravação: menos cor e menos contraste.
// Para uma comparação de verdade, use o arquivo cru no `antes` e o tratado no `depois`.
export const FILTRO_CRU = "saturate(0.5) contrast(0.86) brightness(0.94)";

// Pessoa de exemplo (ilustração, não é ninguém): parede, dois monitores e uma silhueta que respira.
// Serve para o mostruário e para o modelo público, onde não pode entrar gravação de ninguém.
// soPessoa: só a silhueta, sem parede nem monitores (faz o papel da pessoa recortada).
export const PessoaDeExemplo: React.FC<{ soPessoa?: boolean }> = ({ soPessoa = false }) => {
  const frame = useCurrentFrame();
  const respira = Math.sin((frame / 30) * Math.PI * 0.5);
  const silhueta = (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <g transform={`translate(0 ${respira * 3}) scale(${1 + respira * 0.004})`} style={{ transformOrigin: "540px 1920px" }}>
        <path d="M 150 1920 C 160 1420 300 1210 540 1190 C 780 1210 920 1420 930 1920 Z" fill={ds.bg100} />
        <rect x={470} y={1060} width={140} height={170} rx={50} fill={ds.bg100} />
        <ellipse cx={540} cy={860} rx={175} ry={225} fill={ds.bg100} />
        <ellipse cx={540} cy={860} rx={175} ry={225} fill="none" stroke={comAlfa(ds.ink, 0.08)} strokeWidth={4} />
      </g>
    </svg>
  );
  if (soPessoa) return <AbsoluteFill>{silhueta}</AbsoluteFill>;
  return (
    <AbsoluteFill style={{ backgroundColor: ds.bg200 }}>
      <div
        style={{
          position: "absolute",
          left: 140,
          top: 260,
          width: 800,
          height: 640,
          borderRadius: 999,
          backgroundColor: comAlfa(ds.ink, 0.07),
          filter: "blur(80px)",
        }}
      />
      {[
        { x: 40, w: 330 },
        { x: 710, w: 330 },
      ].map((m, i) => (
        <div key={i} style={{ position: "absolute", left: m.x, top: 880, width: m.w, height: 300, borderRadius: 12, backgroundColor: ds.bg000, border: `6px solid ${ds.bg100}` }} />
      ))}
      {silhueta}
    </AbsoluteFill>
  );
};

// Entrada e saída comuns aos efeitos: 0 → 1 entre `em` e `em + dur`, e 1 → 0 a partir de `saiEm`.
export const presenca = (frame: number, em: number, saiEm?: number, dur = 10) => {
  const entra = interpolate(frame, [em, em + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sai = saiEm === undefined ? 1 : interpolate(frame, [saiEm, saiEm + dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return Math.min(entra, sai);
};

// Balanço leve e próprio dos efeitos que flutuam (independe do estilo; o estilo pode somar a flutuação dele).
export const balanco = (frame: number, fase: number, amplitude = 5, ciclo = 3.4) => Math.sin(((frame / 30) * 2 * Math.PI) / ciclo + fase) * amplitude;
