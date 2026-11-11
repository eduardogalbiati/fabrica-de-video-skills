import { Easing, interpolate } from "remotion";
import { brilhoTitulo, destaqueEstilo, estilo } from "../animacoes/estilo";
import { ds, SUAVE, tipo } from "../animacoes/tema";

// A curva e o jeito de entrar vêm do ESTILO ativo (animacoes/estilo.ts); no mini-action: fade + subida curta.
export const ease = { easing: Easing.bezier(...SUAVE), extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const ENTRADA = estilo.movimento.entrada;
const FATOR_DURACAO = ENTRADA.duracao / 14; // 14 quadros e 24 px são a referência do mini-action
const FATOR_SUBIDA = ENTRADA.subida / 24;

// Entrada a partir do frame `t`: fade + subida curta. O estilo pode alongar, trocar a subida por
// aproximação (escala) e desfocar no começo; `dur` e `dist` continuam valendo, proporcionais ao estilo.
export const aparece = (frame: number, t: number, dur = 14, dist = 24): React.CSSProperties => {
  const d = dur * FATOR_DURACAO;
  const s = dist * FATOR_SUBIDA;
  const r: React.CSSProperties = {
    opacity: interpolate(frame, [t, t + d], [0, 1], ease),
    translate: `0px ${interpolate(frame, [t, t + d], [s, 0], ease)}px`,
  };
  if (ENTRADA.escala !== undefined && ENTRADA.escala !== 1) r.scale = interpolate(frame, [t, t + d], [ENTRADA.escala, 1], ease);
  if (ENTRADA.desfoque) {
    const b = interpolate(frame, [t, t + d], [ENTRADA.desfoque, 0], ease);
    if (b > 0.01) r.filter = `blur(${b.toFixed(2)}px)`;
  }
  return r;
};

// "*palavra*" → palavra na cor do acento
export const Destaque: React.FC<{ texto: string; acento: string }> = ({ texto, acento }) => (
  <>
    {texto.split(/(\*[^*]+\*)/).map((t, i) =>
      t.startsWith("*") ? (
        <span key={i} style={destaqueEstilo(acento)}>
          {t.slice(1, -1)}
        </span>
      ) : (
        t
      ),
    )}
  </>
);

// Halo difuso (o único efeito do DS)
export const Halo: React.FC<{ x: number; y: number; w: number; h: number; cor: string; intensidade?: number }> = ({
  x,
  y,
  w,
  h,
  cor,
  intensidade = 0.35,
}) => (
  <div
    style={{
      position: "absolute",
      left: x - w / 2,
      top: y - h / 2,
      width: w,
      height: h,
      borderRadius: 999,
      backgroundColor: cor,
      filter: "blur(90px)",
      opacity: estilo.halo === undefined || estilo.halo === 1 ? intensidade : Math.min(1, intensidade * estilo.halo),
    }}
  />
);

// Título da cena (fonte de títulos, peso 800), centralizado na largura útil
export const TituloCena: React.FC<{
  texto: string;
  acento: string;
  top: number;
  frame: number;
  t?: number;
  tamanho?: number;
  centro?: boolean;
}> = ({ texto, acento, top, frame, t = 0, tamanho = 64, centro = false }) => (
  <div
    style={{
      position: "absolute",
      left: ds.space[4],
      right: ds.space[4],
      top,
      ...tipo.hookLg,
      fontSize: tamanho,
      lineHeight: 1.02,
      color: ds.ink,
      textAlign: centro ? "center" : "left",
      ...aparece(frame, t),
      ...brilhoTitulo(acento),
    }}
  >
    <Destaque texto={texto} acento={acento} />
  </div>
);

// Rótulo pequeno em mono (ex.: "cirurgiã", "travada")
export const RotuloMono: React.FC<{ texto: string; x: number; y: number; cor?: string; style?: React.CSSProperties }> = ({
  texto,
  x,
  y,
  cor = ds.inkMuted,
  style,
}) => (
  <div style={{ position: "absolute", left: x, top: y, translate: "-50% 0px", ...tipo.chapter, fontSize: 24, color: cor, whiteSpace: "nowrap", ...style }}>
    {texto}
  </div>
);
