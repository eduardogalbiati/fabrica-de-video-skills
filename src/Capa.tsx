import { AbsoluteFill, Img, staticFile } from "remotion";
import { z } from "zod";
import { FundoNoite } from "./animacoes/Base";
import { ds, marca, PILAR_PADRAO, pilares, pilarSchema, tipo } from "./animacoes/tema";
import { Destaque, Halo } from "./pecas/util";

/*
  Capa de Reels (1080×1920, imagem parada): um quadro do vídeo ou uma foto de fundo, escurecido por igual,
  com rótulo e título grande no padrão da marca. O que precisa aparecer na miniatura do grid
  do Instagram fica entre y=420 e y=1500.
    npm run capa -- <slug> "<vídeo ou imagem>" [segundo]      → tira o fundo e cria roteiros\<slug>.capa.json
    npx remotion still Capa "<saída>.png" --props=roteiros\<slug>.capa.json
*/
export const capaSchema = z.object({
  pilar: pilarSchema,
  fundo: z.string(), // imagem em public/ ("" = fundo noite)
  enquadramento: z.string(), // posição da imagem (CSS object-position)
  escurecer: z.number().min(0).max(0.9),
  rotulo: z.string(), // linha pequena acima do título
  titulo: z.string(), // *palavra* = cor do pilar
  canto: z.string(), // "CAP. 04" ou vazio para o nome do pilar
  posicao: z.enum(["baixo", "cima"]),
  tamanho: z.number().min(60).max(180),
  mostrarGuia: z.boolean(),
});
type Props = z.infer<typeof capaSchema>;

const GRID = { topo: 420, base: 1500 }; // faixa que aparece na miniatura do grid

export const Capa: React.FC<Props> = ({ pilar, fundo, enquadramento, escurecer, rotulo, titulo, canto, posicao, tamanho, mostrarGuia }) => {
  const { acento, soft, nome } = pilares[pilar];
  const M = ds.space[4];
  const bloco: React.CSSProperties = posicao === "baixo" ? { bottom: 1920 - GRID.base + 110 } : { top: GRID.topo + 110 };
  return (
    <AbsoluteFill style={{ backgroundColor: ds.bg000 }}>
      {fundo ? (
        <>
          <Img src={staticFile(fundo)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: enquadramento }} />
          <AbsoluteFill style={{ backgroundColor: ds.bg000, opacity: escurecer }} />
        </>
      ) : (
        <FundoNoite semente="capa" />
      )}
      <Halo x={420} y={posicao === "baixo" ? GRID.base - 330 : GRID.topo + 330} w={760} h={300} cor={acento} intensidade={0.3} />
      <div style={{ position: "absolute", right: M, top: GRID.topo + 30, ...tipo.chapter, color: ds.ink }}>{canto || nome}</div>
      <div style={{ position: "absolute", left: M, right: M, ...bloco }}>
        {rotulo ? <div style={{ ...tipo.eyebrow, fontSize: 30, color: soft, marginBottom: 22 }}>{rotulo}</div> : null}
        <div style={{ ...tipo.hookXl, fontSize: tamanho, color: ds.ink }}>
          <Destaque texto={titulo} acento={acento} />
        </div>
      </div>
      <div style={{ position: "absolute", left: M, top: GRID.base - 70, ...tipo.bodySm, fontSize: 28, color: ds.ink }}>{marca.site} · {nome}</div>
      {mostrarGuia ? (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: GRID.topo, backgroundColor: "rgba(229, 72, 77, 0.3)" }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: GRID.base, bottom: 0, backgroundColor: "rgba(229, 72, 77, 0.3)" }} />
          <div style={{ position: "absolute", left: 24, top: GRID.topo - 44, ...tipo.chapter, fontSize: 24, color: "#fff" }}>FORA DA MINIATURA DO GRID</div>
        </>
      ) : null}
    </AbsoluteFill>
  );
};

export const capaPadrao: Props = {
  pilar: PILAR_PADRAO,
  fundo: "",
  enquadramento: "50% 30%",
  escurecer: 0.45,
  rotulo: "Rótulo opcional",
  titulo: "Título com a *palavra-chave*",
  canto: "",
  posicao: "baixo",
  tamanho: 124,
  mostrarGuia: false,
};
