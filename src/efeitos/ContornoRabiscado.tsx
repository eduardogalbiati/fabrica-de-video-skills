import { useId } from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { ds } from "../animacoes/tema";
import { clamp } from "../pecas/util";

// Contorno rabiscado: uma linha desenhada à mão em volta da silhueta, que "ferve" (muda um pouco a cada
// 3 quadros, como animação feita à mão), e rabiscos soltos em volta (brilho, círculo, espiral).
// PRECISA DO RECORTE: `pessoa` = <PessoaRecortada>; o contorno sai da transparência dela.
//   espessura: da linha;  distancia: folga entre a pessoa e a linha;  rabiscos: posição, tamanho e quadro de cada um
export type Rabisco = { tipo: "brilho" | "circulo" | "espiral" | "traco"; x: number; y: number; tamanho?: number; em: number; cor?: "acento" | "tinta" };

const caminho = (r: Rabisco) => {
  const t = r.tamanho ?? 60;
  if (r.tipo === "brilho") return `M0 ${-t} L0 ${-t * 0.3} M0 ${t * 0.3} L0 ${t} M${-t} 0 L${-t * 0.3} 0 M${t * 0.3} 0 L${t} 0`;
  if (r.tipo === "circulo") return `M${t} 0 A${t} ${t} 0 1 1 ${t * 0.9} ${-t * 0.4}`;
  if (r.tipo === "espiral") return `M0 0 C${t * 0.3} ${-t * 0.3} ${t * 0.6} 0 ${t * 0.3} ${t * 0.35} C0 ${t * 0.7} ${-t * 0.7} ${t * 0.4} ${-t * 0.6} ${-t * 0.2} C${-t * 0.5} ${-t * 0.9} ${t * 0.6} ${-t} ${t} ${-t * 0.2}`;
  return `M${-t} ${t * 0.2} Q0 ${-t * 0.4} ${t} ${t * 0.1}`;
};

export const ContornoRabiscado: React.FC<{
  pessoa: React.ReactNode;
  acento: string;
  em: number;
  espessura?: number;
  distancia?: number;
  rabiscos?: Rabisco[];
}> = ({ pessoa, acento, em, espessura = 7, distancia = 14, rabiscos = [] }) => {
  const frame = useCurrentFrame();
  const id = useId().replace(/:/g, "");
  const passo = Math.floor(frame / 3); // a cada 3 quadros o traço muda
  const aparece = interpolate(frame, [em, em + 14], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id={`contorno-${id}`} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
          <feMorphology in="SourceAlpha" operator="dilate" radius={distancia + espessura} result="fora" />
          <feMorphology in="SourceAlpha" operator="dilate" radius={distancia} result="dentro" />
          <feComposite in="fora" in2="dentro" operator="out" result="anel" />
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves={2} seed={passo % 7} result="ruido" />
          <feDisplacementMap in="anel" in2="ruido" scale={16} xChannelSelector="R" yChannelSelector="G" result="tremido" />
          <feFlood floodColor={ds.ink} result="cor" />
          <feComposite in="cor" in2="tremido" operator="in" />
        </filter>
      </svg>
      <AbsoluteFill style={{ filter: `url(#contorno-${id})`, clipPath: `inset(${((1 - aparece) * 100).toFixed(1)}% 0px 0px 0px)` }}>{pessoa}</AbsoluteFill>
      <AbsoluteFill>{pessoa}</AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {rabiscos.map((r, i) => {
          const d = interpolate(frame, [r.em, r.em + 10], [1, 0], clamp);
          const dx = (random(`rab-x-${i}-${passo}`) - 0.5) * 6;
          const dy = (random(`rab-y-${i}-${passo}`) - 0.5) * 6;
          const giro = (random(`rab-g-${i}-${passo}`) - 0.5) * 8;
          return (
            <path
              key={i}
              d={caminho(r)}
              transform={`translate(${r.x + dx} ${r.y + dy}) rotate(${giro})`}
              fill="none"
              stroke={r.cor === "tinta" ? ds.ink : acento}
              strokeWidth={7}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={d}
              opacity={frame >= r.em ? 1 : 0}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
