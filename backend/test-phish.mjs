import { pipeline } from '@xenova/transformers';

async function test() {
  try {
    console.log("Loading malware-url-detect...");
    const pipe = await pipeline('text-classification', 'elftsdmr/malware-url-detect');
    const out = await pipe('http://paypal-secure-login.com');
    console.log("Success:", out);
  } catch (e) {
    console.error("Failed:", e.message);
  }
}
test();
