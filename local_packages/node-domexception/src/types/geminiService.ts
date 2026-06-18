import { Listing, ChatMessage } from '../types';

export const chatWithGemini = async (messages: ChatMessage[], context: Listing[]) => {
  try {
    const response = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        messages,
        context: context.slice(0, 5) 
      })
    });
    if (!response.ok) throw new Error('Failed to fetch from Gemini');
    const data = await response.json();
    return data.content;
  } catch (e) {
    console.error(e);
    return "Sorry, I'm having trouble connecting right now.";
  }
};
