import { interpolate } from "remotion";
import { useCurrentFrame } from "../relogio";
import { comAlfa } from "../animacoes/estilo";
import { ds, fonteDisplay, tipo } from "../animacoes/tema";
import { ease } from "../pecas/util";
import { balanco, presenca } from "./Gravacao";

// Mural de manchetes: recortes de papel claro, batendo um a um em volta do rosto, com a *palavra* marcada
// a marca-texto na cor do pilar. Bom para abrir o vídeo com a notícia ("saiu", "agora dá para...").
// Cada manchete: texto, rótulo pequeno opcional, centro (x, y), largura, giro (graus), quadro em que bate.
export type Manchete = { texto: string; rotulo?: string; x: number; y: number; largura: number; giro?: number; em: number; tamanho?: number };

const Marcado: React.FC<{ texto: string; acento: string }> = ({ texto, acento }) => (
  <>
    {texto.split(/(\*[^*]+\*)/).map((t, i) =>
      t.startsWith("*") ? (
        <span key={i} style={{ backgroundColor: comAlfa(acento, 0.9), padding: "0 8px", boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}>
          {t.slice(1, -1)}
        </span>
      ) : (
        t
      ),
    )}
  </>
);

export const MuralManchetes: React.FC<{ manchetes: Manchete[]; acento: string; saiEm?: number }> = ({ manchetes, acento, saiEm }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {manchetes.map((m, i) => {
        const p = presenca(frame, m.em, saiEm, 7);
        const bate = interpolate(frame, [m.em, m.em + 7], [1.22, 1], ease);
        const giro = (m.giro ?? 0) + interpolate(frame, [m.em, m.em + 9], [i % 2 ? -5 : 5, 0], ease);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: m.x - m.largura / 2,
              top: m.y,
              width: m.largura,
              translate: `0px calc(-50% + ${balanco(frame, i * 1.7, 3).toFixed(2)}px)`,
              rotate: `${giro}deg`,
              scale: bate,
              opacity: p,
              padding: "22px 28px 26px",
              backgroundColor: ds.ink,
              borderRadius: 6,
              boxShadow: "0 14px 34px rgba(0, 0, 0, 0.35)",
            }}
          >
            {m.rotulo ? (
              <div style={{ ...tipo.chapter, fontSize: 20, color: ds.bg200, opacity: 0.75, borderBottom: `2px solid ${comAlfa(ds.bg000, 0.18)}`, paddingBottom: 8, marginBottom: 12 }}>
                {m.rotulo}
              </div>
            ) : null}
            <div style={{ fontFamily: fonteDisplay, fontWeight: 800, fontSize: m.tamanho ?? 48, lineHeight: 1.08, letterSpacing: "-0.01em", color: ds.bg000 }}>
              <Marcado texto={m.texto} acento={acento} />
            </div>
          </div>
        );
      })}
    </>
  );
};
