param([ValidateRange(2,6)][int]$Paper = 2)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$examRoot = Split-Path -Parent $PSScriptRoot
$examAssets = Join-Path $examRoot 'assets/exams'
$examNumber = $Paper.ToString('00')
$examTemp = Join-Path $examRoot "artifacts/audio-build/ielts-$examNumber"
New-Item -ItemType Directory -Force -Path $examAssets,$examTemp | Out-Null
Push-Location $examRoot
$examSynth = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
    $examData = & node --input-type=module -e "import {additionalListening} from './src/modules/exams/ielts-additional-listening.ts'; import {createHash} from 'node:crypto'; const scripts=additionalListening($Paper).scripts; console.log(JSON.stringify({scripts,sha256:createHash('sha256').update(JSON.stringify(scripts)).digest('hex')}));"
    if ($LASTEXITCODE -ne 0) { throw 'Could not read Listening scripts' }
    $examParsed = $examData | ConvertFrom-Json
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
    $examManifest = @{ paper=$Paper; scriptsSha256=$examParsed.sha256; source='Original authored synthetic practice recordings; Windows System.Speech voices'; parts=@() }
    for ($examPartIndex=0; $examPartIndex -lt 4; $examPartIndex++) {
        $examPartNumber=$examPartIndex+1
        $examStart=$examPartIndex*10+1
        $examMid=$examStart+5
        $examEnd=$examStart+9
        $examPart=$examParsed.scripts[$examPartIndex]
        $examFiles=@('intro','a','middle','b','outro') | ForEach-Object {Join-Path $examTemp "part-$examPartNumber-$_.wav"}
        Write-ExamSpeech $examFiles[0] @(@{voice='narrator';text="Part $examPartNumber. $($examPart.title). You now have time to read questions $examStart to $($examMid-1)."})
        Write-ExamSpeech $examFiles[1] $examPart.halves[0]
        Write-ExamSpeech $examFiles[2] @(@{voice='narrator';text="Now look at questions $examMid to $examEnd."})
        Write-ExamSpeech $examFiles[3] $examPart.halves[1]
        Write-ExamSpeech $examFiles[4] @(@{voice='narrator';text="That is the end of part $examPartNumber. You now have time to check your answers."})
        $examDuration=0.0
        foreach($examFile in $examFiles){$examDuration += Get-ExamDuration $examFile}
        $examSpeed=[Math]::Max(1.0,$examDuration/345.0)
        $examSilence=450.0-$examDuration/$examSpeed
        $examCulture=[Globalization.CultureInfo]::InvariantCulture
        $examFilter=''
        for($examIndex=0;$examIndex -lt 5;$examIndex++){$examFilter += "[$($examIndex):a]atempo=$($examSpeed.ToString($examCulture))[a$examIndex];"}
        $examFilter += "anullsrc=r=24000:cl=mono,atrim=duration=$(($examSilence*0.45).ToString($examCulture))[s1];anullsrc=r=24000:cl=mono,atrim=duration=$(($examSilence*0.30).ToString($examCulture))[s2];anullsrc=r=24000:cl=mono,atrim=duration=$(($examSilence*0.25).ToString($examCulture))[s3];[a0][s1][a1][a2][s2][a3][a4][s3]concat=n=8:v=0:a=1[out]"
        $examOut=Join-Path $examAssets "ielts-$examNumber-part-$examPartNumber.mp3"
        & ffmpeg -hide_banner -loglevel error -y -i $examFiles[0] -i $examFiles[1] -i $examFiles[2] -i $examFiles[3] -i $examFiles[4] -filter_complex $examFilter -map '[out]' -ar 24000 -ac 1 -b:a 48k -t 450 $examOut
        if($LASTEXITCODE -ne 0){throw "Audio generation failed for mock $examNumber part $examPartNumber"}
        $examSeconds=Get-ExamDuration $examOut
        if([Math]::Abs($examSeconds-450) -gt 0.2){throw 'Unexpected recording duration'}
        $examManifest.parts += @{part=$examPartNumber;seconds=$examSeconds;bytes=(Get-Item -LiteralPath $examOut).Length;sha256=(Get-FileHash -LiteralPath $examOut -Algorithm SHA256).Hash.ToLower()}
        Write-Output "IELTS $examNumber part $examPartNumber generated ($([Math]::Round($examSeconds,2)) seconds)."
    }
    $examManifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $examAssets "manifest-$examNumber.json") -Encoding utf8
} finally {
    $examSynth.Dispose()
    Pop-Location
}
