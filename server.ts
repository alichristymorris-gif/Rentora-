import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini API Initialization
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const genAI = geminiApiKey ? new GoogleGenAI({ 
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  }) : null;

  // API routes
  app.post("/api/gemini/chat", async (req, res) => {
    const maxRetries = 3;
    let retryCount = 0;

    const attemptChat = async (): Promise<any> => {
      try {
        if (!genAI) {
          throw new Error("Gemini API key is not configured.");
        }

        const { messages, context } = req.body;
        
        let systemPrompt = `You are Rentora AI, a global rental marketplace assistant. 
        Context about current listings: ${JSON.stringify(context)}
        Be concise (max 3 sentences), helpful, and friendly. Answer in the user's language (e.g., Roman Urdu/Hindi if they use it).`;

        if (context && context.agentRole) {
          const dbData = context.supabaseDatabase || {};
          const dbContextStr = `Current database diagnostics: 
          - Total Verified Listings: ${dbData.totalListings || 0}
          - Active listings in platform: ${dbData.activeListingsCount || 0}
          - Pending dispute reports: ${dbData.pendingReportsCount || 0}
          - Total registered accounts (Admins+Landlords+Renters): ${dbData.totalUsers || 0}`;

          if (context.agentRole === 'rex') {
            systemPrompt = `You are Rex, the elite Sales Agent of Rentora — founded by Muhammad Ali. 
            Your role is to write highly compelling outbound copy, close deals, compile partnership agreements, write property catalogs, and handle landowner objections.
            - Speak in an extremely persuasive, confident, and professional mix of English and Roman Urdu.
            - ${dbContextStr}
            - Structure all drafts, emails, proposals, and WhatsApp lines clearly so Muhammad Ali can immediately use them.
            - Answer in the requested length and formats, providing premium high-converting detail. Do not be limited to 3 sentences.`;
          } else if (context.agentRole === 'ops') {
            systemPrompt = `You are the Rentora Operations & Diagnostics Agent. 
            Your role is to diagnose system diagnostics, solve client disputes, write support replies, analyze code exceptions, and construct structured daily briefing schedules.
            - Keep your responses structured, clinical, helpful, and highly accurate.
            - ${dbContextStr}
            - Offer direct, diagnostic technical fixes for code exceptions or user reports.
            - Answer in a clear, friendly professional tone. Do not be limited to 3 sentences.`;
          } else if (context.agentRole === 'scout') {
            systemPrompt = `You are the Scout Agent, Rentora's strategic researcher and competitor tracker.
            Your role is to analyse global expansion strategies, study competitor movements (Airbnb, OLX, Zameen.com), find untapped voids is payments/verification, and analyze market trends.
            - Offer deeply analytical, executive-level, and diagnostic scouting overviews.
            - ${dbContextStr}
            - Focus on competitive tactics, high-impact growth frameworks, or diaspora landlord segments.
            - Keep statistics and parameters clear, helpful, and structured. Do not be limited to 3 sentences.`;
          }
        }

        const chat = genAI.chats.create({
          model: "gemini-3-flash-preview",
          config: {
            systemInstruction: systemPrompt,
          },
          history: messages.slice(0, -1).map((m: any) => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.content }],
          })),
        });

        const result = await chat.sendMessage({ 
          message: messages[messages.length - 1].content 
        });
        
        return { content: result.text };
      } catch (error: any) {
        if (error.status === 503 || error.message?.includes("503") || error.message?.includes("high demand")) {
          if (retryCount < maxRetries) {
            retryCount++;
            const delay = Math.pow(2, retryCount) * 1000;
            console.log(`Gemini API busy (503). Retrying in ${delay}ms... (Attempt ${retryCount}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return attemptChat();
          }
        }
        throw error;
      }
    };

    try {
      const result = await attemptChat();
      res.json(result);
    } catch (error: any) {
      console.error("Gemini API Error after retries:", error);
      const status = error.status || (error.message?.includes("503") ? 503 : 500);
      res.status(status).json({ 
        error: error.message || "Failed to generate response",
        isRetryable: status === 503
      });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
