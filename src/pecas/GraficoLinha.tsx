import { interpolate, useCurrentFrame } from "remotion";
import { ds, tipo } from "../animacoes/tema";
import { aparece, ease } from "./util";

// Gráfico de linha que se desenha da esquerda para a direita, com o valor final em mono.
// `pontos` são os valores na ordem do tempo (dado real: views, nota, custo, tokens).
export const GraficoLinha: React.FC<{
  pontos: number[];
  rotuloInicio?: string;
  rotuloFim?: string;
  valorFinal?: string;
  acento: string;
  top: number;
  altura?: number;
  inicio?: number;
  duracao?: number;
}> = ({ pontos, rotuloInicio, rotuloFim, valorFinal, acento, top, altura = 360, inicio = 0, duracao = 40 }) => {
  const frame = useCurrentFrame();
  const x0 = ds.space[4];
  const x1 = 1080 - ds.space[4] - 20;
  const min = Math.min(...pontos);
  const max = Math.max(...pontos);
  const px = (i: number) => x0 + ((x1 - x0) * i) / Math.max(1, pontos.length - 1);
  const py = (v: number) => top + altura - ((v - min) / Math.max(1e-9, max - min)) * altura;
  const p = interpolate(frame, [inicio, inicio + duracao], [0, 1], ease);
  const fimX = px(pontos.length - 1);
  const fimY = py(pontos[pontos.length - 1]);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width={1080} height={960} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <line x1={x0} y1={top + altura + 12} x2={1080 - ds.space[4]} y2={top + altura + 12} stroke={ds.line} strokeWidth={2} />
        <polyline
          points={pontos.map((v, i) => `${px(i)},${py(v)}`).join(" ")}
          fill="none"
          stroke={acento}
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - p}
        />
        <circle cx={fimX} cy={fimY} r={14} fill={acento} opacity={interpolate(frame, [inicio + duracao - 4, inicio + duracao + 4], [0, 1], ease)} />
      </svg>
      {valorFinal ? (
        // o valor fica acima do último ponto, alinhado à direita, para não sair da margem
        <div style={{ position: "absolute", left: fimX + 14, top: fimY - 100, translate: "-100% 0px", ...tipo.statXl, fontSize: 60, color: acento, whiteSpace: "nowrap", opacity: aparece(frame, inicio + duracao - 2, 10, 0).opacity }}>
          {valorFinal}
        </div>
      ) : null}
      {rotuloInicio ? (
        <div style={{ position: "absolute", left: x0, top: top + altura + 30, ...tipo.chapter, fontSize: 24, color: ds.inkMuted, ...aparece(frame, inicio, 10, 0) }}>{rotuloInicio}</div>
      ) : null}
      {rotuloFim ? (
        <div style={{ position: "absolute", left: fimX, top: top + altura + 30, translate: "-100% 0px", ...tipo.chapter, fontSize: 24, color: ds.inkMuted, whiteSpace: "nowrap", ...aparece(frame, inicio + 8, 10, 0) }}>
          {rotuloFim}
        </div>
      ) : null}
    </div>
  );
};
