import { Video } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { z } from "zod";
import { GuiaZonaSegura } from "../animacoes/Base";
import { ds, PILAR_PADRAO, pilares, pilarSchema, tipo } from "../animacoes/tema";
import { blocoFluidoSchema, LegendaFluida } from "../pecas/LegendaFluida";
import { LegendaQueimada, paginaLegendaSchema, posicaoLegendaSchema } from "../pecas/LegendaQueimada";

/*
  Vídeo de rosto em tela cheia + legenda queimada no padrão da marca (sem animações).
  Não precisa de código por vídeo: as props vêm de um arquivo gerado pelo `npm run paginar`:
    npm run paginar -- legendas\<nome>.json "<vídeo>"
    npx remotion render VideoLegendado "<saída>.mp4" --props=legendas\<nome>.legenda.json
  Vídeo e legenda ficam na mesma <Sequence>, para andarem juntos se alguém mover ou aparar o trecho.
*/
export const videoLegendadoSchema = z.object({
  pilar: pilarSchema,
  video: z.string(),
  duracaoSeg: z.number().min(0.5),
  enquadramento: z.string(), // posição do vídeo no quadro (CSS object-position), ex.: "50% 50%"
  posicao: posicaoLegendaSchema,
  mostrarGuia: z.boolean(),
  // "frases": frases inteiras numa tarja (LegendaQueimada, o padrão); "fluida": 1 a 3 palavras por vez, cada uma no seu tempo (LegendaFluida)
  modelo: z.enum(["frases", "fluida"]),
  // só na fluida: y do meio da legenda (0 = segue a `posicao`). Rosto em tela cheia: logo abaixo do queixo.
  centroLegenda: z.number(),
  paginas: z.array(paginaLegendaSchema),
  blocos: z.array(blocoFluidoSchema),
});
type Props = z.infer<typeof videoLegendadoSchema>;

export const VideoLegendado: React.FC<Props> = ({ pilar, video, enquadramento, posicao, mostrarGuia, modelo, centroLegenda, paginas, blocos }) => {
  const { acento } = pilares[pilar];
  return (
    <AbsoluteFill style={{ backgroundColor: ds.bg000 }}>
      <Sequence name="Fala">
        {video ? (
          <Video src={staticFile(video)} objectFit="cover" style={{ width: "100%", height: "100%", objectPosition: enquadramento }} />
        ) : (
          <AbsoluteFill style={{ backgroundColor: ds.bg200, justifyContent: "center", alignItems: "center", ...tipo.bodyLg, color: ds.inkMuted }}>
            vídeo: rosto, tela cheia
          </AbsoluteFill>
        )}
        {modelo === "fluida" ? (
          <LegendaFluida blocos={blocos} acento={acento} posicao={posicao} centroY={centroLegenda || undefined} />
        ) : (
          <LegendaQueimada paginas={paginas} acento={acento} posicao={posicao} />
        )}
      </Sequence>
      {mostrarGuia ? <GuiaZonaSegura /> : null}
    </AbsoluteFill>
  );
};

export const videoLegendadoPadrao: Props = {
  pilar: PILAR_PADRAO,
  video: "",
  duracaoSeg: 6,
  enquadramento: "50% 50%",
  posicao: "terco-superior",
  mostrarGuia: false,
  modelo: "frases",
  centroLegenda: 0,
  paginas: [
    { de: 0.2, ate: 2.6, texto: "Esta é a *legenda* queimada no vídeo" },
    { de: 2.6, ate: 5.6, texto: "Frase inteira, com uma *palavra-chave* em destaque na cor do tema" },
  ],
  blocos: [],
};

export const duracaoVideoLegendado = (p: Props, fps: number) => Math.max(1, Math.round(p.duracaoSeg * fps));
