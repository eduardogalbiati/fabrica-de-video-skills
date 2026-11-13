import { interpolate } from "remotion";
import { useCurrentFrame } from "../relogio";
import { tipo } from "../animacoes/tema";
import { clamp } from "./util";

// Carimbo ("APROVADO", "100 DE 100", "TESTADO"): moldura inclinada que assenta sem quicar.
// (x, y) é o centro do carimbo.
export const Carimbo: React.FC<{ texto: string; cor: string; x: number; y: number; inicio?: number; rotacao?: number; tamanho?: number }> = ({
  texto,
  cor,
  x,
  y,
  inicio = 0,
  rotacao = -8,
  tamanho = 64,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [inicio, inicio + 8], [0, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        translate: "-50% -50%",
        rotate: `${rotacao}deg`,
        scale: interpolate(p, [0, 1], [1.25, 1]),
        opacity: p,
        padding: `${tamanho * 0.28}px ${tamanho * 0.6}px`,
        border: `${Math.max(4, Math.round(tamanho / 10))}px solid ${cor}`,
        borderRadius: 8,
        ...tipo.chapter,
        fontSize: tamanho,
        fontWeight: 700,
        letterSpacing: "0.08em",
        color: cor,
        whiteSpace: "nowrap",
      }}
    >
      {texto}
    </div>
  );
};
