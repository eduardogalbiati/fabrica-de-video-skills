import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { Assinatura, Canto, FundoNoite } from "./Base";
import { ds, glow, PILAR_PADRAO, pilares, pilarSchema, SUAVE, tipo } from "./tema";

// Título + itens numerados (01, 02…) que entram um por vez.
export const listaDicasSchema = z.object({
  pilar: pilarSchema,
  eyebrow: z.string(),
  canto: z.string(),
  titulo: z.string(),
  itens: z.array(z.string()),
  segundosPorItem: z.number().min(0.5).max(10),
});
type Props = z.infer<typeof listaDicasSchema>;
const ease = { easing: Easing.bezier(...SUAVE), extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const comDestaque = (texto: string, acento: string) =>
  texto.split(/(\*[^*]+\*)/).map((t, i) => (t.startsWith("*") ? <span key={i} style={{ color: acento }}>{t.slice(1, -1)}</span> : t));

export const ListaDicas: React.FC<Props> = ({ pilar, eyebrow, canto, titulo, itens, segundosPorItem }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const { acento, soft, nome } = pilares[pilar];
  const inicio = Math.round(0.8 * fps);
  const porItem = Math.round(segundosPorItem * fps);

  return (
    <AbsoluteFill>
      <FundoNoite semente="lista" />
      <div style={{ position: "absolute", left: 120, top: 260, width: 520, height: 160, borderRadius: 999, backgroundColor: acento, filter: "blur(90px)", opacity: 0.35 * 0.6 }} />
      <Canto texto={canto || nome} />
      <div style={{ position: "absolute", left: ds.space[4], right: ds.space[4], top: 240 }}>
        <div style={{ ...tipo.eyebrow, color: soft, opacity: interpolate(frame, [0, 12], [0, 1], ease) }}>{eyebrow}</div>
        <div
          style={{
            ...tipo.hookLg,
            color: ds.ink,
            marginTop: ds.space[1],
            opacity: interpolate(frame, [4, 18], [0, 1], ease),
            translate: `0px ${interpolate(frame, [4, 18], [24, 0], ease)}px`,
          }}
        >
          {comDestaque(titulo, acento)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: ds.space[1] + 8, marginTop: ds.space[3] }}>
          {itens.map((item, i) => {
            const t0 = inicio + i * porItem;
            const t = interpolate(frame, [t0, t0 + 14], [0, 1], ease);
            const passado = frame >= t0 + porItem && i < itens.length - 1;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ds.space[2],
                  padding: ds.space[2],
                  borderRadius: ds.radius.md,
                  backgroundColor: ds.bg100,
                  border: `1px solid ${ds.line}`,
                  opacity: t * (passado ? 0.5 : 1),
                  translate: `0px ${interpolate(t, [0, 1], [40, 0])}px`,
                }}
              >
                <div style={{ ...tipo.statXl, fontSize: 56, color: acento, minWidth: 80 }}>{String(i + 1).padStart(2, "0")}</div>
                <div style={{ ...tipo.bodyLg, fontSize: 40, color: ds.ink }}>{comDestaque(item, acento)}</div>
              </div>
            );
          })}
        </div>
      </div>
      <Assinatura secao={nome} />
      {/* barra de progresso de 8px no rodapé */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 8, backgroundColor: ds.bg200 }}>
        <div style={{ height: 8, width: `${(frame / durationInFrames) * 100}%`, backgroundColor: acento }} />
      </div>
    </AbsoluteFill>
  );
};

export const listaDicasPadrao: Props = {
  pilar: PILAR_PADRAO,
  eyebrow: pilares[PILAR_PADRAO].nome,
  canto: "",
  titulo: "3 dicas para *começar*",
  itens: ["Primeira dica, curta e direta", "Segunda dica, com uma *palavra-chave*", "Terceira dica, a que fecha"],
  segundosPorItem: 1.8,
};

export const duracaoListaDicas = (p: Props, fps: number) => Math.round((0.8 + p.itens.length * p.segundosPorItem + 1.5) * fps);
