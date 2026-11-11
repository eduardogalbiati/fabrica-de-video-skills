import { interpolate, useCurrentFrame } from "remotion";
import { ds, tipo } from "../animacoes/tema";
import { aparece, ease } from "./util";

// Número em mono que conta de `de` até `ate`, com barra horizontal enchendo.
export const ContadorBarra: React.FC<{
  de: number;
  ate: number;
  maximo?: number;
  legenda: string;
  acento: string;
  top: number;
  inicio?: number;
  duracao?: number;
}> = ({ de, ate, maximo = 100, legenda, acento, top, inicio = 0, duracao = 36 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [inicio, inicio + duracao], [0, 1], ease);
  const valor = Math.round(de + (ate - de) * p);
  return (
    <div style={{ position: "absolute", left: ds.space[4], right: ds.space[4], top }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 28, ...tipo.statXl, fontSize: 200, fontVariantNumeric: "tabular-nums" }}>
        <span style={{ color: ds.inkMuted, fontSize: 110 }}>{de}</span>
        <span style={{ color: ds.inkMuted, fontSize: 90 }}>→</span>
        <span style={{ color: acento }}>{valor}</span>
      </div>
      <div style={{ marginTop: ds.space[2], height: 20, borderRadius: ds.radius.pill, backgroundColor: ds.bg200, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${((de + (ate - de) * p) / maximo) * 100}%`,
            borderRadius: ds.radius.pill,
            backgroundColor: acento,
          }}
        />
      </div>
      <div style={{ marginTop: ds.space[1], ...tipo.bodyLg, color: ds.inkMuted, ...aparece(frame, inicio + 6) }}>{legenda}</div>
    </div>
  );
};
