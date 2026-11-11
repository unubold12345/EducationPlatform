# Listening recordings — IELTS mocks 07–12

Local synthetic English recordings, generated with Kokoro-82M stock British and American voices. Use the matching candidate paper. The complete track plays all four parts with previews and checking pauses already included.

| Mock | Complete test | Part 1 | Part 2 | Part 3 | Part 4 |
| --- | --- | --- | --- | --- | --- |
| 07 | [Play (25:11)](mock-07/audio/listening-full.mp3) | [Play (6:03)](mock-07/audio/part-1.mp3) | [Play (5:43)](mock-07/audio/part-2.mp3) | [Play (6:11)](mock-07/audio/part-3.mp3) | [Play (7:14)](mock-07/audio/part-4.mp3) |
| 08 | [Play (25:29)](mock-08/audio/listening-full.mp3) | [Play (6:05)](mock-08/audio/part-1.mp3) | [Play (5:50)](mock-08/audio/part-2.mp3) | [Play (5:58)](mock-08/audio/part-3.mp3) | [Play (7:36)](mock-08/audio/part-4.mp3) |
| 09 | [Play (25:19)](mock-09/audio/listening-full.mp3) | [Play (6:00)](mock-09/audio/part-1.mp3) | [Play (5:48)](mock-09/audio/part-2.mp3) | [Play (5:57)](mock-09/audio/part-3.mp3) | [Play (7:33)](mock-09/audio/part-4.mp3) |
| 10 | [Play (25:48)](mock-10/audio/listening-full.mp3) | [Play (6:29)](mock-10/audio/part-1.mp3) | [Play (5:27)](mock-10/audio/part-2.mp3) | [Play (5:54)](mock-10/audio/part-3.mp3) | [Play (7:57)](mock-10/audio/part-4.mp3) |
| 11 | [Play (26:04)](mock-11/audio/listening-full.mp3) | [Play (6:12)](mock-11/audio/part-1.mp3) | [Play (6:28)](mock-11/audio/part-2.mp3) | [Play (6:01)](mock-11/audio/part-3.mp3) | [Play (7:23)](mock-11/audio/part-4.mp3) |
| 12 | [Play (25:40)](mock-12/audio/listening-full.mp3) | [Play (6:03)](mock-12/audio/part-1.mp3) | [Play (6:15)](mock-12/audio/part-2.mp3) | [Play (5:54)](mock-12/audio/part-3.mp3) | [Play (7:29)](mock-12/audio/part-4.mp3) |

For a timed sitting, play one complete track continuously. For separate-part practice, use the individual files. Do not add extra pauses: each part begins with 60 seconds to read; Parts 1–3 include 30 seconds at the midpoint and 30 seconds to check; Part 4 is continuous and ends with two minutes for final checking.

The final stop-writing announcement follows the two-minute check. Track durations include all instructions and silences. Full tracks are concatenations of their four parts; timings and SHA-256 hashes are in [audio-manifest.json](audio-manifest.json). Per-part JSON records retain role/voice mapping, the exact source paragraphs, pronunciation expansions and segment times.

## Regenerate locally

Use a Python environment with `kokoro-onnx`, `onnxruntime` and `numpy`, plus FFmpeg/FFprobe. Supply a local folder containing `kokoro-v1.0.onnx` and `voices-v1.0.bin`. No API key or network call is used by the generator.

```powershell
python -B MockExmps/IELTS/_source/generate_audio.py --model-dir <local-model-folder> --jobs 3
python -B MockExmps/IELTS/_source/validate_audio.py
python -B MockExmps/IELTS/_source/build.py
```

The verified PCM cache stays in the system temporary directory. The generator reuses matching recordings and writes only this offline pack and that temporary cache. It does not update website media or catalogues.

These voices do not reproduce the full official accent range. Complete human listening/pronunciation review and learner calibration remain outstanding. A synthetic recording is practice material, not an official IELTS recording.
