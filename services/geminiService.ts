import { GoogleGenAI, Type } from "@google/genai";
import { StartupData, StartupAiEvaluation, DailyReport, ProgramStats } from "../types";

// Initialize Gemini Client
// NOTE: In a production environment, never expose API keys on the client side. 
// This should be proxied through a backend function (Firebase Functions). 
// For this demo, we use the provided env variable.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = "gemini-2.5-flash";

export const evaluateStartup = async (startup: StartupData): Promise<StartupAiEvaluation> => {
  const prompt = `
    You are a Strict, Top-Tier Venture Capital Investment Expert (like a partner at Sequoia or Benchmark).
    Evaluate this startup brutally but fairly. 
    
    Startup Name: ${startup.name}
    Description: ${startup.fullDescription}
    Stage: ${startup.stage}
    Founder: ${startup.founderName} (${startup.founderBio})
    Business Model: ${startup.businessModel}
    Traction: ${startup.traction}
    Sector: ${startup.sector}

    Provide a JSON response with:
    1. confidenceScore (0-100 integer)
    2. verdict (Invest, Watch, or Pass)
    3. strengths (array of strings)
    4. weaknesses (array of strings, be critical)
    5. strategicAnalysis (a paragraph summary of the opportunity and risks)
    6. nextSteps (actionable bullet points for the startup)
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            confidenceScore: { type: Type.INTEGER },
            verdict: { type: Type.STRING, enum: ["Invest", "Watch", "Pass"] },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            strategicAnalysis: { type: Type.STRING },
            nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["confidenceScore", "verdict", "strengths", "weaknesses", "strategicAnalysis", "nextSteps"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const data = JSON.parse(text);
    return {
        ...data,
        lastUpdated: new Date().toISOString()
    };

  } catch (error) {
    console.error("Error generating startup evaluation:", error);
    // Fallback in case of error
    return {
        confidenceScore: 0,
        verdict: 'Watch',
        strengths: [],
        weaknesses: ["AI Analysis Failed"],
        strategicAnalysis: "Could not generate analysis at this time.",
        nextSteps: [],
        lastUpdated: new Date().toISOString()
    };
  }
};

export const generateDailyReport = async (
    activeUsersCount: number, 
    interactionCount: number,
    startupsCount: number,
    sampleLogs: string[],
    deepStats?: ProgramStats
): Promise<Partial<DailyReport>> => {
    
    let deepContext = "";
    if (deepStats) {
        deepContext = `
        DEEP PROGRAM SCAN RESULTS:
        - Module Completion Rates: ${deepStats.moduleStats.map(m => `${m.name}: ${m.completionRate}%`).join(', ')}
        - Identified Bottleneck: ${deepStats.topBottleneck}
        - Random Content Samples from User Modules:
        ${deepStats.samples.join('\n')}
        `;
    }

    const prompt = `
      You are the CapKit Program Director AI. 
      Analyze the platform usage for today and provide a strategic summary.
      
      Metrics:
      - Active Users: ${activeUsersCount}
      - Total Startups: ${startupsCount}
      - System Interactions: ${interactionCount}
      
      Recent Activity Logs:
      ${sampleLogs.join('\n')}

      ${deepContext}

      Provide a daily summary report in JSON format including:
      1. summary (A paragraph overview of platform health)
      2. recommendations (3 bullet points on how to improve engagement or user experience based on the data)
      3. deepAnalysis (Object with 'bottleneckAnalysis' and 'trendAnalysis') IF deep scan data is provided.
         - bottleneckAnalysis: Explain why users might be stuck at the bottleneck module.
         - trendAnalysis: What are the founders focusing on based on the completion rates?
    `;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING },
                        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
                        deepAnalysis: {
                            type: Type.OBJECT,
                            properties: {
                                bottleneckAnalysis: { type: Type.STRING },
                                trendAnalysis: { type: Type.STRING }
                            }
                        }
                    }
                }
            }
        });

        const text = response.text;
        if(!text) return { summary: "No data", recommendations: []};
        return JSON.parse(text);

    } catch (error) {
        console.error("Error generating daily report:", error);
        return { summary: "Analysis failed", recommendations: [] };
    }
}