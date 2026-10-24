import type { NextConfig } from "next";
const nextConfig: NextConfig = {
 poweredByHeader: false,
 serverExternalPackages: ["kokoro-js", "@huggingface/transformers", "onnxruntime-node", "phonemizer", "nodemailer"],
 outputFileTracingIncludes:{
  "/api/labs/ielts-speaking/*":[
   "./node_modules/kokoro-js/voices/{af_heart,af_bella,am_michael,bf_emma,bm_george,bm_lewis}.bin",
   `./node_modules/onnxruntime-node/bin/napi-v3/${process.platform}/${process.arch}/*`,
  ],
  "/api/mock-attempts/*/audio":["./assets/exams/ielts-01-part-*.mp3"],
  "/api/exams/audio-check":["./assets/exams/audio-check.mp3"],
 },
};
export default nextConfig;

