

import { pipeline } from '@xenova/transformers';

async function test() {
  console.log("Loading model...");
  try {
    // Attempt to load a known phishing/malware detection model.
    // If this fails, we will fall back to a generic classification model.
    const classifier = await pipeline('text-classification', 'elftsdmr/malware-url-detect');
    const result = await classifier("http://google-login-secure.com/");
    console.log("Result:", result);
  } catch (e) {
    console.error("Failed to load elftsdmr/malware-url-detect", e);
    try {
        console.log("Falling back to Xenova sentiment model as proof-of-concept for ONNX...");
        const classifier2 = await pipeline('text-classification', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
        const result2 = await classifier2("http://google-login-secure.com/");
        console.log("Result2:", result2);
    } catch(e2) {
        console.error("Failed completely", e2);
    }
  }
}

test();
