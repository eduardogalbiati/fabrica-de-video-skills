import { Composition, Folder, Still } from "remotion";
import { Capa, capaPadrao, capaSchema } from "./Capa";
import { VERTICAL } from "./formato";
import { demoFormatoPadrao, demoFormatoSchema, DemoRostoComJanela, DemoTelaComRosto, DemoTutorialMudo } from "./formatos/Demos";
import { duracaoMostruario, Mostruario, mostruarioPadrao, mostruarioSchema } from "./Mostruario";
import { Encerramento, encerramentoPadrao, encerramentoSchema } from "./animacoes/Encerramento";
import { Contador, contadorPadrao, contadorSchema } from "./animacoes/Contador";
import { duracaoListaDicas, ListaDicas, listaDicasPadrao, listaDicasSchema } from "./animacoes/ListaDicas";
import { TextoImpacto, textoImpactoPadrao, textoImpactoSchema } from "./animacoes/TextoImpacto";
import { VideosDaCasa } from "./videos";
import { duracaoVideoLegendado, VideoLegendado, videoLegendadoPadrao, videoLegendadoSchema } from "./videos/VideoLegendado";

// O MOTOR: modelos prontos, biblioteca de peças, formatos e capa. Nada aqui é de uma pessoa ou de um vídeo.
// Os vídeos de quem usa o estúdio são registrados em src/videos/index.tsx.
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <VideosDaCasa />
      <Folder name="Modelos">
        {/* Vídeo de rosto + legenda queimada; as props vêm de legendas/<nome>.legenda.json (npm run paginar) */}
        <Composition
          id="VideoLegendado"
          component={VideoLegendado}
          schema={videoLegendadoSchema}
          defaultProps={videoLegendadoPadrao}
          calculateMetadata={({ props }) => ({ durationInFrames: duracaoVideoLegendado(props, VERTICAL.fps) })}
          durationInFrames={6 * VERTICAL.fps}
          {...VERTICAL}
        />
        <Composition
          id="TextoImpacto"
          component={TextoImpacto}
          schema={textoImpactoSchema}
          defaultProps={textoImpactoPadrao}
          calculateMetadata={({ props }) => ({
            durationInFrames: Math.round(props.frases.length * props.segundosPorFrase * VERTICAL.fps),
          })}
          durationInFrames={150}
          {...VERTICAL}
        />
        <Composition
          id="ListaDicas"
          component={ListaDicas}
          schema={listaDicasSchema}
          defaultProps={listaDicasPadrao}
          calculateMetadata={({ props }) => ({ durationInFrames: duracaoListaDicas(props, VERTICAL.fps) })}
          durationInFrames={180}
          {...VERTICAL}
        />
        <Composition id="Contador" component={Contador} schema={contadorSchema} defaultProps={contadorPadrao} durationInFrames={4 * VERTICAL.fps} {...VERTICAL} />
        <Composition id="Encerramento" component={Encerramento} schema={encerramentoSchema} defaultProps={encerramentoPadrao} durationInFrames={2 * VERTICAL.fps} {...VERTICAL} />
      </Folder>
      <Folder name="Biblioteca">
        <Composition id="Mostruario" component={Mostruario} schema={mostruarioSchema} defaultProps={mostruarioPadrao} durationInFrames={duracaoMostruario(VERTICAL.fps)} {...VERTICAL} />
        <Still id="Capa" component={Capa} schema={capaSchema} defaultProps={capaPadrao} width={VERTICAL.width} height={VERTICAL.height} />
      </Folder>
      <Folder name="Formatos">
        <Composition id="DemoRostoComJanela" component={DemoRostoComJanela} schema={demoFormatoSchema} defaultProps={demoFormatoPadrao} durationInFrames={8 * VERTICAL.fps} {...VERTICAL} />
        <Composition id="DemoTelaComRosto" component={DemoTelaComRosto} schema={demoFormatoSchema} defaultProps={demoFormatoPadrao} durationInFrames={6 * VERTICAL.fps} {...VERTICAL} />
        <Composition id="DemoTutorialMudo" component={DemoTutorialMudo} schema={demoFormatoSchema} defaultProps={demoFormatoPadrao} durationInFrames={9 * VERTICAL.fps} {...VERTICAL} />
      </Folder>
    </>
  );
};
