param([int]$OnlyPart = 0)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$examRoot = Split-Path -Parent $PSScriptRoot
$examAssets = Join-Path $examRoot 'assets/exams'
$examTemp = Join-Path $examRoot 'artifacts/audio-build'
New-Item -ItemType Directory -Force -Path $examAssets,$examTemp | Out-Null
$examData = & node --input-type=module -e "import {listeningScripts} from './src/modules/exams/ielts-listening.ts'; console.log(JSON.stringify(listeningScripts));"
if ($LASTEXITCODE -ne 0) { throw 'Could not read original Listening scripts' }
$examParts = $examData | ConvertFrom-Json
$examSynth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$examVoices = @{ narrator='Microsoft Zira Desktop'; woman='Microsoft Hazel Desktop'; man='Microsoft George'; tutor='Microsoft Susan' }
function Write-ExamSpeech($examPath,$examTurns) {
    $examSynth.SetOutputToWaveFile($examPath)
    foreach ($examTurn in $examTurns) {
        $examSynth.SelectVoice($examVoices[$examTurn.voice])
        $examSynth.Rate = -1
        $examSynth.Speak([string]$examTurn.text)
    }
    $examSynth.SetOutputToNull()
}
function Get-ExamDuration($examPath) {
    $examSeconds = & ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $examPath
    if ($LASTEXITCODE -ne 0) { throw 'Could not measure generated audio' }
    return [double]::Parse($examSeconds,[Globalization.CultureInfo]::InvariantCulture)
}
try {
    for ($examPartIndex=0; $examPartIndex -lt 4; $examPartIndex++) {
        $examPartNumber = $examPartIndex + 1
        if ($OnlyPart -ne 0 -and $OnlyPart -ne $examPartNumber) { continue }
        $examStart = $examPartIndex*10 + 1
        $examMid = $examStart + 5
        $examEnd = $examStart + 9
        $examPart = $examParts[$examPartIndex]
        $examA = Join-Path $examTemp "part-$examPartNumber-a.wav"
        $examB = Join-Path $examTemp "part-$examPartNumber-b.wav"
        $examIntro = Join-Path $examTemp "part-$examPartNumber-intro.wav"
        $examMiddle = Join-Path $examTemp "part-$examPartNumber-middle.wav"
        $examOutro = Join-Path $examTemp "part-$examPartNumber-outro.wav"
        Write-ExamSpeech $examIntro @(@{voice='narrator';text="Part $examPartNumber. $($examPart.title). You now have time to read questions $examStart to $($examMid-1)."})
        Write-ExamSpeech $examA $examPart.halves[0]
        Write-ExamSpeech $examMiddle @(@{voice='narrator';text="Now look at questions $examMid to $examEnd."})
        Write-ExamSpeech $examB $examPart.halves[1]
        Write-ExamSpeech $examOutro @(@{voice='narrator';text="That is the end of part $examPartNumber. You now have time to check your answers."})
        $examSpeechDuration = (Get-ExamDuration $examIntro)+(Get-ExamDuration $examA)+(Get-ExamDuration $examMiddle)+(Get-ExamDuration $examB)+(Get-ExamDuration $examOutro)
        $examSpeed = [Math]::Max(1.0,$examSpeechDuration/345.0)
        $examSilence = 450.0 - $examSpeechDuration/$examSpeed
        $examPause1 = $examSilence*0.45
        $examPause2 = $examSilence*0.30
        $examPause3 = $examSilence*0.25
        $examCulture = [Globalization.CultureInfo]::InvariantCulture
        $examFilter = "[0:a]atempo=$($examSpeed.ToString($examCulture))[a0];[1:a]atempo=$($examSpeed.ToString($examCulture))[a1];[2:a]atempo=$($examSpeed.ToString($examCulture))[a2];[3:a]atempo=$($examSpeed.ToString($examCulture))[a3];[4:a]atempo=$($examSpeed.ToString($examCulture))[a4];anullsrc=r=24000:cl=mono,atrim=duration=$($examPause1.ToString($examCulture))[s1];anullsrc=r=24000:cl=mono,atrim=duration=$($examPause2.ToString($examCulture))[s2];anullsrc=r=24000:cl=mono,atrim=duration=$($examPause3.ToString($examCulture))[s3];[a0][s1][a1][a2][s2][a3][a4][s3]concat=n=8:v=0:a=1[out]"
        $examOut = Join-Path $examAssets "ielts-01-part-$examPartNumber.mp3"
        & ffmpeg -hide_banner -loglevel error -y -i $examIntro -i $examA -i $examMiddle -i $examB -i $examOutro -filter_complex $examFilter -map '[out]' -ar 24000 -ac 1 -b:a 64k -t 450 $examOut
        if ($LASTEXITCODE -ne 0) { throw "Audio build failed for part $examPartNumber" }
        Write-Output "Part $examPartNumber generated: $([Math]::Round((Get-ExamDuration $examOut),2)) seconds"
    }
    $examManifest = @{ sourceSha256=(Get-FileHash -LiteralPath (Join-Path $examRoot 'src/modules/exams/ielts-listening.ts') -Algorithm SHA256).Hash.ToLower(); parts=@() }
    for ($examManifestPart=1; $examManifestPart -le 4; $examManifestPart++) {
        $examManifestFile = Join-Path $examAssets "ielts-01-part-$examManifestPart.mp3"
        $examManifest.parts += @{ part=$examManifestPart; seconds=(Get-ExamDuration $examManifestFile); bytes=(Get-Item -LiteralPath $examManifestFile).Length }
    }
    $examManifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $examAssets 'manifest.json') -Encoding utf8
} finally { $examSynth.Dispose() }
