import { interpolate, useCurrentFrame } from "remotion";
import { ds, tipo } from "../animacoes/tema";
import { aparece, ease } from "./util";

// Comparação em barras horizontais (ex.: "Gravar 1 min" × "Editar 3 h"). Uma barra por linha;
// `destaque: true` pinta a barra na cor do pilar. `texto` é o que aparece à direita (ex.: "3 h").
export const Barras: React.FC<{
  itens: { rotulo: string; valor: number; texto?: string; destaque?: boolean }[];
  maximo?: number;
  acento: string;
  top: number;
  inicio?: number;
  passo?: number;
}> = ({ itens, maximo, acento, top, inicio = 0, passo = 10 }) => {
  const frame = useCurrentFrame();
  const teto = maximo ?? Math.max(...itens.map((i) => i.valor));
  return (
    <div style={{ position: "absolute", left: ds.space[4], right: ds.space[4], top, display: "flex", flexDirection: "column", gap: 34 }}>
      {itens.map((item, i) => {
        const t = inicio + i * passo;
        const p = interpolate(frame, [t + 4, t + 30], [0, 1], ease);
        const cor = item.destaque ? acento : ds.inkMuted;
        return (
          <div key={i} style={aparece(frame, t, 12, 18)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ ...tipo.bodyLg, fontWeight: 600, color: ds.ink }}>{item.rotulo}</span>
              <span style={{ ...tipo.statXl, fontSize: 56, color: cor, fontVariantNumeric: "tabular-nums" }}>{item.texto ?? item.valor}</span>
            </div>
            <div style={{ marginTop: 12, height: 26, borderRadius: ds.radius.pill, backgroundColor: ds.bg200, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.max(2, (item.valor / teto) * 100 * p)}%`, borderRadius: ds.radius.pill, backgroundColor: cor }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
