# Recorta a pessoa do fundo de uma gravação: gera a MÁSCARA em vídeo (branco = pessoa, preto = fundo).
# Roda o segmentador do MediaPipe (Tasks API, ImageSegmenter em modo VIDEO) quadro a quadro, suaviza a máscara
# no tempo (sem rastro quando a mão mexe) e na borda, e escreve direto no ffmpeg por pipe (nada de PNGs no disco).
# Quem junta vídeo + máscara num WebM com transparência é o scripts/recortar.mjs (npm run recortar).
#
# Roda com o Python do venv, que fica fora do projeto (o npm run recortar acha sozinho):
#   <venv>\Scripts\python.exe -I recortar.py "<vídeo>" "<máscara.mp4>"
#       [--modelo multiclass|simples|<arquivo.tflite>]  multiclass (padrão) = selfie_multiclass_256x256
#       [--suavizacao 0.6]   peso do quadro anterior na média exponencial (0 = sem suavizar)
#       [--borda 3]          desfoque da borda, em px
#       [--limiar 0.5]       onde a confiança vira pessoa; [--dureza 0.15] meia largura da transição
#       [--encolher 1]       px que a borda entra antes do desfoque (tira a franja da parede)
#       [--refinar guiado|nenhum]  filtro guiado: cola a borda da máscara na borda real da imagem
#       [--processos 4]      trechos do vídeo processados em paralelo (o MediaPipe usa ~1 núcleo por processo)
#       [--codec h264|ffv1]  h264 → .mp4 (padrão), ffv1 → .mkv sem perda
#       [--inicio s] [--duracao s]  só um trecho (para testes)
#       [--estatisticas arquivo.json]  mede o tremor da máscara quadro a quadro
# Os modelos ficam em <venv>\..\modelos (baixados de storage.googleapis.com/mediapipe-models).
# Supõe vídeo com quadros por segundo constantes (o `npm run converter` já entrega assim).
import argparse
import json
import multiprocessing
import os
import subprocess
import sys
import time
from fractions import Fraction
from pathlib import Path

os.environ.setdefault("GLOG_minloglevel", "2")  # cala o falatório do MediaPipe
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

import cv2  # noqa: E402
import numpy as np  # noqa: E402

MODELOS = Path(sys.prefix).parent / "modelos"  # venv em ...\recorte\.venv → modelos em ...\recorte\modelos
APELIDOS = {
    "multiclass": "selfie_multiclass_256x256.tflite",
    "simples": "selfie_segmenter.tflite",
}
AQUECER = 15  # quadros lidos antes de cada trecho paralelo, só para a suavização no tempo começar "quente"

_contador = None  # quadros feitos, somados entre os processos (para o progresso)


def achar_modelo(nome):
    caminho = Path(nome)
    if not caminho.suffix:
        caminho = MODELOS / APELIDOS.get(nome, nome + ".tflite")
    if not caminho.exists():
        sys.exit(f"Não achei o modelo: {caminho}\nBaixe de https://storage.googleapis.com/mediapipe-models/image_segmenter/ para {MODELOS}")
    return caminho


def sondar(video):
    """Tamanho (já girado), taxa exata de quadros e número de quadros, pelo ffprobe."""
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_packets", "-show_entries",
                        "stream=width,height,r_frame_rate,nb_read_packets:stream_side_data=rotation", "-of", "json", str(video)],
                       capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(r.stderr or f"ffprobe falhou em {video}")
    s = json.loads(r.stdout)["streams"][0]
    W, H = int(s["width"]), int(s["height"])
    rot = next((int(d["rotation"]) for d in s.get("side_data_list", []) if "rotation" in d), 0)
    if abs(rot) % 180 == 90:
        W, H = H, W
    return W, H, Fraction(s["r_frame_rate"]), int(s["nb_read_packets"])


