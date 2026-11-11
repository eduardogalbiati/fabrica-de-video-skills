import { interpolate, useCurrentFrame } from "remotion";
import { ds } from "../animacoes/tema";
import { clamp, ease } from "./util";

// Grade de 1.000 conexões (40 × 25). `acesos` = índices que acendem na cor do acento.
export const GradeConexoes: React.FC<{
  x: number;
  y: number;
  largura: number;
  acento: string;
  acesos?: number[];
  acendeEm?: number;
  inicio?: number;
}> = ({ x, y, largura, acento, acesos = [517], acendeEm = 20, inicio = 0 }) => {
  const frame = useCurrentFrame();
  const COLS = 40;
  const LINHAS = 25;
  const passo = largura / COLS;
  const r = passo * 0.18;
  return (
    <svg width={1080} height={960} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      {Array.from({ length: COLS * LINHAS }, (_, i) => {
        const c = i % COLS;
        const l = Math.floor(i / COLS);
        const op = interpolate(frame, [inicio + l * 0.5, inicio + l * 0.5 + 8], [0, 1], ease);
        const aceso = acesos.includes(i) && frame >= acendeEm;
        const pulso = aceso ? interpolate(frame, [acendeEm, acendeEm + 8, acendeEm + 22], [1, 3.2, 2], clamp) : 1;
        return (
          <g key={i}>
            {aceso ? <circle cx={x + c * passo + passo / 2} cy={y + l * passo + passo / 2} r={r * pulso * 3} fill={acento} opacity={0.22} /> : null}
            <circle
              cx={x + c * passo + passo / 2}
              cy={y + l * passo + passo / 2}
              r={r * pulso}
              fill={aceso ? acento : ds.inkMuted}
              opacity={aceso ? 1 : op * 0.45}
            />
          </g>
        );
      })}
    </svg>
  );
};
