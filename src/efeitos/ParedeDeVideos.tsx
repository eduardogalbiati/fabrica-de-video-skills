import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { comAlfa } from "../animacoes/estilo";
import { ds, tipo } from "../animacoes/tema";
import { ease } from "../pecas/util";

// Parede de vídeos: atrás da pessoa, uma grade de miniaturas verticais (prints, capas, palavras) que sobe
// devagar. As miniaturas acendem do centro para fora. Bom para "fiz 40 vídeos assim" ou para o fecho.
// PRECISA DO RECORTE: `pessoa` = <PessoaRecortada>.
//   itens: o que vai em cada miniatura (repete se faltar);  colunas: 3 a 5;  velocidade: px por segundo
export type ItemParede = { imagem?: string; texto?: string };

export const ParedeDeVideos: React.FC<{
  pessoa: React.ReactNode;
  acento: string;
  itens: ItemParede[];
  em: number;
  colunas?: number;
  velocidade?: number;
  escurecer?: number;
}> = ({ pessoa, acento, itens, em, colunas = 4, velocidade = 40, escurecer = 0.35 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const vao = 12;
  const largura = (1080 - vao * (colunas + 1)) / colunas;
  const altura = largura * 1.6;
  const linhas = Math.ceil(1920 / (altura + vao)) + 2;
  const sobe = ((Math.max(0, frame - em) / fps) * velocidade) % (altura + vao);
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: ds.bg000 }}>
      {Array.from({ length: linhas * colunas }, (_, k) => {
        const linha = Math.floor(k / colunas);
        const coluna = k % colunas;
        const item = itens[k % itens.length];
        const x = vao + coluna * (largura + vao);
        const y = vao + linha * (altura + vao) - sobe - (coluna % 2 ? altura * 0.35 : 0);
        const distancia = Math.hypot(x + largura / 2 - 540, y + altura / 2 - 860) / 1200;
        const v = interpolate(frame, [em + distancia * 18, em + distancia * 18 + 12], [0, 1], ease);
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: largura,
              height: altura,
              borderRadius: 16,
              overflow: "hidden",
              backgroundColor: k % 3 === 1 ? comAlfa(acento, 0.45) : ds.bg100,
              border: `2px solid ${ds.line}`,
              opacity: v,
              scale: interpolate(v, [0, 1], [0.85, 1]),
            }}
          >
            {item?.imagem ? <Img src={staticFile(item.imagem)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
            {item?.texto ? <div style={{ position: "absolute", left: 14, right: 14, bottom: 16, ...tipo.hookLg, fontSize: Math.round(largura * 0.16), color: ds.ink }}>{item.texto}</div> : null}
          </div>
        );
      })}
      <AbsoluteFill style={{ backgroundColor: comAlfa(ds.bg000, escurecer) }} />
      <AbsoluteFill>{pessoa}</AbsoluteFill>
    </AbsoluteFill>
  );
};
