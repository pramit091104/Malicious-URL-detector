import { GoogleGenAI, Type } from "@google/genai";
import { UrlFeatures } from "./featureExtraction";

export interface SecurityReport {
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  attackType: string;
  indicators: string[];
  explanation: string;
  recommendation: string;
}

export async function generateSecurityReport(
  url: string,
  features: UrlFeatures,
  predictionScore: number
): Promise<SecurityReport> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  
  const prompt = `
    Analyze the following website URL for cybersecurity threats.
    
    URL: ${url}
    
    Extracted Features:
    - URL Length: ${features.urlLength}
    - Dots: ${features.dotCount}
    - Subdomains: ${features.subdomainCount}
    - Has IP Address: ${features.hasIpAddress ? 'Yes' : 'No'}
    - Is HTTPS: ${features.isHttps ? 'Yes' : 'No'}
    - Suspicious Keywords: ${features.suspiciousKeywordCount}
    - Special Characters: ${features.specialCharCount}
    - Hyphens: ${features.hyphenCount}
    - Domain Length: ${features.domainLength}
    - Redirect Patterns: ${features.redirectCount}
    
    ML Model Prediction Score (0 to 1, where 1 is highly malicious): ${predictionScore.toFixed(4)}
    
    Generate a structured cybersecurity analysis report.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          riskLevel: {
            type: Type.STRING,
            description: "Risk level: Low, Medium, High, or Critical",
          },
          attackType: {
            type: Type.STRING,
            description: "Type of attack (e.g., Phishing, Malware, Safe)",
          },
          indicators: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of detected indicators",
          },
          explanation: {
            type: Type.STRING,
            description: "A simple explanation of the threat",
          },
          recommendation: {
            type: Type.STRING,
            description: "Recommended action for the user",
          },
        },
        required: ["riskLevel", "attackType", "indicators", "explanation", "recommendation"],
      },
    },
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return {
      riskLevel: predictionScore > 0.7 ? "High" : predictionScore > 0.3 ? "Medium" : "Low",
      attackType: "Unknown",
      indicators: ["Analysis failed"],
      explanation: "The AI was unable to generate a detailed report.",
      recommendation: "Proceed with caution."
    };
  }
}
