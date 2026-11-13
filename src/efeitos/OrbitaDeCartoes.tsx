import { Img, interpolate, staticFile } from "remotion";
import { useCurrentFrame, useVideoConfig } from "../relogio";
import { cartao, comAlfa } from "../animacoes/estilo";
import { ds, tipo } from "../animacoes/tema";
import { presenca } from "./Gravacao";

// Órbita de cartões: cartões (miniaturas de vídeo, prints ou palavras) girando em volta da cabeça, em 3D.
// Bom para "fiz tudo isso" ou para mostrar várias peças de uma vez.
//   cx, cy:   centro da órbita;  rx, ry: raios da elipse (ry pequeno = vista de leve por cima)
//   periodo:  segundos para uma volta;  camada: "todas", ou "frente"/"atras" para usar com o recorte da pessoa
//             (sem o recorte, os cartões de trás passam por cima do rosto: ficam apagados, ver `atrasVisivel`)
//   proporcao: altura ÷ largura do cartão (1,6 = miniatura em pé; 0,5 = etiqueta deitada, para palavras compridas)
//   tamanhoTexto: tamanho da palavra (padrão: 21% da largura)
export type CartaoOrbita = { imagem?: string; texto?: string };

export const OrbitaDeCartoes: React.FC<{
  cartoes: CartaoOrbita[];
  acento: string;
  cx?: number;
  cy?: number;
  rx?: number;
  ry?: number;
  periodo?: number;
  largura?: number;
  inicio?: number;
  saiEm?: number;
  camada?: "todas" | "frente" | "atras";
  atrasVisivel?: number;
  proporcao?: number;
  tamanhoTexto?: number;
}> = ({ cartoes, acento, cx = 540, cy = 780, rx = 330, ry = 90, periodo = 7, largura = 190, inicio = 0, saiEm, camada = "todas", atrasVisivel = 0.3, proporcao = 1.6, tamanhoTexto }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const altura = largura * proporcao;
  const v = presenca(frame, inicio, saiEm, 14);
  const abre = interpolate(v, [0, 1], [0.4, 1]);
  const giro = ((frame - inicio) / fps / periodo) * Math.PI * 2;
  const itens = cartoes
    .map((c, i) => {
      const t = giro + (i / cartoes.length) * Math.PI * 2;
      const prof = Math.cos(t); // 1 = na frente, -1 = atrás
      return { c, i, x: cx + Math.sin(t) * rx * abre, y: cy + prof * ry * abre, prof, angulo: Math.sin(t) * 38 };
    })
    .filter((o) => (camada === "frente" ? o.prof >= 0 : camada === "atras" ? o.prof < 0 : true))
    .sort((a, b) => a.prof - b.prof);
  return (
    <>
      {itens.map(({ c, i, x, y, prof, angulo }) => {
        const escala = interpolate(prof, [-1, 1], [0.72, 1.04]);
        const opac = camada === "atras" ? 1 : interpolate(prof, [-1, -0.15, 0.15, 1], [atrasVisivel, atrasVisivel, 1, 1]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - largura / 2,
              top: y - altura / 2,
              width: largura,
              height: altura,
              borderRadius: ds.radius.md,
              overflow: "hidden",
              backgroundColor: ds.bg100,
              border: `2px solid ${comAlfa(ds.ink, 0.18)}`,
              opacity: v * opac,
              transform: `perspective(1200px) rotateY(${angulo.toFixed(2)}deg) scale(${escala.toFixed(3)})`,
              ...cartao(acento),
            }}
          >
            {c.imagem ? <Img src={staticFile(c.imagem)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
            {!c.imagem ? <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: altura * 0.42, backgroundColor: comAlfa(acento, i % 2 ? 0.28 : 0.6) }} /> : null}
            {c.texto ? (
              <div style={{ position: "absolute", left: 14, right: 14, bottom: 18, ...tipo.hookLg, fontSize: tamanhoTexto ?? Math.round(largura * 0.21), lineHeight: 1.02, color: ds.ink }}>
                {c.texto}
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
};
