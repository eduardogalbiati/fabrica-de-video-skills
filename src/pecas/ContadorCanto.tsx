import { interpolate, useCurrentFrame } from "remotion";
import { cartao, comAlfa } from "../animacoes/estilo";
import { ds, tipo } from "../animacoes/tema";
import { ease } from "./util";

// Contador no canto de cima à direita ("07/17"): marca em que item de uma sequência o vídeo está.
// Bom para mostruário, "N dicas", "N passos". Vai dentro da cena do item e entra com ela.
//   atual, total: os números (o atual ganha zero à esquerda, no tamanho do total);  rotulo: palavra opcional antes
export const ContadorCanto: React.FC<{ atual: number; total: number; acento: string; rotulo?: string; top?: number; inicio?: number }> = ({
  atual,
  total,
  acento,
  rotulo,
  top = 176,
  inicio = 0,
}) => {
  const frame = useCurrentFrame();
  const v = interpolate(frame, [inicio, inicio + 8], [0, 1], ease);
  const casas = String(total).length;
  return (
    <div
      style={{
        position: "absolute",
        right: ds.space[4],
        top,
        display: "flex",
        alignItems: "baseline",
        gap: 10,
        padding: "8px 16px",
        borderRadius: ds.radius.sm,
        backgroundColor: comAlfa(ds.bg000, 0.72),
        border: `2px solid ${ds.line}`,
        ...tipo.chapter,
        fontSize: 26,
        color: ds.inkMuted,
        fontVariantNumeric: "tabular-nums",
        opacity: v,
        translate: `0px ${interpolate(v, [0, 1], [-8, 0])}px`,
        ...cartao(acento, ds.bg000),
      }}
    >
      {rotulo ? <span>{rotulo}</span> : null}
      <span style={{ color: acento, fontWeight: 700 }}>{String(atual).padStart(casas, "0")}</span>
      <span>/{total}</span>
    </div>
  );
};
