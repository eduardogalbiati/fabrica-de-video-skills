import { Video } from "@remotion/media";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Canto, FundoNoite, GuiaZonaSegura } from "../animacoes/Base";
import { ds, marca, pilares, type Pilar, tipo } from "../animacoes/tema";
import { ease } from "./util";

// Layout do Resumo de Notícias: animações em cima (1080×960), vídeo embaixo,
// barra de progresso na divisão, tarja de nome nos primeiros 3 s.
export const METADE = 960;

export const TelaDividida: React.FC<{
  pilar: Pilar;
  video: string;
  eyebrow: string;
  canto: string;
  nome: string;
  cargo: string;
  fimDoVideo: number; // frame em que a fala termina (barra cheia)
  enquadramento?: string; // posição do vídeo no recorte (CSS object-position), ex.: "50% 30%"
  mostrarGuia?: boolean; // mostra as zonas do Instagram (só para conferir)
  children: React.ReactNode;
}> = ({ pilar, video, eyebrow, canto, nome, cargo, fimDoVideo, enquadramento = "50% 30%", mostrarGuia = false, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { acento, nome: secao } = pilares[pilar];
  return (
    <AbsoluteFill style={{ backgroundColor: ds.bg000 }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: 1080, height: METADE, overflow: "hidden" }}>
        <FundoNoite semente="tela-dividida" altura={METADE} />
        {/* opcionais: em Reels ficam vazios */}
        {eyebrow ? (
          <div style={{ position: "absolute", left: ds.space[4], top: ds.space[5] - 40, ...tipo.eyebrow, fontSize: 26, color: ds.ink }}>{eyebrow}</div>
        ) : null}
        <Canto texto={canto} top={ds.space[5] - 40} />
        {children}
        <div style={{ position: "absolute", left: ds.space[4], bottom: 30, ...tipo.bodySm, color: ds.inkMuted }}>{marca.site} · {secao}</div>
        {/* tarja de nome: na metade de cima, à direita, para não cobrir o rosto no vídeo */}
        {nome ? (
          <div
            style={{
              position: "absolute",
              right: ds.space[4],
              bottom: 24,
              textAlign: "right",
              padding: "18px 30px",
              borderRadius: ds.radius.md,
              backgroundColor: ds.bg100,
              opacity: interpolate(frame, [0.3 * fps, 0.7 * fps, 2.6 * fps, 3 * fps], [0, 1, 1, 0], ease),
              translate: `${interpolate(frame, [0.3 * fps, 0.7 * fps], [30, 0], ease)}px 0px`,
            }}
          >
            <div style={{ ...tipo.titleMd, fontSize: 36, color: ds.ink }}>{nome}</div>
            <div style={{ ...tipo.chapter, fontSize: 22, color: ds.inkMuted, marginTop: 6 }}>{cargo}</div>
          </div>
        ) : null}
      </div>
      <div style={{ position: "absolute", top: METADE, left: 0, width: 1080, height: METADE, overflow: "hidden" }}>
        {video ? (
          <Video src={staticFile(video)} objectFit="cover" style={{ width: "100%", height: "100%", objectPosition: enquadramento }} />
        ) : (
          <AbsoluteFill style={{ backgroundColor: ds.bg200, justifyContent: "center", alignItems: "center", ...tipo.bodyLg, color: ds.inkMuted }}>
            vídeo: rosto, câmera fixa
          </AbsoluteFill>
        )}
      </div>
      <div style={{ position: "absolute", top: METADE - 4, left: 0, right: 0, height: 8, backgroundColor: ds.bg200 }}>
        <div style={{ height: 8, width: `${Math.min(1, frame / fimDoVideo) * 100}%`, backgroundColor: acento }} />
      </div>
      {mostrarGuia ? <GuiaZonaSegura /> : null}
    </AbsoluteFill>
  );
};
