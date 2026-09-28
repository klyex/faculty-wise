export interface AiChatResponse {
  answer: string;
  credits_used: number;
}

export async function askAi(question: string): Promise<AiChatResponse> {
  const apiKey = process.env.NEXT_PUBLIC_INNOVATECH_API_KEY;
  const endpoint = process.env.NEXT_PUBLIC_AI_CHAT_ENDPOINT;

  if (!apiKey || !endpoint) {
    throw new Error("AI API credentials are not configured.");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: apiKey,
      question: question,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data as AiChatResponse;
}
