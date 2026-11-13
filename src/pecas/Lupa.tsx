import { interpolate } from "remotion";
import { useCurrentFrame } from "../relogio";
import { tipo } from "../animacoes/tema";
import type { No } from "./RedeNeural";
import { ease } from "./util";

// Lupa que varre uma lista de pontos e para no último.
export const Lupa: React.FC<{ caminho: No[]; inicio: number; duracao: number; cor: string; rotulo?: string }> = ({
  caminho,
  inicio,
  duracao,
  cor,
  rotulo,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [inicio, inicio + duracao], [0, caminho.length - 1], ease);
  const i = Math.min(Math.floor(p), caminho.length - 2);
  const f = p - i;
  const x = caminho[i].x + (caminho[i + 1].x - caminho[i].x) * f;
  const y = caminho[i].y + (caminho[i + 1].y - caminho[i].y) * f;
  const op = interpolate(frame, [inicio - 8, inicio], [0, 1], ease);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: op }}>
      <svg width={1080} height={960} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <circle cx={x} cy={y} r={46} fill={`${cor}22`} stroke={cor} strokeWidth={6} />
        <line x1={x + 33} y1={y + 33} x2={x + 80} y2={y + 80} stroke={cor} strokeWidth={12} strokeLinecap="round" />
      </svg>
      {rotulo ? (
        <div style={{ position: "absolute", left: x + 70, top: y + 84, ...tipo.chapter, fontSize: 24, color: cor, whiteSpace: "nowrap" }}>
          {rotulo}
        </div>
      ) : null}
    </div>
  );
};