def suavizar_degrau(x, lo, hi):
    """smoothstep: abaixo de lo vira 0, acima de hi vira 1, curva suave no meio."""
    t = np.clip((x - lo) / max(hi - lo, 1e-6), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def args_codec(codec):
    if codec == "h264":
        return ["-c:v", "libx264", "-preset", "medium", "-crf", "10", "-pix_fmt", "yuv420p", "-movflags", "+faststart"]
    return ["-c:v", "ffv1", "-level", "3", "-pix_fmt", "gray"]


def iniciar_processo(contador):
    global _contador
    _contador = contador


def processar(t):
    """Faz a máscara dos quadros [ini, ini+n) e grava em t['saida']. Roda no processo principal ou num paralelo."""
    import mediapipe as mp
    from mediapipe.tasks.python import vision
    from mediapipe.tasks.python.core.base_options import BaseOptions

    a = t["opcoes"]
    W, H, fps = t["W"], t["H"], Fraction(t["fps"])
    w2, h2 = W // 2, H // 2  # o modelo trabalha em 256x256; meia resolução já sobra e deixa o resto rápido
    multiclasse = "multiclass" in Path(t["modelo"]).name
    lo, hi = a["limiar"] - a["dureza"], a["limiar"] + a["dureza"]
    sigma = a["borda"] / 2.0  # o desfoque cobre ±2σ = ±borda px
    e = int(round(a["encolher"]))
    nucleo = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * e + 1, 2 * e + 1)) if e > 0 else None
    guiado = a["refinar"] == "guiado"

    # o MediaPipe escreve avisos direto no stderr (em C++) ao abrir o modelo; cala só nesse trecho
    sys.stderr.flush()
    salvo, nulo = os.dup(2), os.open(os.devnull, os.O_WRONLY)
    os.dup2(nulo, 2)
    try:
        segmentador = vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(
            base_options=BaseOptions(model_asset_path=t["modelo"]),
            running_mode=vision.RunningMode.VIDEO,
            output_confidence_masks=True,
            output_category_mask=False,
        ))
    finally:
        os.dup2(salvo, 2)
        os.close(nulo)
        os.close(salvo)

    # lê os quadros pelo ffmpeg: o -ss com decodificação para no quadro exato
    comeco = max(0, t["ini"] - (AQUECER if t["aquecer"] else 0))
    pular = t["ini"] - comeco
    ss = max(0.0, (comeco - 0.25) / float(fps))
    leitor = subprocess.Popen(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-ss", f"{ss:.6f}", "-i", t["entrada"], "-map", "0:v:0",
         "-frames:v", str(t["n"] + pular), "-fps_mode", "passthrough", "-f", "rawvideo", "-pix_fmt", "bgr24", "-"],
        stdout=subprocess.PIPE, bufsize=W * H * 3 * 2,
    )
    escritor = subprocess.Popen(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "gray",
         "-s", f"{W}x{H}", "-r", f"{fps.numerator}/{fps.denominator}", "-i", "-", *args_codec(t["codec"]), t["saida"]],
        stdin=subprocess.PIPE,
    )

    def mascara_final(m, guia):
        if guiado:
            m = cv2.ximgproc.guidedFilter(guia, m, a["raio_guiado"], a["eps_guiado"])
        m = suavizar_degrau(cv2.resize(m, (W, H), interpolation=cv2.INTER_LINEAR), lo, hi)
        if nucleo is not None:
            m = cv2.erode(m, nucleo)  # puxa a borda para dentro: tira a franja da parede
        if sigma > 0:
            m = cv2.GaussianBlur(m, (0, 0), sigma)
        return np.clip(m * 255.0 + 0.5, 0, 255).astype(np.uint8)

    anterior = cinza_ant = final_ant = bruta_ant = None
    medidas = []
    tam = W * H * 3
    j = 0
    while j < t["n"] + pular:
        dados = leitor.stdout.read(tam)
        if len(dados) < tam:
            break
        quadro = np.frombuffer(dados, np.uint8).reshape(H, W, 3)
        pequeno = cv2.resize(quadro, (w2, h2), interpolation=cv2.INTER_AREA)
        rgb = np.ascontiguousarray(cv2.cvtColor(pequeno, cv2.COLOR_BGR2RGB))
        ts = int(round((comeco + j) * 1000 / fps))
        mascaras = segmentador.segment_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb), ts).confidence_masks
        if multiclasse or len(mascaras) > 1:
            pessoa = 1.0 - mascaras[0].numpy_view()[..., 0]  # pessoa = tudo que não é fundo (classe 0)
        else:
            pessoa = mascaras[0].numpy_view()[..., 0].copy()
        pessoa = pessoa.astype(np.float32)

        # --- suavização no tempo: média exponencial que se desliga onde há movimento ---
        cinza = cv2.GaussianBlur(cv2.resize(cv2.cvtColor(pequeno, cv2.COLOR_BGR2GRAY), (w2 // 4, h2 // 4),
                                            interpolation=cv2.INTER_AREA), (5, 5), 0).astype(np.float32)
        mov_medio = 0.0
        if anterior is None or a["suavizacao"] <= 0:
            suave = pessoa
        else:
            dif_img = np.abs(cinza - cinza_ant)                       # a imagem mudou aqui? (0..255)
            mov = np.clip((dif_img - 3.0) / 10.0, 0.0, 1.0)
            mov = cv2.dilate(mov, np.ones((5, 5), np.uint8))          # a mão leva a borda junto
            mov = cv2.resize(mov, (w2, h2), interpolation=cv2.INTER_LINEAR)
            salto = np.clip((np.abs(pessoa - anterior) - 0.3) / 0.4, 0.0, 1.0)  # mudança grande da máscara passa direto
            peso = a["suavizacao"] * (1.0 - np.maximum(mov, salto))
            suave = peso * anterior + (1.0 - peso) * pessoa
            mov_medio = float(dif_img.mean())
        anterior, cinza_ant = suave, cinza

        if j >= pular:
            guia = pequeno.astype(np.float32) / 255.0 if guiado else None
            final = mascara_final(suave, guia)
            escritor.stdin.write(final.tobytes())
            if t["estatisticas"]:
                bruta = mascara_final(pessoa, guia)  # a mesma máscara sem a suavização no tempo
                if final_ant is not None:
                    df, db = cv2.absdiff(final, final_ant), cv2.absdiff(bruta, bruta_ant)
                    q = comeco + j
                    medidas.append({
                        "quadro": q, "segundo": round(q / float(fps), 3), "movimento_imagem": round(mov_medio, 3),
                        "dif_final": round(float(df.mean()) / 2.55, 4), "dif_bruta": round(float(db.mean()) / 2.55, 4),
                        "px25_final": int((df > 64).sum()), "px25_bruta": int((db > 64).sum()),
                    })
                final_ant, bruta_ant = final, bruta
            if _contador is not None:
                with _contador.get_lock():
                    _contador.value += 1
        j += 1

    leitor.stdout.close()
    leitor.wait()
    escritor.stdin.close()
    escritor.wait()
    segmentador.close()
    if escritor.returncode != 0:
        raise RuntimeError(f"o ffmpeg falhou ao gravar {t['saida']}")
    return {"feitos": j - pular, "medidas": medidas}


def main():
    ap = argparse.ArgumentParser(description="Gera a máscara da pessoa (MediaPipe) de um vídeo.")
    ap.add_argument("entrada")
    ap.add_argument("saida", help="máscara: .mp4 (h264) ou .mkv (ffv1)")
    ap.add_argument("--modelo", default="multiclass")
    ap.add_argument("--suavizacao", type=float, default=0.6)
    ap.add_argument("--borda", type=float, default=3.0)
    ap.add_argument("--limiar", type=float, default=0.5)
    ap.add_argument("--dureza", type=float, default=0.15)
    ap.add_argument("--encolher", type=float, default=1.0, help="px que a borda entra antes do desfoque")
    ap.add_argument("--refinar", choices=["guiado", "nenhum"], default="guiado")
    ap.add_argument("--raio-guiado", type=int, default=6, help="raio do filtro guiado, em px da meia resolução")
    ap.add_argument("--eps-guiado", type=float, default=2e-3)
    ap.add_argument("--processos", type=int, default=4)
    ap.add_argument("--codec", choices=["h264", "ffv1"], default=None)
    ap.add_argument("--inicio", type=float, default=0.0)
    ap.add_argument("--duracao", type=float, default=0.0)
    ap.add_argument("--estatisticas", default=None)
    a = ap.parse_args()

    modelo = achar_modelo(a.modelo)
    saida = Path(a.saida)
    codec = a.codec or ("ffv1" if saida.suffix.lower() == ".mkv" else "h264")
    if not Path(a.entrada).exists():
        sys.exit(f"Não achei o vídeo: {a.entrada}")
    W, H, fps, total = sondar(a.entrada)
    ini = min(total, int(round(a.inicio * fps)))
    n = total - ini
    if a.duracao > 0:
        n = min(n, int(round(a.duracao * fps)))
    if n <= 0:
        sys.exit("Nenhum quadro para processar (confira --inicio e --duracao).")
    saida.parent.mkdir(parents=True, exist_ok=True)

    opcoes = {k: getattr(a, k) for k in ("suavizacao", "borda", "limiar", "dureza", "encolher", "refinar", "raio_guiado", "eps_guiado")}
    base = {"entrada": str(a.entrada), "modelo": str(modelo), "W": W, "H": H, "fps": str(fps), "opcoes": opcoes,
            "estatisticas": bool(a.estatisticas)}
    p = max(1, min(a.processos, n // 60 or 1))  # trecho de pelo menos ~2 s
    limites = [ini + round(i * n / p) for i in range(p + 1)]
    trechos = []
    for i in range(p):
        parte = saida if p == 1 else saida.with_name(f"{saida.stem}.parte-{i:02d}.mkv")
        trechos.append({**base, "ini": limites[i], "n": limites[i + 1] - limites[i], "aquecer": i > 0,
                        "saida": str(parte), "codec": codec if p == 1 else "ffv1"})

    t0 = time.perf_counter()
    ctx = multiprocessing.get_context("spawn")
    contador = ctx.Value("i", 0)
    if p == 1:
        iniciar_processo(contador)
        resultados = [processar(trechos[0])]
    else:
        with ctx.Pool(p, initializer=iniciar_processo, initargs=(contador,)) as pool:
            pendente = pool.map_async(processar, trechos)
            while not pendente.ready():
                pendente.wait(1.0)
                feitos = contador.value
                gasto = time.perf_counter() - t0
                print(f"\r  {feitos}/{n} quadros  {feitos / gasto:.1f} q/s  ({p} processos)", end="", file=sys.stderr, flush=True)
            resultados = pendente.get()
        # junta os trechos (FFV1 sem perda) no arquivo final
        lista = saida.with_name(f"{saida.stem}.partes.txt")
        lista.write_text("".join(f"file '{Path(t['saida']).as_posix()}'\n" for t in trechos), encoding="utf-8")
        r = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lista),
                            "-r", f"{fps.numerator}/{fps.denominator}", *args_codec(codec), str(saida)])
        for t in trechos:
            Path(t["saida"]).unlink(missing_ok=True)
        lista.unlink(missing_ok=True)
        if r.returncode != 0:
            sys.exit("O ffmpeg falhou ao juntar os trechos da máscara.")
    gasto = time.perf_counter() - t0
    print(file=sys.stderr)

    feitos = sum(r["feitos"] for r in resultados)
    if feitos != n:
        print(f"AVISO: esperava {n} quadros e saíram {feitos}.", file=sys.stderr)
    import mediapipe as mp
    resumo = {"quadros": feitos, "segundos": round(gasto, 2), "quadros_por_segundo": round(feitos / gasto, 2),
              "processos": p, "modelo": modelo.name, "largura": W, "altura": H, "fps": f"{fps.numerator}/{fps.denominator}",
              **opcoes, "mediapipe": mp.__version__}
    if a.estatisticas:
        medidas = [m for r in resultados for m in r["medidas"]]
        Path(a.estatisticas).write_text(json.dumps({"resumo": resumo, "quadros": medidas}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(json.dumps(resumo, ensure_ascii=False))


if __name__ == "__main__":
    main()
