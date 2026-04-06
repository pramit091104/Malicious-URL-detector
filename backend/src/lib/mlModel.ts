import { pipeline } from '@xenova/transformers';

let classifier: any = null;

// Initialize the model once and cache it
async function getClassifier() {
  if (!classifier) {
    console.log("Loading Hugging Face ONNX Model to memory...");
    // We use a robust text classification model. 
    // We use 'Xenova/toxic-bert' as a stand-in for maliciousness detection.
    const progressCallback = (info: any) => {
        if (info.status === 'progress') {
            process.stdout.write(`\rDownloading AI Model Weights (${info.file}): ${Math.round(info.progress)}%    `);
        } else if (info.status === 'done') {
            console.log(`\nSuccessfully downloaded ${info.file}`);
        }
    };

    try {
        classifier = await pipeline('text-classification', 'Xenova/toxic-bert', {
            progress_callback: progressCallback
        });
    } catch(e) {
        console.warn("\nFailed to load toxic-bert, falling back...", e);
        classifier = await pipeline('text-classification', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english', {
            progress_callback: progressCallback
        });
    }
    console.log("\nHugging Face ONNX Model loaded successfully and ready for scanning!");
  }
  return classifier;
}

export async function getModelPrediction(url: string): Promise<{score: number, label: string, rawScore: number}> {
  try {
    const classify = await getClassifier();
    // Transformers pipeline output is typically an array with matches:
    // [{ label: 'toxic', score: 0.99 }] or [{ label: 'NEGATIVE', score: 0.8 }]
    const result = await classify(url) as any[];
    
    console.log("HF Inference Result for URL (" + url + "):", result);

    const match = result.reduce((prev, current) => (prev.score > current.score) ? prev : current, result[0]);
    let label = match.label.toLowerCase();
    
    let mappedScore = match.score;
    // We map the NLP label output to a 0.0 - 1.0 continuous maliciousness score.
    if (label === 'toxic' || label === 'negative' || label.includes('malware') || label.includes('phishing')) {
        mappedScore = match.score; 
    } else if (label === 'positive' || label === 'safe') {
        mappedScore = 1 - match.score; 
    }
    
    // If the final maliciousness score is very low, the effective AI label is "Safe".
    // This prevents the UI from confusingly showing "Label: Toxic (0.2% score)"
    if (mappedScore < 0.5) {
         label = 'safe';
    }

    return { score: mappedScore, label, rawScore: match.score };
  } catch (err) {
      console.error("Error during model prediction", err);
      // Fallback
      return { score: 0.5, label: "Unknown", rawScore: 0.5 };
  }
}
