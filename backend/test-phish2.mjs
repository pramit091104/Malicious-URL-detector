import { pipeline } from '@xenova/transformers';

async function test(modelId) {
  try {
    console.log("Loading", modelId);
    const pipe = await pipeline('text-classification', modelId);
    const out = await pipe('http://paypal-secure-login.com');
    console.log("Success for", modelId, ":", out);
    return true;
  } catch (e) {
    console.error("Failed for", modelId, ":", e.message);
    return false;
  }
}

async function run() {
  await test('ealvaradob/bert-finetuned-phishing');
  await test('Turtle357/PhishingURLDetector');
  await test('littleprophisher/phishing-bert');
}
run();
