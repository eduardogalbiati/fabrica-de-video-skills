import { interpolate } from "remotion";
import { useCurrentFrame } from "../relogio";
import { ds } from "../animacoes/tema";
import { ease } from "./util";

// Ícone de olho com um risco que se desenha.
export const OlhoRiscado: React.FC<{ cx: number; cy: number; tamanho?: number; inicio?: number }> = ({ cx, cy, tamanho = 220, inicio = 0 }) => {
  const frame = useCurrentFrame();
  const entra = interpolate(frame, [inicio, inicio + 12], [0, 1], ease);
  const risco = interpolate(frame, [inicio + 10, inicio + 24], [0, 1], ease);
  const w = tamanho;
  const h = tamanho * 0.55;
  return (
    <svg width={1080} height={960} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: entra }}>
      <path
        d={`M ${cx - w / 2} ${cy} Q ${cx} ${cy - h} ${cx + w / 2} ${cy} Q ${cx} ${cy + h} ${cx - w / 2} ${cy} Z`}
        fill="none"
        stroke={ds.ink}
        strokeWidth={8}
        strokeLinejoin="round"
      />
      <circle cx={cx} cy={cy} r={w * 0.16} fill="none" stroke={ds.ink} strokeWidth={8} />
      <line
        x1={cx - w * 0.45}
        y1={cy - h * 0.75}
        x2={cx - w * 0.45 + w * 0.9 * risco}
        y2={cy - h * 0.75 + h * 1.5 * risco}
        stroke={ds.ink}
        strokeWidth={10}
        strokeLinecap="round"
      />
    </svg>
  );
};
