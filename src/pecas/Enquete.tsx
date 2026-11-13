import { interpolate } from "remotion";
import { useCurrentFrame } from "../relogio";
import { cartao, flutua } from "../animacoes/estilo";
import { ds, tipo } from "../animacoes/tema";
import { aparece, ease } from "./util";

// Enquete: pergunta + opções; em `revelaEm` as barras enchem e a opção `vencedora` fica na cor do pilar.
// Os percentuais precisam vir de um dado real (uma enquete que existiu, uma pesquisa citada).
export const Enquete: React.FC<{
  pergunta: string;
  opcoes: { texto: string; pct: number }[];
  vencedora?: number;
  acento: string;
  top: number;
  inicio?: number;
  revelaEm?: number;
}> = ({ pergunta, opcoes, vencedora, acento, top, inicio = 0, revelaEm = 30 }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: ds.space[4], right: ds.space[4], top, ...flutua(frame, `enquete-${pergunta}`) }}>
      <div style={{ ...tipo.titleMd, fontSize: 46, color: ds.ink, ...aparece(frame, inicio) }}>{pergunta}</div>
      <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 18 }}>
        {opcoes.map((o, i) => {
          const p = interpolate(frame, [revelaEm + i * 3, revelaEm + i * 3 + 24], [0, 1], ease);
          const ganhou = i === vencedora;
          return (
            <div
              key={i}
              style={{
                position: "relative",
                height: 84,
                borderRadius: ds.radius.md,
                backgroundColor: ds.bg100,
                border: `2px solid ${ds.line}`,
                overflow: "hidden",
                ...aparece(frame, inicio + 6 + i * 4, 12, 18),
                ...cartao(acento),
              }}
            >
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${o.pct * p}%`, backgroundColor: ganhou ? acento : ds.bg200, opacity: ganhou ? 0.9 : 1 }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 30px" }}>
                <span style={{ ...tipo.bodyLg, fontWeight: 600, color: ds.ink }}>{o.texto}</span>
                <span style={{ ...tipo.statXl, fontSize: 38, color: ds.ink, opacity: p, fontVariantNumeric: "tabular-nums" }}>{Math.round(o.pct * p)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
