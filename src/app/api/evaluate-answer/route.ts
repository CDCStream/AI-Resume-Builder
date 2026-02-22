import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface EvaluateAnswerRequest {
  question: string;
  questionCategory: string;
  userAnswer: string;
  bestAnswer: string;
  keyPoints: string[];
  jobTitle?: string;
  company?: string;
}

export interface AnswerEvaluation {
  score: number; // 1-10
  strengths: string[];
  improvements: string[];
  feedback: string;
  bestAnswerComparison: string;
  missingPoints: string[];
  deliveryTips: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: EvaluateAnswerRequest = await request.json();
    const { question, questionCategory, userAnswer, bestAnswer, keyPoints, jobTitle, company } = body;

    if (!question || !userAnswer) {
      return NextResponse.json(
        { error: "Question and answer are required" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const prompt = `You are an expert interview coach evaluating a candidate's interview answer.

CONTEXT:
Job Title: ${jobTitle || "Not specified"}
Company: ${company || "Not specified"}

INTERVIEW QUESTION:
"${question}"
(Category: ${questionCategory})

KEY POINTS THAT SHOULD BE COVERED:
${keyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}

IDEAL/BEST ANSWER:
${bestAnswer}

CANDIDATE'S ANSWER:
${userAnswer}

Evaluate the candidate's answer and provide detailed feedback in JSON format:

{
  "score": <number 1-10>,
  "strengths": [
    "Specific strength 1 in their answer",
    "Specific strength 2"
  ],
  "improvements": [
    "Specific area that could be improved",
    "Another improvement suggestion"
  ],
  "feedback": "2-3 sentences of overall constructive feedback, encouraging but honest",
  "bestAnswerComparison": "1-2 sentences comparing their answer to the ideal answer, highlighting the gap",
  "missingPoints": [
    "Key point they missed mentioning",
    "Another missing point"
  ],
  "deliveryTips": [
    "Tip for how to deliver this answer better",
    "Another delivery tip"
  ]
}

SCORING GUIDE:
- 9-10: Exceptional - covers all key points, specific examples, confident delivery
- 7-8: Good - covers most key points, some examples, minor improvements needed
- 5-6: Average - covers some key points, lacks specificity or examples
- 3-4: Below Average - misses many key points, vague or generic
- 1-2: Poor - doesn't address the question, unprofessional

Be constructive and specific. Reference actual content from their answer.
Return ONLY valid JSON, no additional text.`;

    console.log("Evaluating answer...");
    
    // Retry logic with exponential backoff
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const message = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2048,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        });

        const responseText = message.content
          .filter((block): block is Anthropic.TextBlock => block.type === "text")
          .map(block => block.text)
          .join("");

        let cleanedResponse = responseText.trim();
        if (cleanedResponse.startsWith("```json")) {
          cleanedResponse = cleanedResponse.slice(7);
        } else if (cleanedResponse.startsWith("```")) {
          cleanedResponse = cleanedResponse.slice(3);
        }
        if (cleanedResponse.endsWith("```")) {
          cleanedResponse = cleanedResponse.slice(0, -3);
        }
        cleanedResponse = cleanedResponse.trim();

        let evaluation: AnswerEvaluation;
        try {
          evaluation = JSON.parse(cleanedResponse);
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          return NextResponse.json(
            { error: "Failed to parse AI response" },
            { status: 500 }
          );
        }

        console.log(`Answer evaluated with score: ${evaluation.score}/10`);
        return NextResponse.json(evaluation);
        
      } catch (error) {
        lastError = error as Error;
        const isOverloaded = error instanceof Error && 
          (error.message.includes("529") || error.message.includes("overloaded"));
        
        if (isOverloaded && attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`API overloaded, retrying in ${waitTime/1000}s (attempt ${attempt}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        throw error;
      }
    }
    
    throw lastError;

  } catch (error) {
    console.error("Evaluate answer error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to evaluate answer" },
      { status: 500 }
    );
  }
}
