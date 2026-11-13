import { interpolate, spring } from "remotion";
import { useCurrentFrame, useVideoConfig } from "../relogio";
import { ds, fonteDisplay, tipo } from "../animacoes/tema";
import { clamp } from "../pecas/util";

// Etiqueta colada: um adesivo na cor do pilar que gruda num objeto da cena (notebook, caneca, quadro).
// Bom para dar nome a uma coisa que aparece na gravação.
//   x, y:    centro da etiqueta;  giro: inclinação em graus
//   trilha:  se o objeto se mexe, pontos marcados à mão ({ em: quadro, x, y }); a etiqueta segue entre eles
//   corTexto: cor do texto sobre o acento (use pilares[pilar].textoNoBotao)
export const EtiquetaColada: React.FC<{
  texto: string;
  numero?: string;
  acento: string;
  corTexto: string;
  x: number;
  y: number;
  giro?: number;
  em: number;
  saiEm?: number;
  tamanho?: number;
  trilha?: { em: number; x: number; y: number }[];
}> = ({ texto, numero, acento, corTexto, x, y, giro = -4, em, saiEm, tamanho = 46, trilha }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cola = spring({ frame: frame - em, fps, config: { damping: 14, stiffness: 180, mass: 0.7 } });
  const descola = saiEm === undefined ? 0 : interpolate(frame, [saiEm, saiEm + 8], [0, 1], clamp);
  const px = trilha && trilha.length > 1 ? interpolate(frame, trilha.map((p) => p.em), trilha.map((p) => p.x), clamp) : x;
  const py = trilha && trilha.length > 1 ? interpolate(frame, trilha.map((p) => p.em), trilha.map((p) => p.y), clamp) : y;
  if (frame < em) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: px,
        top: py,
        translate: "-50% -50%",
        rotate: `${giro + descola * 12}deg`,
        scale: Math.max(0, cola * (1 - descola * 0.6)),
        opacity: 1 - descola,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "14px 26px 14px 14px",
        borderRadius: 16,
        backgroundColor: acento,
        boxShadow: "0 10px 26px rgba(0, 0, 0, 0.35)",
        whiteSpace: "nowrap",
      }}
    >
      {numero ? (
        <div style={{ minWidth: tamanho * 1.1, height: tamanho * 1.1, padding: "0 10px", boxSizing: "border-box", borderRadius: 10, backgroundColor: ds.bg000, display: "flex", alignItems: "center", justifyContent: "center", ...tipo.chapter, fontSize: tamanho * 0.6, color: acento }}>
          {numero}
        </div>
      ) : null}
      <div style={{ fontFamily: fonteDisplay, fontWeight: 800, fontSize: tamanho, lineHeight: 1, letterSpacing: "-0.01em", color: corTexto, paddingLeft: numero ? 0 : 12 }}>{texto}</div>
    </div>
  );
};
