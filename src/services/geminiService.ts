const API_BASE = window.location.origin;

interface ChatRequest {
  messages: { role: string; text: string }[];
  systemInstruction: string;
}

interface FastChatRequest {
  prompt: string;
}

async function apiChat(request: ChatRequest): Promise<string> {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Chat API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.text || '';
}

async function apiFastChat(request: FastChatRequest): Promise<string> {
  const res = await fetch(`${API_BASE}/api/fast-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`FastChat API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.text || '';
}

export const geminiService = {
  chat: async (messages: { role: string; text: string }[], systemInstruction: string) => {
    return apiChat({ messages, systemInstruction });
  },

  fastChat: async (prompt: string) => {
    return apiFastChat({ prompt });
  },
};
