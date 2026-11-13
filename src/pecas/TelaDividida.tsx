import { Video } from "@remotion/media";
import { AbsoluteFill, interpolate, staticFile } from "remotion";
import { useCurrentFrame, useVideoConfig } from "../relogio";
import { Canto, FundoNoite, GuiaZonaSegura } from "../animacoes/Base";
import { ds, marca, pilares, type Pilar, tipo, zonasReels } from "../animacoes/tema";
import { type FocoZoom, type ZoomDaFala, ZoomRoteiro } from "../efeitos/ZoomDeEdicao";
import { ease } from "./util";

// Layout do Resumo de Notícias: animações em cima (1080×960), vídeo embaixo,
// barra de progresso na divisão, tarja de nome nos primeiros 3 s.
// Zooms de edição no vídeo de baixo (opcional): `zooms` = um por frase, em quadros do vídeo (ver ZoomRoteiro);
// `focoZoom` = a linha dos olhos DENTRO da metade de baixo, de 0 a 1; `forcaZoom` = 0,6 por padrão, porque
// aqui o rosto já está fechado (zoom-in até 1,08, punch 1,08, zoom-out de 1,17, crash 1,24).
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
  zooms?: ZoomDaFala[]; // zooms de edição no vídeo de baixo, um por frase
  focoZoom?: FocoZoom; // linha dos olhos dentro da metade de baixo (0 a 1)
  forcaZoom?: number; // 1 = força medida na referência; 0,6 = padrão da tela dividida
  children: React.ReactNode;
}> = ({ pilar, video, eyebrow, canto, nome, cargo, fimDoVideo, enquadramento = "50% 30%", mostrarGuia = false, zooms, focoZoom, forcaZoom = 0.6, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { acento, nome: secao } = pilares[pilar];
  const gravacao = video ? <Video src={staticFile(video)} objectFit="cover" style={{ width: "100%", height: "100%", objectPosition: enquadramento }} /> : null;
  return (
    <AbsoluteFill style={{ backgroundColor: ds.bg000 }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: 1080, height: METADE, overflow: "hidden" }}>
        <FundoNoite semente="tela-dividida" altura={METADE} />
        {/* opcionais: em Reels ficam vazios. Ficam logo abaixo da zona de cima do Instagram; com eles, o título da cena começa em y 330 ou mais */}
        {eyebrow ? (
          <div style={{ position: "absolute", left: ds.space[4], top: zonasReels.topo, ...tipo.eyebrow, fontSize: 26, color: ds.ink }}>{eyebrow}</div>
        ) : null}
        <Canto texto={canto} top={zonasReels.topo} />
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
          zooms && zooms.length ? (
            <ZoomRoteiro zooms={zooms} foco={focoZoom} forca={forcaZoom}>
              {gravacao}
            </ZoomRoteiro>
          ) : (
            gravacao
          )
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
