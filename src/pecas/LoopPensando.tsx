import { interpolate } from "remotion";
import { useCurrentFrame } from "../relogio";
import { ds, fonteMono } from "../animacoes/tema";
import { clamp } from "./util";

// Seta circular girando + "pensando…" repetido: a IA travada no mesmo pensamento.
// `quebraEm`: frame em que o loop se rompe e some.
export const LoopPensando: React.FC<{ cx: number; cy: number; raio?: number; cor?: string; quebraEm?: number; inicio?: number }> = ({
  cx,
  cy,
  raio = 150,
  cor = ds.inkMuted,
  quebraEm,
  inicio = 0,
}) => {
  const frame = useCurrentFrame();
  const giro = (frame - inicio) * 6;
  const entra = interpolate(frame, [inicio, inicio + 12], [0, 1], clamp);
  const quebra = quebraEm === undefined ? 0 : interpolate(frame, [quebraEm, quebraEm + 14], [0, 1], clamp);
  const id = `loop-${cx}-${cy}`;
  const arco = 300;
  const rad = (g: number) => (g * Math.PI) / 180;
  const ponto = (g: number, r = raio) => [cx + r * Math.cos(rad(g)), cy + r * Math.sin(rad(g))];
  const [x1, y1] = ponto(0);
  const [x2, y2] = ponto(arco);
  return (
    <svg width={1080} height={960} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: entra * (1 - quebra) }}>
      <defs>
        <path id={id} d={`M ${cx - raio - 40} ${cy} a ${raio + 40} ${raio + 40} 0 1 1 ${2 * (raio + 40)} 0 a ${raio + 40} ${raio + 40} 0 1 1 ${-2 * (raio + 40)} 0`} />
      </defs>
      <g transform={`rotate(${giro} ${cx} ${cy})`}>
        {/* arco com seta; ao quebrar, as pontas se afastam */}
        <g transform={`translate(${-quebra * 30} ${quebra * 10})`}>
          <path d={`M ${x1} ${y1} A ${raio} ${raio} 0 1 1 ${x2} ${y2}`} fill="none" stroke={cor} strokeWidth={6} strokeLinecap="round" />
          <polygon points={`${x2},${y2 - 18} ${x2 + 22},${y2 + 8} ${x2 - 14},${y2 + 14}`} fill={cor} transform={`rotate(${arco - 20} ${x2} ${y2})`} />
        </g>
      </g>
      <text style={{ fontFamily: fonteMono, fontSize: 26, fill: ds.inkMuted, letterSpacing: "0.06em" }}>
        <textPath href={`#${id}`} startOffset={`${(frame - inicio) * 0.4}%`}>
          pensando… pensando… pensando…
        </textPath>
      </text>
    </svg>
  );
};
