import { interpolate } from "remotion";
import { useCurrentFrame } from "../relogio";
import { cartao, flutua } from "../animacoes/estilo";
import { ds, tipo } from "../animacoes/tema";
import { ease } from "./util";

// Cartão de notificação que desce do topo (ex.: "chegou um e-mail", "a IA terminou", "novo comentário").
// `saiEm`: frame em que o cartão some (opcional).
export const Notificacao: React.FC<{
  app: string;
  titulo: string;
  texto?: string;
  quando?: string;
  acento: string;
  top: number;
  inicio?: number;
  saiEm?: number;
}> = ({ app, titulo, texto, quando = "agora", acento, top, inicio = 0, saiEm }) => {
  const frame = useCurrentFrame();
  const entra = interpolate(frame, [inicio, inicio + 12], [0, 1], ease);
  const sai = saiEm === undefined ? 1 : interpolate(frame, [saiEm, saiEm + 8], [1, 0], ease);
  return (
    <div
      style={{
        position: "absolute",
        left: ds.space[4],
        right: ds.space[4],
        top,
        display: "flex",
        gap: 28,
        alignItems: "flex-start",
        padding: "28px 32px",
        borderRadius: ds.radius.md,
        backgroundColor: ds.bg100,
        border: `2px solid ${ds.line}`,
        opacity: entra * sai,
        translate: `0px ${interpolate(entra, [0, 1], [-28, 0])}px`,
        ...cartao(acento),
        ...flutua(frame, `notificacao-${titulo}`),
      }}
    >
      <div style={{ flex: "none", width: 72, height: 72, borderRadius: ds.radius.sm * 2, backgroundColor: acento }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", ...tipo.chapter, fontSize: 22, color: ds.inkMuted }}>
          <span>{app}</span>
          <span>{quando}</span>
        </div>
        <div style={{ ...tipo.titleMd, fontSize: 40, color: ds.ink, marginTop: 8 }}>{titulo}</div>
        {texto ? <div style={{ ...tipo.bodyLg, fontSize: 30, color: ds.inkMuted, marginTop: 6 }}>{texto}</div> : null}
      </div>
    </div>
  );
};
