import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { z } from "zod";
import { GuiaZonaSegura } from "./animacoes/Base";
import { comAlfa } from "./animacoes/estilo";
import { ds, PILAR_PADRAO, pilares, pilarSchema, tipo } from "./animacoes/tema";
import { CelularFlutuante } from "./efeitos/CelularFlutuante";
import { ComentarioCTA } from "./efeitos/ComentarioCTA";
import { CorteMergulho } from "./efeitos/CorteMergulho";
import { EtiquetaColada } from "./efeitos/EtiquetaColada";
import { ContornoRabiscado } from "./efeitos/ContornoRabiscado";
import { FundoTrocado } from "./efeitos/FundoTrocado";
import { FILTRO_CRU, Gravacao, PessoaDeExemplo, PessoaRecortada } from "./efeitos/Gravacao";
import { InterfaceEmVolta } from "./efeitos/InterfaceEmVolta";
import { MuralManchetes } from "./efeitos/MuralManchetes";
import { OrbitaDeCartoes } from "./efeitos/OrbitaDeCartoes";
import { ParedeDeVideos } from "./efeitos/ParedeDeVideos";
import { RecortePapel } from "./efeitos/RecortePapel";
import { RecuoEditor } from "./efeitos/RecuoEditor";
import { SaindoDoQuadro } from "./efeitos/SaindoDoQuadro";
import { TextoAtras } from "./efeitos/TextoAtras";
import { VarreduraAntesDepois } from "./efeitos/VarreduraAntesDepois";
import { TunelDeFundo, Vertigem } from "./efeitos/Vertigem";
import { ZoomCamera } from "./efeitos/ZoomCamera";
import { FundoNoite } from "./animacoes/Base";
import { Halo } from "./pecas/util";
import tempos from "./mostruario-efeitos.tempos.json";

/*
  Mostruário dos EFEITOS SOBRE A GRAVAÇÃO (src/efeitos): um efeito de cada vez, 3 s cada, com o nome no topo.
  Sem `video`, usa a pessoa de exemplo (é assim que vai para o catálogo e para o modelo público).
  Com `video` (props), roda sobre uma gravação de verdade, contínua de uma cena para a outra:
    npx remotion render MostruarioEfeitos "<saída>.mp4" --props=<arquivo.json com { "video": "...", "inicioVideo": 0 }>
  Para ver tudo numa imagem: npm run mostruario -- efeitos
*/
// pessoa: o WebM com transparência da mesma gravação (npm run recortar). Sem ele, os efeitos da segunda parte
// (FundoTrocado em diante) não têm o que pôr na frente; com a pessoa de exemplo, usam a silhueta dela.
// duracaoVideo: duração da gravação, em segundos; se o mostruário passar dela, volta ao começo (0 = não volta)
export const mostruarioEfeitosSchema = z.object({ pilar: pilarSchema, mostrarGuia: z.boolean(), video: z.string(), inicioVideo: z.number(), pessoa: z.string(), duracaoVideo: z.number() });
type Props = z.infer<typeof mostruarioEfeitosSchema>;
export const mostruarioEfeitosPadrao: Props = { pilar: PILAR_PADRAO, mostrarGuia: false, video: "", inicioVideo: 0, pessoa: "", duracaoVideo: 0 };
export const duracaoMostruarioEfeitos = (fps: number) => Math.round(tempos.duracaoFala * fps);

// g = a gravação desta cena; p = a pessoa recortada da mesma gravação (só existe se vier o prop `pessoa`)
type Cena = { acento: string; corTexto: string; g: (deslocamento?: number, filtro?: string) => React.ReactNode; p?: (deslocamento?: number) => React.ReactNode };

