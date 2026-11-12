import { Video } from "@remotion/media";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { FundoNoite, GuiaZonaSegura } from "../animacoes/Base";
import { ds, pilares, type Pilar, tipo, zonasReels } from "../animacoes/tema";

// Formato "tela com rosto": o conteúdo (gravação de tela, TelaSite, animações) ocupa o quadro inteiro
// e o rosto fica num quadro de cantos de 40 px com borda fina, fora das zonas do Instagram.
// `children` recebe o quadro inteiro (1080×1920): respeite 270 px em cima, 320 embaixo e 96 nas laterais.
export type CantoDoRosto = "inferior-esquerdo" | "inferior-direito" | "superior-direito";

export const quadroDoRosto = (canto: CantoDoRosto, largura = 320, altura = 420) => {
  const baixo = 1920 - zonasReels.base - 20 - altura;
  if (canto === "inferior-esquerdo") return { left: zonasReels.lateral, top: baixo, width: largura, height: altura };
  if (canto === "inferior-direito") return { left: zonasReels.botoes.x - largura, top: baixo, width: largura, height: altura };
  return { left: 1080 - zonasReels.lateral - largura, top: zonasReels.topo + 20, width: largura, height: altura };
};

export const TelaComRosto: React.FC<{
  pilar: Pilar;
  video: string; // "" = sem rosto (só a tela)
  canto?: CantoDoRosto;
  larguraRosto?: number;
  alturaRosto?: number;
  enquadramento?: string;
  fimDoVideo: number; // frame em que o vídeo termina (barra cheia)
  barra?: boolean; // barra de progresso de 8 px no rodapé
  mostrarGuia?: boolean;
  children: React.ReactNode;
}> = ({ pilar, video, canto = "inferior-esquerdo", larguraRosto = 320, alturaRosto = 420, enquadramento = "50% 40%", fimDoVideo, barra = true, mostrarGuia = false, children }) => {
  const frame = useCurrentFrame();
  const { acento } = pilares[pilar];
  return (
    <AbsoluteFill style={{ backgroundColor: ds.bg000 }}>
      <FundoNoite semente="tela-com-rosto" />
      {children}
      {video ? (
        <div
          style={{
            position: "absolute",
            ...quadroDoRosto(canto, larguraRosto, alturaRosto),
            borderRadius: ds.radius.lg,
            overflow: "hidden",
            boxSizing: "border-box",
            border: `2px solid ${ds.line}`,
            backgroundColor: ds.bg200,
          }}
        >
          {video === "exemplo" ? (
            <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", ...tipo.bodySm, color: ds.inkMuted }}>rosto</AbsoluteFill>
          ) : (
            <Video src={staticFile(video)} objectFit="cover" style={{ width: "100%", height: "100%", objectPosition: enquadramento }} />
          )}
        </div>
      ) : null}
      {barra ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 8, backgroundColor: ds.bg200 }}>
          <div style={{ height: 8, width: `${Math.min(1, frame / fimDoVideo) * 100}%`, backgroundColor: acento }} />
        </div>
      ) : null}
      {mostrarGuia ? <GuiaZonaSegura /> : null}
    </AbsoluteFill>
  );
};
