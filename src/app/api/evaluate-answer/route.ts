import { NextRequest, NextResponse } from "next/server";
import { generateText, cleanJsonResponse } from "@/lib/ai-provider";

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
  score: number;
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

    const { text: responseText } = await generateText({ user: prompt, maxTokens: 2048 });
    const cleaned = cleanJsonResponse(responseText);

    let evaluation: AnswerEvaluation;
    try {
      evaluation = JSON.parse(cleaned);
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
