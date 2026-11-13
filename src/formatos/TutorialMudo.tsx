import { AbsoluteFill } from "remotion";
import { useCurrentFrame, useVideoConfig } from "../relogio";
import { FundoNoite, GuiaZonaSegura } from "../animacoes/Base";
import { ds, pilares, type Pilar, tipo } from "../animacoes/tema";
import { aparece, Destaque } from "../pecas/util";

// Formato "tutorial mudo": sem fala e sem rosto. Texto grande no terço de cima, com o número do passo em mono
// na cor do pilar, e o conteúdo (TelaSite, gravação de tela) embaixo. Feito para tocar em loop:
// o último passo deve mostrar a mesma tela do primeiro, para a emenda ficar invisível.
// `children` recebe o quadro inteiro; a área do conteúdo vai de y 620 a y 1580.
export const TutorialMudo: React.FC<{
  pilar: Pilar;
  passos: { de: number; ate: number; numero?: string; texto: string }[]; // tempos em segundos; *palavra* = cor do pilar
  barra?: boolean;
  mostrarGuia?: boolean;
  children: React.ReactNode;
}> = ({ pilar, passos, barra = true, mostrarGuia = false, children }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const { acento } = pilares[pilar];
  const t = frame / fps;
  const passo = passos.find((p) => t >= p.de && t < p.ate);
  return (
    <AbsoluteFill style={{ backgroundColor: ds.bg000 }}>
      <FundoNoite semente="tutorial-mudo" />
      {children}
      {passo ? (
        <div style={{ position: "absolute", left: ds.space[4], right: ds.space[4], top: 220, ...aparece(frame, Math.round(passo.de * fps), 8, 14) }}>
          {passo.numero ? <div style={{ ...tipo.statXl, fontSize: 96, color: acento }}>{passo.numero}</div> : null}
          <div style={{ ...tipo.hookLg, fontSize: 80, lineHeight: 1.02, color: ds.ink, marginTop: passo.numero ? 12 : 0 }}>
            <Destaque texto={passo.texto} acento={acento} />
          </div>
        </div>
      ) : null}
      {barra ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 8, backgroundColor: ds.bg200 }}>
          <div style={{ height: 8, width: `${Math.min(1, frame / Math.max(1, durationInFrames - 1)) * 100}%`, backgroundColor: acento }} />
        </div>
      ) : null}
      {mostrarGuia ? <GuiaZonaSegura /> : null}
    </AbsoluteFill>
  );
};
