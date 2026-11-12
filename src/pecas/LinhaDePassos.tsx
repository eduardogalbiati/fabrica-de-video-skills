import { interpolate, useCurrentFrame } from "remotion";
import { ds, tipo } from "../animacoes/tema";
import { clamp, ease } from "./util";

// Linha de passos: um passo a passo que desce numa linha vertical, um passo de cada vez.
// Serve para "primeiro faz X, depois Y", um fluxo de trabalho, as etapas de um processo.
//   passos[i].texto    o que aparece (curto: uma linha de preferência)
//   passos[i].em       frame em que o passo entra, contado do início da cena
//   passos[i].pergunta true = momento de espera: o ponto vira um "?" na cor do acento e o texto vai entre aspas,
//                      no acento (quando alguém para e pergunta, ou espera um ok)
//   passos[i].detalhe  linha pequena em mono, embaixo do texto (opcional)
//   visiveis           mostra no máximo N passos; quando entra o seguinte, a linha rola para cima e o primeiro sai
//   focoNoAtual        os passos anteriores esmaecem quando o seguinte entra
// Posição: `left` e `top` em px do quadro; `largura` é a largura total (ponto + texto). Em tela cheia, abaixo de
// y 900 o texto não pode passar de x 930 (coluna de botões): ajuste `largura` se a linha descer até lá.
export type Passo = { texto: string; em: number; pergunta?: boolean; detalhe?: string };

export const LinhaDePassos: React.FC<{
  passos: Passo[];
  acento: string;
  top: number;
  left?: number;
  largura?: number;
  espaco?: number;
  tamanho?: number;
  visiveis?: number;
  focoNoAtual?: boolean;
}> = ({ passos, acento, top, left = ds.space[4], largura = 1080 - 2 * ds.space[4], espaco = 150, tamanho = 52, visiveis = passos.length, focoNoAtual = true }) => {
  const frame = useCurrentFrame();
  const ponto = Math.round(tamanho * 0.62);
  const alturaLinha = Math.round(tamanho * 1.1);
  const recuo = Math.round(ponto * 1.3) + 28;
  const centroX = Math.round(ponto * 0.65); // centro do ponto, a partir de `left`
  // quanto a coluna já rolou: um `espaco` por passo que passou do limite de visíveis
  const rolagem = passos.reduce((soma, p, i) => (i < visiveis ? soma : soma + interpolate(frame, [p.em, p.em + 14], [0, 1], ease) * espaco), 0);
  const yDe = (i: number) => i * espaco - rolagem;
  // visibilidade de um passo: entrada, saída por cima e foco no atual
  const opacidade = (i: number) => {
    const p = passos[i];
    const entra = interpolate(frame, [p.em, p.em + 12], [0, 1], ease);
    const saiPorCima = interpolate(yDe(i), [-espaco * 0.55, 0], [0, 1], clamp);
    const proximo = passos[i + 1];
    const foco = focoNoAtual && proximo ? interpolate(frame, [proximo.em, proximo.em + 10], [1, 0.42], ease) : 1;
    return entra * saiPorCima * foco;
  };
  const centroY = (i: number) => yDe(i) + alturaLinha / 2;
  return (
    <div style={{ position: "absolute", left, top, width: largura, height: 0 }}>
      {/* trechos da linha: do ponto anterior até o ponto deste passo, crescendo quando o passo entra */}
      {passos.map((p, i) => {
        if (i === 0) return null;
        const cresce = interpolate(frame, [p.em - 2, p.em + 10], [0, 1], ease);
        const de = centroY(i - 1) + ponto * 0.7;
        const ate = centroY(i) - ponto * 0.7;
        const saiPorCima = interpolate(yDe(i - 1), [-espaco * 0.55, 0], [0, 1], clamp);
        return (
          <div
            key={`l${i}`}
            style={{
              position: "absolute",
              left: centroX - 1.5,
              top: de,
              width: 3,
              height: Math.max(0, (ate - de) * cresce),
              borderRadius: 2,
              backgroundColor: ds.inkMuted,
              opacity: 0.45 * saiPorCima,
            }}
          />
        );
      })}
      {passos.map((p, i) => {
        if (frame < p.em - 1) return null;
        const op = opacidade(i);
        const sobe = interpolate(frame, [p.em, p.em + 12], [18, 0], ease);
        const d = p.pergunta ? Math.round(ponto * 1.3) : ponto;
        return (
          <div key={i} style={{ position: "absolute", left: 0, top: yDe(i), width: largura, opacity: op, translate: `0px ${sobe}px` }}>
            <div
              style={{
                position: "absolute",
                left: centroX - d / 2,
                top: alturaLinha / 2 - d / 2,
                width: d,
                height: d,
                borderRadius: 999,
                boxSizing: "border-box",
                border: p.pergunta ? `4px solid ${acento}` : `3px solid ${ds.inkMuted}`,
                backgroundColor: p.pergunta ? ds.bg000 : ds.ink,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...tipo.chapter,
                fontSize: Math.round(d * 0.58),
                fontWeight: 700,
                color: acento,
              }}
            >
              {p.pergunta ? "?" : null}
            </div>
            <div style={{ marginLeft: recuo, width: largura - recuo }}>
              <div style={{ ...tipo.titleMd, fontSize: tamanho, lineHeight: 1.1, color: p.pergunta ? acento : ds.ink, textWrap: "balance" }}>
                {p.pergunta ? `“${p.texto}”` : p.texto}
              </div>
              {p.detalhe ? <div style={{ ...tipo.chapter, fontSize: Math.round(tamanho * 0.46), color: ds.inkMuted, marginTop: 10 }}>{p.detalhe}</div> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};
