import { Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { PILAR_PADRAO, pilares, pilarSchema, zonasReels } from "../animacoes/tema";
import { AntesDepois } from "../pecas/AntesDepois";
import { Barras } from "../pecas/Barras";
import { TelaSite } from "../pecas/TelaSite";
import { TituloCena } from "../pecas/util";
import { RostoComJanela } from "./RostoComJanela";
import { TelaComRosto } from "./TelaComRosto";
import { TutorialMudo } from "./TutorialMudo";

// Demonstrações dos formatos, com vídeo de mentira. Servem para conferir o layout e como modelo de uso.
export const demoFormatoSchema = z.object({ pilar: pilarSchema, mostrarGuia: z.boolean() });
type Props = z.infer<typeof demoFormatoSchema>;
export const demoFormatoPadrao: Props = { pilar: PILAR_PADRAO, mostrarGuia: false };

// Largura útil abaixo de y=900, onde a coluna de botões do Instagram ocupa a direita.
const LARGURA_SEM_BOTOES = zonasReels.botoes.x - zonasReels.lateral;

// Cada cena é um componente próprio, para o useCurrentFrame() contar a partir do início da cena.
const CenaTempo: React.FC<{ acento: string }> = ({ acento }) => {
  const frame = useCurrentFrame();
  return (
    <>
      <TituloCena texto="Antes e *depois*" acento={acento} top={220} frame={frame} tamanho={60} />
      <Barras itens={[{ rotulo: "Antes", valor: 12, texto: "12 min" }, { rotulo: "Depois", valor: 3, texto: "3 min", destaque: true }]} acento={acento} top={380} inicio={8} />
    </>
  );
};

// 8 s: rosto cheio → janela com animação em cima (2 s a 6 s) → rosto cheio
export const DemoRostoComJanela: React.FC<Props> = ({ pilar, mostrarGuia }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const { acento } = pilares[pilar];
  return (
    <RostoComJanela pilar={pilar} video="" janelas={[{ de: 2, ate: 6 }]} fimDoVideo={durationInFrames} mostrarGuia={mostrarGuia}>
      <Sequence from={2 * fps} durationInFrames={4 * fps} name="tempo">
        <CenaTempo acento={acento} />
      </Sequence>
    </RostoComJanela>
  );
};

// 6 s: site ocupando a parte de cima (até y 960, deixando a faixa da legenda livre), rosto no canto de baixo
export const DemoTelaComRosto: React.FC<Props> = ({ pilar, mostrarGuia }) => {
  const { durationInFrames } = useVideoConfig();
  const { acento } = pilares[pilar];
  return (
    <TelaComRosto pilar={pilar} video="exemplo" canto="inferior-esquerdo" fimDoVideo={durationInFrames} mostrarGuia={mostrarGuia}>
      <TelaSite imagem="exemplo/pagina.png" url="exemplo.com" acento={acento} top={190} altura={770} rolagem={{ de: 0, ate: 160, inicio: 30, duracao: 60 }} clique={{ x: 420, y: 380, em: 110 }} />
    </TelaComRosto>
  );
};

// 9 s: três passos e a volta ao começo (loop). Sem fala: a faixa da legenda pode ser usada pelo conteúdo.
export const DemoTutorialMudo: React.FC<Props> = ({ pilar, mostrarGuia }) => {
  const { fps } = useVideoConfig();
  const { acento } = pilares[pilar];
  return (
    <TutorialMudo
      pilar={pilar}
      mostrarGuia={mostrarGuia}
      passos={[
        { de: 0, ate: 2, texto: "Como fazer em *3 passos*" },
        { de: 2, ate: 4.5, numero: "1.", texto: "Abra a página" },
        { de: 4.5, ate: 7, numero: "2.", texto: "Veja o resultado" },
        { de: 7, ate: 9, texto: "Salve para fazer depois" },
      ]}
    >
      <Sequence durationInFrames={Math.round(4.5 * fps)} name="site">
        <TelaSite imagem="exemplo/pagina.png" url="exemplo.com" acento={acento} top={640} altura={920} largura={LARGURA_SEM_BOTOES} />
      </Sequence>
      <Sequence from={Math.round(4.5 * fps)} durationInFrames={Math.round(2.5 * fps)} name="nota">
        <div style={{ position: "absolute", left: -75, top: 560, width: 1080, height: 960 }}>
          <AntesDepois antes={0} depois={100} rotuloAntes="" rotuloDepois="nota" acento={acento} top={160} inicio={0} depoisEm={6} />
        </div>
      </Sequence>
      <Sequence from={7 * fps} name="site de novo">
        <TelaSite imagem="exemplo/pagina.png" url="exemplo.com" acento={acento} top={640} altura={920} largura={LARGURA_SEM_BOTOES} inicio={-30} />
      </Sequence>
    </TutorialMudo>
  );
};
