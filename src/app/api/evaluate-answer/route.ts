import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  baseDelay: number = 3000
): Promise<T> {
  let lastError: Error | unknown;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const status = error instanceof Error && 'status' in error
        ? (error as { status: number }).status : 0;
      const isRetryable = status === 529 || status === 503 || status === 500 || status === 429;
      if (!isRetryable || attempt === maxRetries) throw error;
      const jitter = Math.random() * 1000;
      const delay = baseDelay * Math.pow(2, attempt - 1) + jitter;
      console.log(`API error ${status} (attempt ${attempt}/${maxRetries}), retrying in ${Math.round(delay)}ms...`);
      await sleep(delay);
    }
  }
  throw lastError;
}

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

    let message;
    try {
      message = await withRetry(() => anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      }));
    } catch (err) {
      const st = err instanceof Error && 'status' in err ? (err as { status: number }).status : 0;
      if (st === 529 || st === 503) {
        console.log("Primary model overloaded, trying claude-sonnet-4-5-20250514...");
        message = await withRetry(() => anthropic.messages.create({
          model: "claude-sonnet-4-5-20250514",
          max_tokens: 2048,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        }));
      } else throw err;
    }

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
    console.error("Evaluate answer error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to evaluate answer" },
      { status: 500 }
    );
  }
}
