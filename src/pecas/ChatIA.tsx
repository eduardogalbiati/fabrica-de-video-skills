import { interpolate } from "remotion";
import { useCurrentFrame } from "../relogio";
import { cartao, flutua } from "../animacoes/estilo";
import { ds, tipo } from "../animacoes/tema";
import { aparece, clamp } from "./util";

// Conversa com uma IA: o pedido é "digitado" à direita e a resposta aparece linha a linha à esquerda.
// Serve para "colei o prompt na IA", "pedi em português", "ela respondeu isso".
// O texto precisa ser o que foi dito ou escrito de verdade; não invente resposta de IA.
export const ChatIA: React.FC<{
  pedido: string;
  resposta: string[];
  nomeIA?: string;
  acento: string;
  top: number;
  inicio?: number;
  respondeEm?: number;
  letrasPorQuadro?: number;
}> = ({ pedido, resposta, nomeIA = "IA", acento, top, inicio = 0, respondeEm, letrasPorQuadro = 1.6 }) => {
  const frame = useCurrentFrame();
  const letras = Math.max(0, Math.floor((frame - inicio - 6) * letrasPorQuadro));
  const fimDaDigitacao = inicio + 6 + Math.ceil(pedido.length / letrasPorQuadro);
  const responde = respondeEm ?? fimDaDigitacao + 10;
  const cursor = letras < pedido.length && Math.floor(frame / 8) % 2 === 0;
  return (
    <div style={{ position: "absolute", left: ds.space[4], right: ds.space[4], top, display: "flex", flexDirection: "column", gap: 26, ...flutua(frame, `chat-${pedido}`) }}>
      <div
        style={{
          alignSelf: "flex-end",
          maxWidth: "86%",
          padding: "22px 30px",
          borderRadius: ds.radius.md,
          backgroundColor: ds.bg200,
          ...tipo.bodyLg,
          color: ds.ink,
          opacity: interpolate(frame, [inicio, inicio + 8], [0, 1], clamp),
          ...cartao(acento, ds.bg200),
        }}
      >
        {pedido.slice(0, letras)}
        <span style={{ opacity: cursor ? 1 : 0, color: acento }}>|</span>
      </div>
      <div style={{ display: "flex", gap: 22, alignItems: "flex-start", ...aparece(frame, responde, 12, 18) }}>
        <div style={{ flex: "none", width: 56, height: 56, borderRadius: ds.radius.sm * 2, backgroundColor: acento }} />
        <div style={{ flex: 1, padding: "22px 30px", borderRadius: ds.radius.md, backgroundColor: ds.bg100, border: `2px solid ${ds.line}`, ...cartao(acento) }}>
          <div style={{ ...tipo.chapter, fontSize: 22, color: ds.inkMuted }}>{nomeIA}</div>
          {resposta.map((linha, i) => (
            <div key={i} style={{ ...tipo.bodyLg, color: ds.ink, marginTop: 10, ...aparece(frame, responde + 8 + i * 8, 10, 12) }}>
              {linha}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
