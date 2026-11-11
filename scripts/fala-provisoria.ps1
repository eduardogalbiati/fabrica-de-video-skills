# Fala provisoria: le o texto do roteiro com a voz do Windows e gera um video so com o audio,
# para testar as animacoes antes da gravacao de verdade. (No Mac isso era o "say -v Luciana".)
#
# Uso:  npm run fala -- <slug> <arquivo.txt ou "texto entre aspas"> [ritmo de -10 a 10, padrao 2]
# Saida: <pasta de trabalho>\public\previa\fala-<slug>.mp4  (1080x960, fundo bg-200)
# No video, use o prop video = "previa/fala-<slug>.mp4".
param(
    [Parameter(Mandatory = $true, Position = 0)][string]$Slug,
    [Parameter(Mandatory = $true, Position = 1)][string]$Texto,
    [Parameter(Position = 2)][int]$Ritmo = 2,
    [string]$Voz = 'Microsoft Maria Desktop'
)

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
$config = Get-Content -LiteralPath (Join-Path $raiz 'estudio.config.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$trabalho = if ($env:REELS_TRABALHO) { $env:REELS_TRABALHO } else { $config.trabalho }
$destino = Join-Path $trabalho 'public\previa'
New-Item -ItemType Directory -Force -Path $destino | Out-Null

if (Test-Path -LiteralPath $Texto -PathType Leaf) {
    $Texto = Get-Content -LiteralPath $Texto -Raw -Encoding UTF8
}
if (-not $Texto.Trim()) { throw 'O texto esta vazio.' }

Add-Type -AssemblyName System.Speech
$sint = New-Object System.Speech.Synthesis.SpeechSynthesizer
$wav = Join-Path ([System.IO.Path]::GetTempPath()) ("fala-$Slug.wav")
try {
    $vozes = $sint.GetInstalledVoices() | Where-Object { $_.Enabled } | ForEach-Object { $_.VoiceInfo.Name }
    if ($vozes -notcontains $Voz) {
        $ptbr = $sint.GetInstalledVoices() | Where-Object { $_.Enabled -and $_.VoiceInfo.Culture.Name -eq 'pt-BR' } | Select-Object -First 1
        if (-not $ptbr) { throw "Nenhuma voz em portugues instalada no Windows. Vozes: $($vozes -join ', ')" }
        $Voz = $ptbr.VoiceInfo.Name
    }
    $sint.SelectVoice($Voz)
    $sint.Rate = $Ritmo
    $sint.SetOutputToWaveFile($wav)
    $sint.Speak($Texto)
} finally {
    $sint.Dispose()
}

$saida = Join-Path $destino ("fala-$Slug.mp4")
& ffmpeg -hide_banner -loglevel error -y -f lavfi -i 'color=c=0x18233b:s=1080x960:r=30' -i $wav -shortest -c:v libx264 -crf 28 -preset veryfast -pix_fmt yuv420p -c:a aac -b:a 128k -ar 48000 -movflags +faststart $saida
if ($LASTEXITCODE -ne 0) { throw "ffmpeg falhou ($LASTEXITCODE)" }
Remove-Item -LiteralPath $wav -Force -ErrorAction SilentlyContinue

$dur = & ffprobe -v error -show_entries format=duration -of csv=p=0 $saida
Write-Host "Pronto: $saida ($([math]::Round([double]::Parse($dur, [cultureinfo]::InvariantCulture), 1)) s, voz $Voz)"
Write-Host "Depois: npm run legendar -- `"$saida`"   e   npm run batidas -- legendas\fala-$Slug.json roteiros\$Slug.ancoras.json src\videos\$Slug.tempos.json"
