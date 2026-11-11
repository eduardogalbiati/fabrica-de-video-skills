import { interpolate, useCurrentFrame } from "remotion";
import { ds, tipo } from "../animacoes/tema";
import { aparece, ease } from "./util";

// Antes → depois em dois anéis de progresso: o da esquerda em cinza, o da direita na cor do pilar.
// Só use números que saíram de uma medição real (a nota antes e a nota depois).
const Anel: React.FC<{ cx: number; cy: number; raio: number; valor: number; maximo: number; cor: string; rotulo: string }> = ({
  cx,
  cy,
  raio,
  valor,
  maximo,
  cor,
  rotulo,
}) => {
  const comprimento = 2 * Math.PI * raio;
  return (
    <>
      <svg width={1080} height={960} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <circle cx={cx} cy={cy} r={raio} fill="none" stroke={ds.bg200} strokeWidth={24} />
        <circle
          cx={cx}
          cy={cy}
          r={raio}
          fill="none"
          stroke={cor}
          strokeWidth={24}
          strokeLinecap="round"
          strokeDasharray={comprimento}
          strokeDashoffset={comprimento * (1 - Math.min(1, valor / maximo))}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </svg>
      <div style={{ position: "absolute", left: cx, top: cy, translate: "-50% -50%", ...tipo.statXl, fontSize: 108, color: cor, fontVariantNumeric: "tabular-nums" }}>
        {Math.round(valor)}
      </div>
      <div style={{ position: "absolute", left: cx, top: cy + raio + 36, translate: "-50% 0px", ...tipo.chapter, fontSize: 26, color: ds.inkMuted, whiteSpace: "nowrap" }}>
        {rotulo}
      </div>
    </>
  );
};

export const AntesDepois: React.FC<{
  antes: number;
  depois: number;
  maximo?: number;
  rotuloAntes?: string;
  rotuloDepois?: string;
  acento: string;
  top: number;
  inicio?: number;
  depoisEm?: number;
}> = ({ antes, depois, maximo = 100, rotuloAntes = "antes", rotuloDepois = "depois", acento, top, inicio = 0, depoisEm = 30 }) => {
  const frame = useCurrentFrame();
  const raio = 150;
  const cy = top + raio + 20;
  const pAntes = interpolate(frame, [inicio, inicio + 24], [0, 1], ease);
  const pDepois = interpolate(frame, [depoisEm, depoisEm + 30], [0, 1], ease);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", inset: 0, ...aparece(frame, inicio, 10, 16) }}>
        <Anel cx={290} cy={cy} raio={raio} valor={antes * pAntes} maximo={maximo} cor={ds.inkMuted} rotulo={rotuloAntes} />
      </div>
      <div style={{ position: "absolute", left: 540, top: cy, translate: "-50% -50%", ...tipo.statXl, fontSize: 80, color: ds.inkMuted, ...aparece(frame, depoisEm - 6, 10, 0) }}>
        →
      </div>
      <div style={{ position: "absolute", inset: 0, ...aparece(frame, depoisEm, 10, 16) }}>
        <Anel cx={790} cy={cy} raio={raio} valor={antes + (depois - antes) * pDepois} maximo={maximo} cor={acento} rotulo={rotuloDepois} />
      </div>
    </div>
  );
};
