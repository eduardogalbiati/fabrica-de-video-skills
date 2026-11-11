import { AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { GuiaZonaSegura } from "../animacoes/Base";
import { Encerramento } from "../animacoes/Encerramento";
import { marca, PILAR_PADRAO, pilares, pilarSchema } from "../animacoes/tema";
import { AntesDepois } from "../pecas/AntesDepois";
import { Barras } from "../pecas/Barras";
import { Checklist } from "../pecas/Checklist";
import { TelaDividida } from "../pecas/TelaDividida";
import { clamp, Halo, TituloCena } from "../pecas/util";
import temposPadrao from "./exemplo.tempos.json";

/*
  "Exemplo": o vídeo de referência do estúdio, com assunto fictício (organizar a semana em 3 passos).
  Copie este arquivo para começar um vídeo novo.
    roteiro:    roteiros/exemplo.md
    storyboard: roteiros/exemplo-animacoes.md
    âncoras:    roteiros/exemplo.ancoras.json  (a frase que abre cada cena)
  Os tempos de cada cena vêm de exemplo.tempos.json. Num vídeo de verdade eles saem da fala:
    npm run legendar -- "<gravação>"
    npm run batidas -- legendas/<gravação>.json roteiros/<slug>.ancoras.json src/videos/<slug>.tempos.json
  Aqui não há gravação: o prop `video` vazio mostra um retângulo no lugar do rosto.
*/
const temposSchema = z.object({
  gancho: z.number(),
  passos: z.number(),
  comparacao: z.number(),
  resultado: z.number(),
  pergunta: z.number(),
  duracaoFala: z.number(),
});

export const exemploSchema = z.object({
  pilar: pilarSchema,
  video: z.string(),
  enquadramento: z.string(),
  mostrarGuia: z.boolean(),
  nome: z.string(),
  cargo: z.string(),
  fraseEncerramento: z.string(),
  ctaEncerramento: z.string(),
  tempos: temposSchema,
});
type Props = z.infer<typeof exemploSchema>;
type Tempos = Props["tempos"];

const ENCERRAMENTO_SEG = 2;
const FADE = 6;

// Cena com fade de 6 quadros na entrada e na saída
const Cena: React.FC<{ duracao: number; children: React.ReactNode }> = ({ duracao, children }) => {
  const frame = useCurrentFrame();
  const op = Math.min(interpolate(frame, [0, FADE], [0, 1], clamp), interpolate(frame, [duracao - FADE, duracao], [1, 0], clamp));
  return <AbsoluteFill style={{ opacity: op }}>{children}</AbsoluteFill>;
};

// Cada cena é um componente próprio, para o useCurrentFrame() contar a partir do início da cena.
const CenaGancho: React.FC<{ acento: string }> = ({ acento }) => {
  const frame = useCurrentFrame();
  return (
    <>
      <Halo x={540} y={520} w={760} h={280} cor={acento} intensidade={0.3} />
      <TituloCena texto="Sua semana em *3 passos*" acento={acento} top={380} frame={frame} tamanho={96} centro />
    </>
  );
};

const CenaPassos: React.FC<{ acento: string }> = ({ acento }) => {
  const frame = useCurrentFrame();
  return (
    <>
      <TituloCena texto="O que entra na *lista*" acento={acento} top={230} frame={frame} tamanho={60} />
      <Checklist itens={["Escolher 3 prioridades", "Bloquear a agenda", "Revisar na sexta"]} marcaEm={[30, 55, 80]} acento={acento} top={380} inicio={6} tamanho={44} />
    </>
  );
};

const CenaComparacao: React.FC<{ acento: string }> = ({ acento }) => {
  const frame = useCurrentFrame();
  return (
    <>
      <TituloCena texto="Tarefas *concluídas*" acento={acento} top={230} frame={frame} tamanho={60} />
      <Barras itens={[{ rotulo: "Sem a lista", valor: 4, texto: "4" }, { rotulo: "Com a lista", valor: 9, texto: "9", destaque: true }]} acento={acento} top={390} inicio={8} />
    </>
  );
};

const CenaResultado: React.FC<{ acento: string }> = ({ acento }) => {
  const frame = useCurrentFrame();
  return (
    <>
      <TituloCena texto="Semana *cumprida*" acento={acento} top={230} frame={frame} tamanho={60} />
      <AntesDepois antes={44} depois={90} rotuloAntes="antes" rotuloDepois="depois" acento={acento} top={340} inicio={4} depoisEm={26} />
    </>
  );
};

const CenaPergunta: React.FC<{ acento: string }> = ({ acento }) => {
  const frame = useCurrentFrame();
  return (
    <>
      <Halo x={540} y={500} w={780} h={300} cor={acento} intensidade={0.3} />
      <TituloCena texto="Qual é a sua *prioridade* da semana?" acento={acento} top={340} frame={frame} tamanho={80} centro />
    </>
  );
};

export const Exemplo: React.FC<Props> = (props) => {
  const { fps } = useVideoConfig();
  const t = props.tempos;
  const { acento } = pilares[props.pilar];
  const f = (s: number) => Math.round(s * fps);
  const ordem: (keyof Tempos)[] = ["gancho", "passos", "comparacao", "resultado", "pergunta"];
  const fimDe = (k: keyof Tempos) => {
    const i = ordem.indexOf(k);
    return i + 1 < ordem.length ? t[ordem[i + 1]] : t.duracaoFala;
  };
  const cenas: Record<string, React.ReactNode> = {
    gancho: <CenaGancho acento={acento} />,
    passos: <CenaPassos acento={acento} />,
    comparacao: <CenaComparacao acento={acento} />,
    resultado: <CenaResultado acento={acento} />,
    pergunta: <CenaPergunta acento={acento} />,
  };
  return (
    <AbsoluteFill>
      <TelaDividida
        pilar={props.pilar}
        video={props.video}
        eyebrow=""
        canto=""
        nome={props.nome}
        cargo={props.cargo}
        fimDoVideo={f(t.duracaoFala)}
        enquadramento={props.enquadramento}
        mostrarGuia={props.mostrarGuia}
      >
        {ordem.map((k) => {
          const de = f(t[k]);
          const dur = Math.max(1, f(fimDe(k)) - de);
          return (
            <Sequence key={k} from={de} durationInFrames={dur} name={k}>
              <Cena duracao={dur}>{cenas[k]}</Cena>
            </Sequence>
          );
        })}
      </TelaDividida>
      <Sequence from={f(t.duracaoFala)} durationInFrames={f(ENCERRAMENTO_SEG)} name="Encerramento">
        <Encerramento pilar={props.pilar} frase={props.fraseEncerramento} cta={props.ctaEncerramento} />
        {props.mostrarGuia ? <GuiaZonaSegura /> : null}
      </Sequence>
    </AbsoluteFill>
  );
};

export const exemploPadrao: Props = {
  pilar: PILAR_PADRAO,
  video: "",
  enquadramento: "50% 50%",
  mostrarGuia: false,
  nome: marca.pessoa.nome,
  cargo: marca.pessoa.cargo,
  fraseEncerramento: marca.encerramento.frase,
  ctaEncerramento: marca.encerramento.cta,
  tempos: temposPadrao,
};

export const duracaoExemplo = (p: Props, fps: number) => Math.round((p.tempos.duracaoFala + ENCERRAMENTO_SEG) * fps);