const exemplos: Record<string, (c: Cena) => React.ReactNode> = {
  MuralManchetes: ({ acento, g }) => (
    <>
      {g()}
      <MuralManchetes
        acento={acento}
        manchetes={[
          { texto: "*Sem* editor de vídeo", x: 300, y: 330, largura: 360, giro: -5, em: 2, tamanho: 36 },
          { texto: "Pronto em *minutos*", x: 790, y: 430, largura: 320, giro: 4, em: 6, tamanho: 34 },
          { rotulo: "notícia · hoje", texto: "Seu reel, *editado* por IA", x: 540, y: 1270, largura: 760, giro: -2, em: 12 },
        ]}
      />
    </>
  ),
  CorteMergulho: ({ g }) => <CorteMergulho de={g()} para={g(1.5)} em={45} />,
  CelularFlutuante: ({ acento, g }) => (
    <>
      {g()}
      <CelularFlutuante imagem="exemplo/pagina.png" acento={acento} x={240} top={360} largura={280} inicio={2} rolagem={{ de: 0, ate: 140, inicio: 26, duracao: 40 }} />
    </>
  ),
  ZoomCamera: ({ acento, g }) => (
    <ZoomCamera acento={acento} de={8} escala={1.4} relogio={8}>
      {g()}
    </ZoomCamera>
  ),
  InterfaceEmVolta: ({ acento, g }) => (
    <>
      {g()}
      <InterfaceEmVolta
        acento={acento}
        paineis={[
          { tipo: "pedido", texto: "edita meu reel", digita: { de: 8, ate: 30 }, x: 96, y: 380, largura: 330, em: 2 },
          { tipo: "progresso", rotulo: "editando…", de: 22, ate: 80, ateValor: 94, x: 96, y: 580, largura: 330, em: 16 },
          { tipo: "previa", texto: "pronto", aoVivo: "ao vivo", x: 700, y: 330, largura: 230, em: 26 },
          { tipo: "linhaDoTempo", quadros: 6, agulha: { de: 36, ate: 90 }, x: 96, y: 1160, largura: 700, em: 32 },
        ]}
      />
    </>
  ),
  OrbitaDeCartoes: ({ acento, g, p }) => {
    const orbita = { acento, cartoes: [{ texto: "corte" }, { imagem: "exemplo/grafico.png" }, { texto: "legenda" }, { texto: "zoom" }, { imagem: "exemplo/pagina.png" }, { texto: "capa" }], cy: 860, ry: 220, largura: 220, proporcao: 0.42, tamanhoTexto: 40, periodo: 6 };
    // inclinada: na frente passa abaixo da boca, atrás passa atrás do alto da cabeça (nada cruza o rosto)
    // com a pessoa recortada, os cartões de trás passam ATRÁS da cabeça; sem ela, ficam apagados por cima
    return p ? (
      <>
        {g()}
        <OrbitaDeCartoes {...orbita} camada="atras" />
        {p()}
        <OrbitaDeCartoes {...orbita} camada="frente" />
      </>
    ) : (
      <>
        {g()}
        <OrbitaDeCartoes {...orbita} />
      </>
    );
  },
  EtiquetaColada: ({ acento, corTexto, g }) => (
    <>
      {g()}
      <EtiquetaColada texto="etiqueta" numero="07" acento={acento} corTexto={corTexto} x={560} y={1330} em={10} />
    </>
  ),
  VarreduraAntesDepois: ({ acento, g }) => <VarreduraAntesDepois antes={g(0, FILTRO_CRU)} depois={g()} acento={acento} em={20} />,
  RecuoEditor: ({ acento, g }) => (
    <RecuoEditor
      acento={acento}
      em={10}
      titulo="fabrica · meu-reel"
      checklist={[
        { texto: "cortar pausas", marcaEm: 40 },
        { texto: "efeitos", marcaEm: 62 },
        { texto: "exportar" },
      ]}
      efeitos={["mural", "mergulho", "celular", "zoom", "interface", "órbita"]}
      ativo={3}
      clipes={[
        { rotulo: "abertura", de: 0, ate: 4 },
        { rotulo: "zoom", de: 4, ate: 7 },
        { rotulo: "interface", de: 7, ate: 12 },
        { rotulo: "cta", de: 12, ate: 15 },
      ]}
      total={15}
    >
      {g()}
    </RecuoEditor>
  ),
  ComentarioCTA: ({ acento, corTexto, g }) => (
    <>
      {g()}
      <ComentarioCTA palavra="QUERO" acento={acento} corTexto={corTexto} em={4} />
    </>
  ),
  // daqui em diante, os efeitos que precisam da pessoa recortada (p)
  FundoTrocado: ({ acento, g, p }) =>
    p ? (
      <FundoTrocado
        gravacao={g()}
        pessoa={p()}
        em={12}
        fundo={
          <>
            <FundoNoite semente="trocado" />
            <Halo x={540} y={760} w={820} h={820} cor={acento} intensidade={0.55} />
          </>
        }
      />
    ) : (
      <SemRecorte g={g} />
    ),
  Vertigem: ({ acento, p, g }) => (p ? <Vertigem fundo={<TunelDeFundo acento={acento} />} pessoa={p()} de={6} duracao={60} escalaAte={2.4} /> : <SemRecorte g={g} />),
  RecortePapel: ({ acento, p, g }) => (p ? <RecortePapel pessoa={p()} acento={acento} em={4} letras="NOVO" /> : <SemRecorte g={g} />),
  SaindoDoQuadro: ({ acento, g, p }) => (p ? <SaindoDoQuadro gravacao={g()} pessoa={p()} acento={acento} em={8} /> : <SemRecorte g={g} />),
  ContornoRabiscado: ({ acento, g, p }) =>
    p ? (
      <>
        {g()}
        <ContornoRabiscado
          pessoa={p()}
          acento={acento}
          em={6}
          rabiscos={[
            { tipo: "brilho", x: 250, y: 520, em: 14 },
            { tipo: "circulo", x: 850, y: 600, tamanho: 40, em: 18 },
            { tipo: "espiral", x: 210, y: 900, em: 22, cor: "tinta" },
            { tipo: "brilho", x: 880, y: 380, tamanho: 40, em: 26, cor: "tinta" },
          ]}
        />
      </>
    ) : (
      <SemRecorte g={g} />
    ),
  TextoAtras: ({ acento, g, p }) => (p ? <TextoAtras gravacao={g()} pessoa={p()} acento={acento} atras="FOCO" frente="no que importa" em={4} topAtras={470} /> : <SemRecorte g={g} />),
  ParedeDeVideos: ({ acento, p, g }) =>
    p ? (
      <ParedeDeVideos
        pessoa={p()}
        acento={acento}
        em={4}
        itens={[{ texto: "corte" }, { imagem: "exemplo/pagina.png" }, { texto: "zoom" }, { imagem: "exemplo/grafico.png" }, { texto: "capa" }, { texto: "legenda" }, { imagem: "exemplo/pagina.png" }]}
      />
    ) : (
      <SemRecorte g={g} />
    ),
};

