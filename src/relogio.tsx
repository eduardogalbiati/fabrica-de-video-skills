import type React from "react";
import { Sequence as SequenceDoRemotion, useCurrentFrame as useQuadroReal, useVideoConfig as useConfigReal } from "remotion";

// RELÓGIO DE AUTORIA. Todas as animações do estúdio são escritas contando 30 QUADROS POR SEGUNDO
// ("entra no quadro 12", "dura 14 quadros"). O vídeo, porém, sai nos quadros por segundo da GRAVAÇÃO
// (a qualidade que entra é a que sai): gravou em 60, sai em 60.
// Este arquivo faz a ponte. As peças, os efeitos e os vídeos importam DAQUI, e não do "remotion":
//   useCurrentFrame()  o quadro em quadros de autoria (a 60 por segundo ele anda de meio em meio: 0; 0,5; 1...)
//   useVideoConfig()   igual ao do Remotion, mas com fps 30 e a duração em quadros de autoria
//   <Sequence>         recebe `from` e `durationInFrames` em quadros de autoria
// Com isso um mesmo número vale o mesmo TEMPO em qualquer render, e a 60 por segundo o movimento fica mais liso.
// Num render a 30 por segundo este arquivo não muda nada.
// O relógio do Remotion fica intacto, e é ele que toca <Video> e <Audio>. Por isso, o que vai para dentro de uma
// etiqueta de mídia em quadros (trimBefore, trimAfter) usa os quadros por segundo de verdade: useFpsReal().
export const FPS_DE_AUTORIA = 30;

// Os quadros por segundo de verdade deste render (30, ou os da gravação).
export const useFpsReal = (): number => useConfigReal().fps;

export const useCurrentFrame = (): number => {
  const quadro = useQuadroReal();
  const { fps } = useConfigReal();
  return fps === FPS_DE_AUTORIA ? quadro : (quadro * FPS_DE_AUTORIA) / fps;
};

export const useVideoConfig = (): ReturnType<typeof useConfigReal> => {
  const config = useConfigReal();
  return config.fps === FPS_DE_AUTORIA ? config : { ...config, fps: FPS_DE_AUTORIA, durationInFrames: (config.durationInFrames * FPS_DE_AUTORIA) / config.fps };
};

type PropsDaSequence = React.ComponentProps<typeof SequenceDoRemotion>;

export const Sequence: React.FC<PropsDaSequence> = (props) => {
  const { fps } = useConfigReal();
  if (fps === FPS_DE_AUTORIA) return <SequenceDoRemotion {...props} />;
  const k = fps / FPS_DE_AUTORIA;
  const from = props.from === undefined ? undefined : Math.round(props.from * k);
  const duracao = props.durationInFrames;
  const durationInFrames = duracao === undefined || !Number.isFinite(duracao) ? duracao : Math.max(1, Math.round(duracao * k));
  return <SequenceDoRemotion {...({ ...props, from, durationInFrames } as PropsDaSequence)} />;
};
