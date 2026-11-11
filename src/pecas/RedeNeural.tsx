import { interpolate, random, useCurrentFrame } from "remotion";
import { ds } from "../animacoes/tema";
import { clamp, ease } from "./util";

// "Cérebro da IA": camadas de pontos ligadas por linhas finas que se desenham.
export type No = { x: number; y: number };

export type RedeProps = {
  cx: number;
  cy: number;
  largura: number;
  altura: number;
  semente: string;
  camadas?: number[];
  acento?: string; // se definido, a rede é "colorida" (cirurgiã)
  inicio?: number; // frame em que começa a se desenhar
  acesos?: { indice: number; em: number; cor: string }[]; // nós que acendem num frame
  opacidade?: number;
};

export const nosDaRede = ({ cx, cy, largura, altura, semente, camadas = [3, 5, 5, 3] }: RedeProps) => {
  const nos: (No & { camada: number })[] = [];
  camadas.forEach((qtd, c) => {
    const x = cx - largura / 2 + (largura * c) / (camadas.length - 1);
    for (let i = 0; i < qtd; i++) {
      const y = cy - altura / 2 + (altura * (i + 0.5)) / qtd + (random(`${semente}-j-${c}-${i}`) - 0.5) * 18;
      nos.push({ x: x + (random(`${semente}-k-${c}-${i}`) - 0.5) * 16, y, camada: c });
    }
  });
  const arestas: [number, number][] = [];
  nos.forEach((a, ia) => {
    nos.forEach((b, ib) => {
      if (b.camada === a.camada + 1 && random(`${semente}-e-${ia}-${ib}`) < 0.55) arestas.push([ia, ib]);
    });
  });
  return { nos, arestas };
};

export const RedeNeural: React.FC<RedeProps> = (props) => {
  const frame = useCurrentFrame();
  const { acento, inicio = 0, acesos = [], opacidade = 1 } = props;
  const { nos, arestas } = nosDaRede(props);
  const corNo = acento ?? ds.inkMuted;
  const corLinha = acento ? `${acento}66` : ds.line;

  return (
    <svg width={1080} height={960} style={{ position: "absolute", inset: 0, opacity: opacidade, overflow: "visible" }}>
      {arestas.map(([a, b], i) => {
        const A = nos[a];
        const B = nos[b];
        const len = Math.hypot(B.x - A.x, B.y - A.y);
        const p = interpolate(frame, [inicio + nos[a].camada * 5, inicio + nos[a].camada * 5 + 16], [0, 1], ease);
        return (
          <line
            key={i}
            x1={A.x}
            y1={A.y}
            x2={B.x}
            y2={B.y}
            stroke={corLinha}
            strokeWidth={acento ? 2 : 2}
            strokeDasharray={len}
            strokeDashoffset={len * (1 - p)}
          />
        );
      })}
      {nos.map((n, i) => {
        const s = interpolate(frame, [inicio + n.camada * 5, inicio + n.camada * 5 + 10], [0, 1], ease);
        const aceso = acesos.find((a) => a.indice === i && frame >= a.em);
        const pulso = aceso ? interpolate(frame, [aceso.em, aceso.em + 8, aceso.em + 20], [1, 1.9, 1.25], clamp) : 1;
        return (
          <g key={i}>
            {aceso ? <circle cx={n.x} cy={n.y} r={22 * pulso} fill={aceso.cor} opacity={0.18} /> : null}
            <circle cx={n.x} cy={n.y} r={9 * s * pulso} fill={aceso ? aceso.cor : corNo} />
          </g>
        );
      })}
    </svg>
  );
};

// Linha "bisturi" que se desenha de um ponto a outro (curva opcional)
export const Bisturi: React.FC<{ de: No; para: No; inicio: number; duracao?: number; cor: string; curva?: number }> = ({
  de,
  para,
  inicio,
  duracao = 18,
  cor,
  curva = -80,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [inicio, inicio + duracao], [0, 1], ease);
  const mx = (de.x + para.x) / 2;
  const my = (de.y + para.y) / 2 + curva;
  const d = `M ${de.x} ${de.y} Q ${mx} ${my} ${para.x} ${para.y}`;
  // ponta do bisturi (ponto na curva em t=p)
  const t = p;
  const px = (1 - t) * (1 - t) * de.x + 2 * (1 - t) * t * mx + t * t * para.x;
  const py = (1 - t) * (1 - t) * de.y + 2 * (1 - t) * t * my + t * t * para.y;
  return (
    <svg width={1080} height={960} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <path d={d} fill="none" stroke={cor} strokeWidth={4} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
      {p > 0 && p < 1 ? <circle cx={px} cy={py} r={8} fill={cor} /> : null}
    </svg>
  );
};
