import { AbsoluteFill, interpolate, random } from "remotion";
import { useCurrentFrame } from "../relogio";
import { ds, fonteDisplay } from "../animacoes/tema";
import { ease } from "../pecas/util";

// Texto atrás: uma palavra gigante passa ATRÁS da cabeça e outra fica na frente do corpo. As letras chegam
// espalhadas, vindas de perto e desfocadas, e assentam (profundidade). Bom para o título do vídeo.
// PRECISA DO RECORTE: `pessoa` = <PessoaRecortada>, por cima da `gravacao`.
//   atras: a palavra de trás (curta, em maiúsculas fica melhor);  frente: a de baixo, na cor do acento (opcional)
//   topAtras / topFrente: alturas;  tamanho: da palavra de trás (a da frente sai com 45% dele)
//   saiEm: quadro em que as palavras somem (opcional; sem ele, ficam até o fim da cena)
const Palavra: React.FC<{ texto: string; cor: string; top: number; tamanho: number; em: number; semente: string; saiEm?: number }> = ({ texto, cor, top, tamanho, em, semente, saiEm }) => {
  const frame = useCurrentFrame();
  const some = saiEm === undefined ? 1 : interpolate(frame, [saiEm, saiEm + 8], [1, 0], ease);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top, opacity: some, display: "flex", justifyContent: "center", fontFamily: fonteDisplay, fontWeight: 800, fontSize: tamanho, lineHeight: 0.9, letterSpacing: "-0.03em", color: cor, whiteSpace: "nowrap" }}>
      {texto.split("").map((l, i) => {
        const t = em + i * 2 + Math.floor(random(`${semente}-${i}`) * 6);
        const v = interpolate(frame, [t, t + 14], [0, 1], ease);
        const dx = (random(`${semente}-x-${i}`) - 0.5) * 500;
        const dy = (random(`${semente}-y-${i}`) - 0.5) * 400;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: v,
              translate: `${(dx * (1 - v)).toFixed(1)}px ${(dy * (1 - v)).toFixed(1)}px`,
              scale: interpolate(v, [0, 1], [2.2, 1]),
              filter: v < 0.98 ? `blur(${((1 - v) * 14).toFixed(2)}px)` : undefined,
            }}
          >
            {l === " " ? " " : l}
          </span>
        );
      })}
    </div>
  );
};

export const TextoAtras: React.FC<{
  gravacao: React.ReactNode;
  pessoa: React.ReactNode;
  acento: string;
  atras: string;
  frente?: string;
  em: number;
  topAtras?: number;
  topFrente?: number;
  tamanho?: number;
  saiEm?: number;
}> = ({ gravacao, pessoa, acento, atras, frente, em, topAtras = 420, topFrente = 1180, tamanho = 250, saiEm }) => (
  <AbsoluteFill style={{ overflow: "hidden" }}>
    <AbsoluteFill>{gravacao}</AbsoluteFill>
    <Palavra texto={atras} cor={ds.ink} top={topAtras} tamanho={tamanho} em={em} semente="atras" saiEm={saiEm} />
    <AbsoluteFill>{pessoa}</AbsoluteFill>
    {frente ? <Palavra texto={frente} cor={acento} top={topFrente} tamanho={Math.round(tamanho * 0.45)} em={em + 10} semente="frente" saiEm={saiEm} /> : null}
  </AbsoluteFill>
);
