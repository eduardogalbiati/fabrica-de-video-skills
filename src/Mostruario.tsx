import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { z } from "zod";
import { ds, PILAR_PADRAO, pilares, pilarSchema, tipo } from "./animacoes/tema";
import { AntesDepois } from "./pecas/AntesDepois";
import { Barras } from "./pecas/Barras";
import { Carimbo } from "./pecas/Carimbo";
import { ChatIA } from "./pecas/ChatIA";
import { Checklist } from "./pecas/Checklist";
import { ContadorBarra } from "./pecas/ContadorBarra";
import { Enquete } from "./pecas/Enquete";
import { GradeConexoes } from "./pecas/GradeConexoes";
import { GraficoLinha } from "./pecas/GraficoLinha";
import { LinhaVersoes } from "./pecas/LinhaVersoes";
import { LoopPensando } from "./pecas/LoopPensando";
import { Lupa } from "./pecas/Lupa";
import { Notificacao } from "./pecas/Notificacao";
import { OlhoRiscado } from "./pecas/OlhoRiscado";
import { Bisturi, nosDaRede, RedeNeural, type RedeProps } from "./pecas/RedeNeural";
import { TelaDividida } from "./pecas/TelaDividida";
import { JanelaAgente } from "./pecas/JanelaAgente";
import { LinhaDePassos } from "./pecas/LinhaDePassos";
import { OndaDeCorte } from "./pecas/OndaDeCorte";
import { TelaSite } from "./pecas/TelaSite";
import { Terminal } from "./pecas/Terminal";
import { TextoRiscado } from "./pecas/TextoRiscado";
import { TrocaPrints } from "./pecas/TrocaPrints";
import tempos from "./mostruario.tempos.json";

/*
  Mostruário: todas as peças de src/pecas, uma de cada vez (3 s cada), com o nome no canto.
  A ordem e os tempos vêm de mostruario.tempos.json. Peça nova: acrescente uma linha lá e um exemplo em `exemplos`.
  Para ver tudo numa imagem: npm run mostruario  → fabrica-de-videos-agentica\mostruario.jpg
*/
export const mostruarioSchema = z.object({ pilar: pilarSchema, mostrarGuia: z.boolean() });
type Props = z.infer<typeof mostruarioSchema>;

const cirurgia: RedeProps = { cx: 290, cy: 600, largura: 300, altura: 280, semente: "cirurgia" };
const paciente: RedeProps = { cx: 790, cy: 600, largura: 300, altura: 280, semente: "paciente" };
const sozinha: RedeProps = { cx: 540, cy: 590, largura: 320, altura: 260, semente: "paciente" };