// Gravação sem o recorte: os efeitos da segunda parte não têm como pôr a pessoa na frente
const SemRecorte: React.FC<{ g: Cena["g"] }> = ({ g }) => (
  <>
    {g()}
    <div style={{ position: "absolute", left: ds.space[4], right: ds.space[4], top: 1180, padding: "18px 24px", borderRadius: ds.radius.md, backgroundColor: comAlfa(ds.bg000, 0.8), ...tipo.bodySm, fontSize: 28, color: ds.ink }}>
      Este efeito precisa da pessoa recortada: passe o prop `pessoa` (npm run recortar).
    </div>
  </>
);

export const MostruarioEfeitos: React.FC<Props> = ({ pilar, mostrarGuia, video, inicioVideo, pessoa, duracaoVideo }) => {
  const { fps } = useVideoConfig();
  const { acento, soft, textoNoBotao } = pilares[pilar];
  const nomes = Object.keys(tempos).filter((k) => k !== "duracaoFala") as (keyof typeof tempos)[];
  return (
    <AbsoluteFill style={{ backgroundColor: ds.bg000 }}>
      {nomes.map((nome, i) => {
        const de = Math.round(tempos[nome] * fps);
        const proximo = i + 1 < nomes.length ? tempos[nomes[i + 1]] : tempos.duracaoFala;
        // segundo da gravação em que a cena começa (volta ao começo se a gravação acabar antes da cena)
        const duracaoCena = proximo - tempos[nome];
        const t0 = inicioVideo + tempos[nome];
        const inicioCena = duracaoVideo > duracaoCena + 2 && t0 + duracaoCena > duracaoVideo ? t0 % (duracaoVideo - duracaoCena - 1) : t0;
        const g = (deslocamento = 0, filtro?: string) => <Gravacao video={video} inicio={inicioCena + deslocamento} filtro={filtro} />;
        const p = !video
          ? () => <PessoaDeExemplo soPessoa />
          : pessoa
            ? (deslocamento = 0) => <PessoaRecortada pessoa={pessoa} inicio={inicioCena + deslocamento} />
            : undefined;
        return (
          <Sequence key={nome} from={de} durationInFrames={Math.max(1, Math.round(proximo * fps) - de)} name={nome}>
            {exemplos[nome] ? exemplos[nome]({ acento, corTexto: textoNoBotao, g, p }) : null}
            <div style={{ position: "absolute", left: ds.space[4], top: 96, padding: "6px 16px", borderRadius: ds.radius.sm, backgroundColor: comAlfa(ds.bg000, 0.7), ...tipo.chapter, fontSize: 30, color: soft }}>{nome}</div>
          </Sequence>
        );
      })}
      {mostrarGuia ? <GuiaZonaSegura /> : null}
    </AbsoluteFill>
  );
};
