import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { comAlfa, estilo, flutua } from "../animacoes/estilo";
import { ds } from "../animacoes/tema";
import { ease } from "../pecas/util";
import { balanco, presenca } from "./Gravacao";

// Celular flutuante: um celular entra pelo lado e fica ao lado da pessoa, rolando um print (página,
// post, app). O print vem de `npm run print-site -- <endereço> <slug> <nome> celular` ou de quem pediu o vídeo.
//   x, top:   centro horizontal e topo do celular;  largura: do aparelho (a altura segue a proporção)
//   rolagem:  desloca o print para cima, em px do print já na largura da tela
export const CelularFlutuante: React.FC<{
  imagem: string;
  acento: string;
  x: number;
  top: number;
  largura?: number;
  lado?: "esquerda" | "direita";
  giro?: number;
  inicio?: number;
  saiEm?: number;
  rolagem?: { de: number; ate: number; inicio: number; duracao: number };
}> = ({ imagem, acento, x, top, largura = 330, lado = "esquerda", giro = -6, inicio = 0, saiEm, rolagem }) => {
  const frame = useCurrentFrame();
  const altura = largura * 2.05;
  const borda = Math.round(largura * 0.035);
  const sinal = lado === "esquerda" ? -1 : 1;
  const chega = interpolate(frame, [inicio, inicio + 16], [0, 1], ease);
  const vai = saiEm === undefined ? 0 : interpolate(frame, [saiEm, saiEm + 12], [0, 1], ease);
  const desloca = sinal * (1 - chega) * 520 + sinal * vai * 520;
  const y = rolagem ? interpolate(frame, [rolagem.inicio, rolagem.inicio + rolagem.duracao], [rolagem.de, rolagem.ate], ease) : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: x - largura / 2,
        top,
        width: largura,
        height: altura,
        translate: `${desloca}px ${balanco(frame, 0.8, 6).toFixed(2)}px`,
        rotate: `${giro + sinal * (1 - chega) * 14}deg`,
        opacity: presenca(frame, inicio, saiEm, 8),
        ...flutua(frame, `celular-${imagem}`),
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: largura * 0.17,
          backgroundColor: ds.bg000,
          border: `2px solid ${comAlfa(ds.ink, 0.22)}`,
          boxShadow: `0 30px 70px rgba(0, 0, 0, 0.45), 0 0 0 ${borda}px ${ds.bg000} inset`,
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: borda, borderRadius: largura * 0.14, overflow: "hidden", backgroundColor: ds.ink }}>
          <Img src={staticFile(imagem)} style={{ position: "absolute", left: 0, top: 0, width: "100%", translate: `0px ${-y}px` }} />
        </div>
        <div style={{ position: "absolute", left: "50%", top: borda + largura * 0.035, width: largura * 0.3, height: largura * 0.085, translate: "-50% 0px", borderRadius: 999, backgroundColor: ds.bg000 }} />
      </div>
      {estilo.cartao?.brilho ? (
        <div style={{ position: "absolute", inset: 0, borderRadius: largura * 0.17, boxShadow: `0 0 ${Math.round(48 * estilo.cartao.brilho)}px ${comAlfa(acento, 0.45 * estilo.cartao.brilho)}` }} />
      ) : null}
    </div>
  );
};