const exemplos: Record<string, (acento: string) => React.ReactNode> = {
  ContadorBarra: (acento) => <ContadorBarra de={8} ate={48} legenda="nota no teste" acento={acento} top={300} inicio={6} />,
  TextoRiscado: (acento) => <TextoRiscado prefixo="Antes era" riscado="difícil" substituto="simples" acento={acento} top={290} riscaEm={18} trocaEm={36} />,
  "RedeNeural + Bisturi": (acento) => {
    const c = nosDaRede(cirurgia);
    const p = nosDaRede(paciente);
    return (
      <>
        <RedeNeural {...cirurgia} acento={acento} inicio={2} />
        <RedeNeural {...paciente} inicio={6} acesos={[{ indice: 5, em: 44, cor: acento }]} />
        <Bisturi de={c.nos[c.nos.length - 2]} para={p.nos[5]} inicio={26} cor={acento} curva={-140} />
      </>
    );
  },
  Lupa: (acento) => {
    const { nos } = nosDaRede(sozinha);
    return (
      <>
        <RedeNeural {...sozinha} inicio={-60} acesos={[{ indice: 7, em: 46, cor: acento }]} />
        <Lupa caminho={[nos[1], nos[4], nos[12], nos[9], nos[7]]} inicio={6} duracao={40} cor={acento} rotulo="achou" />
      </>
    );
  },
  GradeConexoes: (acento) => <GradeConexoes x={190} y={300} largura={700} acento={acento} acesos={[517]} acendeEm={26} inicio={4} />,
  LoopPensando: () => <LoopPensando cx={540} cy={570} raio={170} inicio={4} />,
  OlhoRiscado: () => <OlhoRiscado cx={540} cy={540} tamanho={280} inicio={0} />,
  LinhaVersoes: (acento) => <LinhaVersoes acento={acento} top={400} atrasos={[0, 0.5, 0.9, 1.2, 1.4]} />,
  TrocaPrints: (acento) => (
    <TrocaPrints imagens={["exemplo/pagina.png", "exemplo/grafico.png"]} segundosPorImagem={1.2} acento={acento} top={270} altura={470} chips={[{ texto: "passo 1", em: 20 }, { texto: "passo 2", em: 30 }]} />
  ),
  Notificacao: (acento) => <Notificacao app="Agenda" titulo="Reunião em 10 minutos" texto="Sala 2, com a equipe." acento={acento} top={300} inicio={4} />,
  Carimbo: (acento) => <Carimbo texto="APROVADO" cor={acento} x={540} y={540} inicio={10} tamanho={84} />,
  AntesDepois: (acento) => <AntesDepois antes={77} depois={100} rotuloAntes="antes" rotuloDepois="depois" acento={acento} top={300} inicio={4} depoisEm={28} />,
  Enquete: (acento) => (
    <Enquete pergunta="Qual você prefere?" opcoes={[{ texto: "Opção A", pct: 18 }, { texto: "Opção B", pct: 61 }, { texto: "Opção C", pct: 21 }]} vencedora={1} acento={acento} top={270} inicio={2} revelaEm={24} />
  ),
  Barras: (acento) => <Barras itens={[{ rotulo: "Antes", valor: 12, texto: "12 min" }, { rotulo: "Depois", valor: 3, texto: "3 min", destaque: true }]} acento={acento} top={330} inicio={4} />,
  GraficoLinha: (acento) => <GraficoLinha pontos={[2, 3, 3, 5, 9, 12, 15]} rotuloInicio="seg" rotuloFim="dom" valorFinal="15 mil" acento={acento} top={290} altura={340} inicio={4} />,
  Checklist: (acento) => <Checklist itens={["Roteiro", "Gravação", "Edição", "Publicação"]} marcaEm={[24, 34, 44]} acento={acento} top={290} inicio={2} />,
  ChatIA: (acento) => <ChatIA pedido="Resume este texto em 3 pontos" resposta={["1. A ideia central", "2. O exemplo que prova"]} acento={acento} top={280} inicio={2} />,
  Terminal: (acento) => (
    <Terminal linhas={[{ texto: "npm run cortar", em: 6, tipo: "comando" }, { texto: "25,7 s → 10,8 s (5 cortes)", em: 28, tipo: "saida" }, { texto: "pronto", em: 40, tipo: "ok" }]} acento={acento} top={290} altura={330} inicio={2} />
  ),
  TelaSite: (acento) => (
    <TelaSite imagem="exemplo/pagina.png" url="exemplo.com" acento={acento} top={260} altura={560} inicio={2} rolagem={{ de: 0, ate: 60, inicio: 10, duracao: 30 }} zoom={{ escala: 1.5, x: 0.25, y: 0.35, inicio: 44, duracao: 18 }} clique={{ x: 300, y: 250, em: 66 }} />
  ),
  LinhaDePassos: (acento) => (
    <LinhaDePassos
      acento={acento}
      top={270}
      espaco={140}
      tamanho={48}
      visiveis={3}
      passos={[
        { texto: "Grava no celular", em: 4 },
        { texto: "Corta as pausas", em: 18 },
        { texto: "Posso seguir?", pergunta: true, detalhe: "espera o ok", em: 32 },
        { texto: "Entrega o vídeo", em: 50 },
      ]}
    />
  ),
  JanelaAgente: (acento) => (
    <JanelaAgente
      titulo="claude · meu-projeto"
      acento={acento}
      top={250}
      altura={640}
      digitando={[{ texto: "limpa essa gravação", de: 0, ate: 8, letrasPorQuadro: 2.6 }]}
      linhas={[
        { tipo: "voce", texto: "limpa essa gravação", em: 8 },
        { tipo: "ferramenta", nome: "Bash", texto: "npm run cortar -- analisar gravacao.mp4", em: 18, fimEm: 40 },
        { tipo: "saida", texto: "25,7 s → 10,8 s (5 cortes)", em: 36 },
        { tipo: "pergunta", texto: "Aplico os cortes?", opcoes: ["Sim", "Não"], escolha: 0, escolhaEm: 66, em: 46 },
      ]}
      trabalhando={[{ de: 18, ate: 40 }]}
    />
  ),
  OndaDeCorte: (acento) => (
    <OndaDeCorte
      amostras={ONDA_DE_EXEMPLO}
      passo={0.1}
      fica={[
        { de: 2, ate: 9 },
        { de: 12, ate: 20 },
        { de: 24, ate: 28 },
      ]}
      rotulos={[{ em: 22, texto: "pausa · 4 s" }]}
      acento={acento}
      top={300}
      altura={360}
      juntaEm={30}
      inicio={2}
    />
  ),
};

// onda de exemplo (ilustração, não é gravação de ninguém): fala com pausas
const ONDA_DE_EXEMPLO = Array.from({ length: 300 }, (_, i) => {
  const s = i / 10;
  const falando = (s > 2 && s < 9) || (s > 12 && s < 20) || (s > 24 && s < 28);
  return falando ? 0.35 + 0.6 * Math.abs(Math.sin(i * 0.9) * Math.cos(i * 0.23)) : 0.04 + 0.04 * Math.abs(Math.sin(i));
});

export const Mostruario: React.FC<Props> = ({ pilar, mostrarGuia }) => {
  const { fps } = useVideoConfig();
  const { acento, soft } = pilares[pilar];
  const nomes = Object.keys(tempos).filter((k) => k !== "duracaoFala") as (keyof typeof tempos)[];
  return (
    <AbsoluteFill>
      <TelaDividida pilar={pilar} video="" eyebrow="" canto="" nome="" cargo="" fimDoVideo={Math.round(tempos.duracaoFala * fps)} mostrarGuia={mostrarGuia}>
        {nomes.map((nome, i) => {
          const de = Math.round(tempos[nome] * fps);
          const proximo = i + 1 < nomes.length ? tempos[nomes[i + 1]] : tempos.duracaoFala;
          return (
            <Sequence key={nome} from={de} durationInFrames={Math.max(1, Math.round(proximo * fps) - de)} name={nome}>
              <div style={{ position: "absolute", left: ds.space[4], top: 176, ...tipo.chapter, fontSize: 34, color: soft }}>{nome}</div>
              {exemplos[nome] ? exemplos[nome](acento) : <div style={{ position: "absolute", left: ds.space[4], top: 400, ...tipo.bodyLg, color: ds.inkMuted }}>sem exemplo</div>}
            </Sequence>
          );
        })}
      </TelaDividida>
    </AbsoluteFill>
  );
};

export const mostruarioPadrao: Props = { pilar: PILAR_PADRAO, mostrarGuia: false };
export const duracaoMostruario = (fps: number) => Math.round(tempos.duracaoFala * fps);
