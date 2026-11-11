import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { Assinatura, Canto, FundoNoite } from "./Base";
import { ds, glow, PILAR_PADRAO, pilares, pilarSchema, SUAVE, tipo } from "./tema";

// Número grande em mono que conta até o valor, com a unidade abaixo.
export const contadorSchema = z.object({
  pilar: pilarSchema,
  eyebrow: z.string(),
  canto: z.string(),
  titulo: z.string(),
  valor: z.number(),
  prefixo: z.string(),
  sufixo: z.string(),
  unidade: z.string(),
});
type Props = z.infer<typeof contadorSchema>;
const ease = { easing: Easing.bezier(...SUAVE), extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const Contador: React.FC<Props> = ({ pilar, eyebrow, canto, titulo, valor, prefixo, sufixo, unidade }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { acento, soft, nome } = pilares[pilar];
  const p = interpolate(frame, [0.4 * fps, 2.2 * fps], [0, 1], ease);
  const aparece = (a: number) => ({
    opacity: interpolate(frame, [a, a + 14], [0, 1], ease),
    translate: `0px ${interpolate(frame, [a, a + 14], [24, 0], ease)}px`,
  });

  return (
    <AbsoluteFill>
      <FundoNoite semente="contador" />
      <div style={{ position: "absolute", left: 290, top: 900, width: 500, height: 140, borderRadius: 999, backgroundColor: acento, filter: "blur(90px)", opacity: 0.35 * 0.7 }} />
      <Canto texto={canto || nome} />
      <AbsoluteFill style={{ justifyContent: "center", padding: `0 ${ds.space[4]}px` }}>
        <div style={{ ...tipo.eyebrow, color: soft, ...aparece(0) }}>{eyebrow}</div>
        <div style={{ ...tipo.hookLg, color: ds.ink, marginTop: ds.space[1], ...aparece(4) }}>{titulo}</div>
        <div style={{ ...tipo.statXl, fontSize: 240, color: acento, marginTop: ds.space[3], fontVariantNumeric: "tabular-nums" }}>
          {prefixo}
          {Math.round(valor * p).toLocaleString("pt-BR")}
          {sufixo}
        </div>
        <div style={{ ...tipo.bodySm, fontSize: 34, color: ds.inkMuted, marginTop: ds.space[1], ...aparece(1.6 * fps) }}>{unidade}</div>
      </AbsoluteFill>
      <Assinatura secao={nome} />
    </AbsoluteFill>
  );
};

export const contadorPadrao: Props = {
  pilar: PILAR_PADRAO,
  eyebrow: pilares[PILAR_PADRAO].nome,
  canto: "",
  titulo: "Em uma semana",
  valor: 200,
  prefixo: "+",
  sufixo: "",
  unidade: "o que este número conta",
};
