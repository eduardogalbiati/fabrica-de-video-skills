import { Easing, interpolate } from "remotion";
import { ds, tipo } from "../animacoes/tema";

export const ease = { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Fade + subida curta a partir do frame `t`
export const aparece = (frame: number, t: number, dur = 14, dist = 24): React.CSSProperties => ({
  opacity: interpolate(frame, [t, t + dur], [0, 1], ease),
  translate: `0px ${interpolate(frame, [t, t + dur], [dist, 0], ease)}px`,
});

// "*palavra*" → palavra na cor do acento
export const Destaque: React.FC<{ texto: string; acento: string }> = ({ texto, acento }) => (
  <>
    {texto.split(/(\*[^*]+\*)/).map((t, i) =>
      t.startsWith("*") ? (
        <span key={i} style={{ color: acento }}>
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
      opacity: intensidade,
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
