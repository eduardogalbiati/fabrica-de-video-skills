import { interpolate, useCurrentFrame } from "remotion";
import { ds, tipo } from "../animacoes/tema";
import { aparece, ease } from "./util";

// Lista de tarefas que vão sendo marcadas. `marcaEm[i]` = frame em que o item i ganha o ✓ (omita para deixar sem marcar).
export const Checklist: React.FC<{
  itens: string[];
  marcaEm?: (number | undefined)[];
  acento: string;
  top: number;
  inicio?: number;
  passo?: number;
  tamanho?: number;
}> = ({ itens, marcaEm = [], acento, top, inicio = 0, passo = 6, tamanho = 38 }) => {
  const frame = useCurrentFrame();
  const caixa = Math.round(tamanho * 1.25);
  return (
    <div style={{ position: "absolute", left: ds.space[4], right: ds.space[4], top, display: "flex", flexDirection: "column", gap: Math.round(tamanho * 0.7) }}>
      {itens.map((texto, i) => {
        const em = marcaEm[i];
        const p = em === undefined ? 0 : interpolate(frame, [em, em + 10], [0, 1], ease);
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 26, ...aparece(frame, inicio + i * passo, 12, 18) }}>
            <svg width={caixa} height={caixa} viewBox="0 0 48 48" style={{ flex: "none" }}>
              <rect x={3} y={3} width={42} height={42} rx={10} fill={acento} fillOpacity={p} stroke={p > 0 ? acento : ds.inkMuted} strokeWidth={3} />
              <path d="M13 25 L21 33 L36 16" fill="none" stroke={ds.bg000} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
            </svg>
            <span style={{ ...tipo.bodyLg, fontSize: tamanho, fontWeight: 600, color: ds.ink }}>{texto}</span>
          </div>
        );
      })}
    </div>
  );
};
