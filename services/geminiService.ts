import { GoogleGenAI, GenerateContentResponse, Type, FunctionDeclaration, Content } from "@google/genai";
import { AI_SYSTEM_INSTRUCTION, AI_MODERATOR_SYSTEM_INSTRUCTION } from '../constants';
import type { Task, FocusSessionHistory, WeeklyPlan, ChatMessage } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This is a fallback for development. The environment variable should be set in production.
  console.warn("Gemini API key not found. AI features will be mocked.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const createTaskFunctionDeclaration: FunctionDeclaration = {
  name: 'createTask',
  description: 'Creates a new task in the user\'s to-do list.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: 'The title or description of the task.',
      },
      priority: {
        type: Type.STRING,
        description: 'The priority of the task. Can be "high", "medium", or "low". Defaults to "medium".',
      },
      dueDate: {
        type: Type.NUMBER,
        description: 'The due date for the task, as a UTC timestamp in milliseconds. Calculate this based on the current date if relative terms like "tomorrow" are used.',
      },
    },
    required: ['title'],
  },
};

export const getAIChatResponseStream = async (history: ChatMessage[]): Promise<AsyncGenerator<GenerateContentResponse>> => {
  if (!API_KEY) {
    async function* mockStream() {
        const mockResponse = "This is a mock response as the Gemini API key is not configured. Streaming is not available in mock mode. You asked about: '" + history[history.length - 1].text.slice(0, 50) + "...'";
        const words = mockResponse.split(' ');
        for (let i = 0; i < words.length; i++) {
            await new Promise(res => setTimeout(res, 90)); // Slower: 30ms -> 90ms
            // Type assertion to satisfy the return type
            yield { text: () => words[i] + ' ', functionCalls: () => undefined } as unknown as GenerateContentResponse;
        }
    }
    return mockStream();
  }

  const contents: Content[] = history.map(msg => ({
    role: msg.from === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }],
  }));

  const lastMessage = contents[contents.length - 1];
  if (lastMessage && lastMessage.role === 'user' && lastMessage.parts[0].text) {
      const originalText = lastMessage.parts[0].text;
      lastMessage.parts[0].text = `Current date is ${new Date().toISOString()}. User's request: "${originalText}"`;
  }

  try {
    const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
            systemInstruction: AI_SYSTEM_INSTRUCTION,
            temperature: 0.7,
            topP: 0.95,
            tools: [{ functionDeclarations: [createTaskFunctionDeclaration] }],
        }
    });
    return responseStream;
  } catch (error) {
    console.error("Error fetching stream from Gemini API:", error);
    async function* errorStream() {
        yield { text: () => "Sorry, I encountered an error while trying to answer your question. Please try again later.", functionCalls: () => undefined } as unknown as GenerateContentResponse;
    }
    return errorStream();
  }
};

export const evaluateTaskCompletion = async (task: Task): Promise<{ awardXP: boolean; reason: string }> => {
    if (!API_KEY) {
        return { awardXP: true, reason: 'Mock mode: API key not present.' };
    }

    const prompt = `
        Task Title: "${task.title}"
        Task Created: ${new Date(task.created).toISOString()}
        Completion History (Timestamps): ${JSON.stringify((task.completions || []).map(ts => new Date(ts).toISOString()))}
        Current Time: ${new Date().toISOString()}

        Analyze the completion history. Should XP be awarded for the latest completion?
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: AI_MODERATOR_SYSTEM_INSTRUCTION,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        awardXP: { type: Type.BOOLEAN, description: 'Whether to award XP for this completion.' },
                        reason: { type: Type.STRING, description: 'A brief explanation for the decision.' },
                    },
                    required: ['awardXP', 'reason'],
                },
            },
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error evaluating task with Gemini:", error);
        // Default to a safe, non-exploitable behavior
        return { awardXP: false, reason: 'An error occurred during AI evaluation.' };
    }
};

export interface StudyPlanParams {
  history: FocusSessionHistory[];
  timezone: string;
  availability: string;
  goals: string;
  currentDay: string;
}

export const generateStudyPlan = async ({ history, timezone, availability, goals, currentDay }: StudyPlanParams): Promise<WeeklyPlan> => {
    if (!API_KEY) {
        throw new Error("API key not configured.");
    }

    const prompt = `
      You are a pragmatic and motivational academic coach. Your goal is to create a realistic and effective weekly study plan.

      User's Context:
      - Timezone: ${timezone}
      - General Availability: "${availability}"
      - User's Study Goals for the week: "${goals}"
      - Recent Study History (last 7-14 days): ${history.length > 0 ? JSON.stringify(history.slice(-20)) : "No recent study history."}
      - Today is ${currentDay}.

      Your Task:
      Create a balanced study timetable for the next 7 days, starting from TODAY, which is ${currentDay}.
      1.  Prioritize activities that align with the user's stated goals.
      2.  The plan should aim to increase the user's total study time by at least 10% compared to their recent average, without causing burnout.
      3.  Schedule specific, actionable activities related to their goals (e.g., "Review Chapter 3 Calculus for midterm", "Draft English essay outline", "Watch 2 history lectures"). Do not use generic labels like "Study".
      4.  Incorporate short breaks (5-10 mins) after study sessions. You can represent this as a separate activity or build it into the time slots.
      5.  Respect the user's provided availability.
      6.  The output must be a schedule for the next 7 days, starting with ${currentDay}.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                systemInstruction: "You are a pragmatic and motivational academic coach. Your goal is to create realistic and effective study plans.",
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        Monday: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { time: { type: Type.STRING }, activity: { type: Type.STRING } }, required: ['time', 'activity'] } },
                        Tuesday: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { time: { type: Type.STRING }, activity: { type: Type.STRING } }, required: ['time', 'activity'] } },
                        Wednesday: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { time: { type: Type.STRING }, activity: { type: Type.STRING } }, required: ['time', 'activity'] } },
                        Thursday: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { time: { type: Type.STRING }, activity: { type: String } }, required: ['time', 'activity'] } },
                        Friday: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { time: { type: Type.STRING }, activity: { type: Type.STRING } }, required: ['time', 'activity'] } },
                        Saturday: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { time: { type: Type.STRING }, activity: { type: Type.STRING } }, required: ['time', 'activity'] } },
                        Sunday: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { time: { type: Type.STRING }, activity: { type: Type.STRING } }, required: ['time', 'activity'] } },
                    },
                },
            },
        });
        
        const jsonText = response.text.trim();
        if (!jsonText) {
             throw new Error("The AI returned an empty plan. Please try rephrasing your goals.");
        }
        try {
            return JSON.parse(jsonText);
        } catch (parseError) {
            console.error("Error parsing study plan JSON from Gemini:", parseError);
            console.log("Received text:", jsonText);
            throw new Error("The AI returned a plan in an unexpected format. Please try again.");
        }
    } catch (error: any) {
        console.error("Error generating study plan with Gemini:", error);
        if (error.message.includes("unexpected format") || error.message.includes("empty plan")) {
            throw error;
        }
        throw new Error("Could not connect to the AI planner. Please check your connection and try again.");
    }
};