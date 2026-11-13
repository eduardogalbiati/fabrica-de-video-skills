import { interpolate } from "remotion";
import { useCurrentFrame } from "../relogio";
import { cartao, flutua } from "../animacoes/estilo";
import { ds, tipo } from "../animacoes/tema";
import { clamp } from "./util";

// Janela de terminal: comandos "digitados" e saídas que aparecem prontas.
// Cada linha: { texto, em (frame em que começa), tipo: "comando" | "saida" | "ok" }.
// Não mostre caminho de pasta, usuário ou chave de verdade na tela.
export const Terminal: React.FC<{
  titulo?: string;
  linhas: { texto: string; em: number; tipo?: "comando" | "saida" | "ok" }[];
  acento: string;
  top: number;
  altura?: number;
  inicio?: number;
  letrasPorQuadro?: number;
}> = ({ titulo = "terminal", linhas, acento, top, altura = 420, inicio = 0, letrasPorQuadro = 1.8 }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: ds.space[4],
        right: ds.space[4],
        top,
        height: altura,
        borderRadius: ds.radius.md,
        backgroundColor: ds.bg100,
        border: `2px solid ${ds.line}`,
        overflow: "hidden",
        opacity: interpolate(frame, [inicio, inicio + 10], [0, 1], clamp),
        ...cartao(acento),
        ...flutua(frame, `terminal-${titulo}`),
      }}
    >
      <div style={{ height: 56, display: "flex", alignItems: "center", gap: 10, padding: "0 24px", backgroundColor: ds.bg200 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: ds.inkMuted, opacity: 0.5 }} />
        ))}
        <span style={{ marginLeft: 14, ...tipo.chapter, fontSize: 20, color: ds.inkMuted }}>{titulo}</span>
      </div>
      <div style={{ padding: "22px 28px", display: "flex", flexDirection: "column", gap: 8 }}>
        {linhas.map((l, i) => {
          if (frame < l.em) return null;
          const comando = (l.tipo ?? "saida") === "comando";
          const n = comando ? Math.floor((frame - l.em) * letrasPorQuadro) : l.texto.length;
          return (
            <div key={i} style={{ ...tipo.code, fontSize: 28, color: l.tipo === "ok" ? acento : comando ? ds.ink : ds.inkMuted, whiteSpace: "pre-wrap" }}>
              {comando ? <span style={{ color: acento }}>$ </span> : null}
              {l.texto.slice(0, n)}
            </div>
          );
        })}
      </div>
    </div>
  );
};
