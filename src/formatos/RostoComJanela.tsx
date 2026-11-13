import { Video } from "@remotion/media";
import { AbsoluteFill, interpolate, staticFile } from "remotion";
import { useCurrentFrame, useVideoConfig } from "../relogio";
import { FundoNoite, GuiaZonaSegura } from "../animacoes/Base";
import { ds, marca, pilares, type Pilar, tipo, zonasReels } from "../animacoes/tema";
import { ease } from "../pecas/util";

// Formato "rosto com janela": o vídeo começa em tela cheia e, nos trechos de `janelas`, encolhe para uma
// janela embaixo enquanto as animações ocupam a metade de cima. Depois volta a encher a tela.
// A metade de cima tem as mesmas medidas da TelaDividida (1080×960): todas as peças de src/pecas servem.
// A faixa da legenda (y 985–1125) fica livre entre as animações e a janela.
export const METADE = 960;
const JANELA = { left: zonasReels.lateral, top: 1150, width: zonasReels.botoes.x - zonasReels.lateral, height: 1920 - zonasReels.base - 1150 };

const posicao = (texto: string): [number, number] => {
  const m = /(-?[\d.]+)%\s+(-?[\d.]+)%/.exec(texto);
  return m ? [Number(m[1]), Number(m[2])] : [50, 50];
};

export const RostoComJanela: React.FC<{
  pilar: Pilar;
  video: string;
  janelas: { de: number; ate: number }[]; // em segundos: quando o rosto vira janela
  fimDoVideo: number; // frame em que a fala termina (barra cheia)
  enquadramento?: string; // rosto em tela cheia (CSS object-position)
  enquadramentoJanela?: string; // rosto dentro da janela, que é larga e baixa
  mostrarGuia?: boolean;
  children: React.ReactNode;
}> = ({ pilar, video, janelas, fimDoVideo, enquadramento = "50% 50%", enquadramentoJanela = "50% 40%", mostrarGuia = false, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { acento, nome: secao } = pilares[pilar];
  // 0 = tela cheia, 1 = janela
  const m = Math.max(
    0,
    ...janelas.map((j) =>
      Math.min(interpolate(frame, [j.de * fps, j.de * fps + 12], [0, 1], ease), interpolate(frame, [j.ate * fps, j.ate * fps + 12], [1, 0], ease)),
    ),
  );
  const mix = (a: number, b: number) => a + (b - a) * m;
  const [x0, y0] = posicao(enquadramento);
  const [x1, y1] = posicao(enquadramentoJanela);
  return (
    <AbsoluteFill style={{ backgroundColor: ds.bg000 }}>
      <div
        style={{
          position: "absolute",
          left: mix(0, JANELA.left),
          top: mix(0, JANELA.top),
          width: mix(1080, JANELA.width),
          height: mix(1920, JANELA.height),
          borderRadius: mix(0, ds.radius.lg),
          overflow: "hidden",
          boxSizing: "border-box",
          border: `2px solid rgba(230, 236, 245, ${0.12 * m})`,
          backgroundColor: ds.bg200,
        }}
      >
        {video ? (
          <Video src={staticFile(video)} objectFit="cover" style={{ width: "100%", height: "100%", objectPosition: `${mix(x0, x1)}% ${mix(y0, y1)}%` }} />
        ) : (
          <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", ...tipo.bodyLg, color: ds.inkMuted }}>vídeo: rosto</AbsoluteFill>
        )}
      </div>
      <div style={{ position: "absolute", top: 0, left: 0, width: 1080, height: METADE, overflow: "hidden", opacity: m }}>
        <FundoNoite semente="rosto-com-janela" altura={METADE} />
        {children}
        <div style={{ position: "absolute", left: ds.space[4], bottom: 30, ...tipo.bodySm, color: ds.inkMuted }}>{marca.site} · {secao}</div>
      </div>
      <div style={{ position: "absolute", top: METADE - 4, left: 0, right: 0, height: 8, backgroundColor: ds.bg200, opacity: m }}>
        <div style={{ height: 8, width: `${Math.min(1, frame / fimDoVideo) * 100}%`, backgroundColor: acento }} />
      </div>
      {mostrarGuia ? <GuiaZonaSegura /> : null}
    </AbsoluteFill>
  );
};
