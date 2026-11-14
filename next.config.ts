import type { NextConfig } from "next";
const nextConfig: NextConfig = {
 poweredByHeader: false,
 serverExternalPackages: ["kokoro-js", "@huggingface/transformers", "onnxruntime-node", "phonemizer", "nodemailer"],
 outputFileTracingIncludes:{
  "/*":["./assets/entrance-mocks/**/*.json","./assets/jlpt/*.json","./assets/hsk/*.json","./assets/free-mocks/*.json"],
  // The IELTS mock's AI examiner uses the same local voice and transcription from its own routes.
  "/api/mock-attempts/*/speaking/*":[
   "./node_modules/kokoro-js/voices/bm_george.bin",
   `./node_modules/onnxruntime-node/bin/napi-v3/${process.platform}/${process.arch}/*`,
  ],
  "/api/exam-practice/*/speaking/*":[
   "./node_modules/kokoro-js/voices/bm_george.bin",
   `./node_modules/onnxruntime-node/bin/napi-v3/${process.platform}/${process.arch}/*`,
  ],
  "/api/labs/ielts-speaking/*":[
   "./node_modules/kokoro-js/voices/{af_heart,af_bella,am_michael,bf_emma,bm_george,bm_lewis}.bin",
   `./node_modules/onnxruntime-node/bin/napi-v3/${process.platform}/${process.arch}/*`,
  ],
  // Recordings: every audio route bundles one folder into its function, which must stay under Vercel's 250 MB.
  // `/audio` reads assets/exams (IELTS 01–06, JLPT) through audio-response.ts, which the tracer follows on its own.
  // Do not add an `/audio` key here: keys match anywhere in the route, so it would also add those files to `/audio/forms`.
  // `/audio/forms` reads assets/ielts-forms (IELTS 07–12) through audio-response-forms.ts:
  "/api/mock-attempts/*/audio/forms":["./assets/ielts-forms/*.mp3"],
  "/api/exam-practice/*/audio/forms":["./assets/ielts-forms/*.mp3"],
  // `/audio/hsk` reads assets/hsk-audio (HSK 1, about 12 MB) through audio-response-hsk.ts:
  "/api/mock-attempts/*/audio/hsk":["./assets/hsk-audio/*.mp3"],
  "/api/exam-practice/*/audio/hsk":["./assets/hsk-audio/*.mp3"],
  // `/audio/free` reads assets/free-audio (the free half-length mocks) through audio-response-free.ts:
  "/api/mock-attempts/*/audio/free":["./assets/free-audio/*.mp3"],
  "/api/exam-practice/*/audio/free":["./assets/free-audio/*.mp3"],
  "/api/exams/audio-check":["./assets/exams/audio-check.mp3"],
 },
};
export default nextConfig;

