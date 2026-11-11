import { Composition, Folder } from "remotion";
import { VERTICAL } from "../formato";
import { duracaoExemplo, Exemplo, exemploPadrao, exemploSchema } from "./Exemplo";

// Os SEUS vídeos: é aqui, e só aqui, que cada vídeo novo é registrado.
// O motor (src/Root.tsx) não cita vídeo nenhum; ele só chama <VideosDaCasa />.
// Em sessões paralelas: releia este arquivo antes de editar e acrescente só a sua <Composition>.
export const VideosDaCasa: React.FC = () => (
  <Folder name="Videos">
    <Composition
      id="Exemplo"
      component={Exemplo}
      schema={exemploSchema}
      defaultProps={exemploPadrao}
      calculateMetadata={({ props }) => ({ durationInFrames: duracaoExemplo(props, VERTICAL.fps) })}
      durationInFrames={18 * VERTICAL.fps}
      {...VERTICAL}
    />
  </Folder>
);
