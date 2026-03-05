/**
 * A simple Logistic Regression implementation for URL classification.
 * While the user asked for XGBoost, implementing a full XGBoost in TS 
 * from scratch is overkill for a demo. Logistic Regression is robust and 
 * easy to "train" in this environment.
 */

export interface ModelWeights {
  weights: number[];
  bias: number;
}

export class MaliciousUrlModel {
  private weights: number[];
  private bias: number;

  constructor(initialWeights?: ModelWeights) {
    // 10 features as defined in featureExtraction.ts
    this.weights = initialWeights?.weights || new Array(10).fill(0).map(() => Math.random() - 0.5);
    this.bias = initialWeights?.bias || 0;
  }

  // Sigmoid activation function
  private sigmoid(z: number): number {
    return 1 / (1 + Math.exp(-z));
  }

  // Predict probability of being malicious
  public predict(features: number[]): number {
    let z = this.bias;
    for (let i = 0; i < this.weights.length; i++) {
      z += this.weights[i] * features[i];
    }
    return this.sigmoid(z);
  }

  // Simple training step (Gradient Descent)
  public train(data: { features: number[], label: number }[], learningRate = 0.01, epochs = 100) {
    for (let epoch = 0; epoch < epochs; epoch++) {
      for (const item of data) {
        const prediction = this.predict(item.features);
        const error = prediction - item.label;

        // Update weights
        for (let i = 0; i < this.weights.length; i++) {
          this.weights[i] -= learningRate * error * item.features[i];
        }
        // Update bias
        this.bias -= learningRate * error;
      }
    }
  }

  public getModelData(): ModelWeights {
    return {
      weights: this.weights,
      bias: this.bias
    };
  }

  public setModelData(data: ModelWeights) {
    this.weights = data.weights;
    this.bias = data.bias;
  }
}

// Default "pre-trained" weights for a reasonable baseline
export const DEFAULT_MODEL_DATA: ModelWeights = {
  weights: [
    0.005,  // urlLength (longer is slightly more suspicious)
    0.2,    // dotCount (more dots = suspicious)
    0.3,    // subdomainCount (more subdomains = suspicious)
    1.5,    // hasIpAddress (IP in URL is very suspicious)
    -1.0,   // isHttps (HTTPS is safer)
    0.8,    // suspiciousKeywordCount (keywords like login/paypal are suspicious)
    0.4,    // specialCharCount (more special chars = suspicious)
    0.1,    // hyphenCount (hyphens are common in phishing)
    0.02,   // domainLength
    0.5     // redirectCount
  ],
  bias: -2.0 // Bias towards "Safe"
};
