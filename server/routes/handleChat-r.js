import express from "express";
const handleChat = express.Router();
// handleChat.use(express.json());

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";

const gemini_api = process.env.REACT_APP_GEMINI_API_KEY;

const google = createGoogleGenerativeAI({
  apiKey: gemini_api,
});

handleChat.post("/api/chat", async (req, res) => {
  let messages = req.body.messages;

  const formattedMessages = JSON.stringify(messages, null, 2);
  // console.log("backend: ", formattedMessages);

  const result = await streamText({
    model: google("gemini-1.5-flash"),
    temperature: 0.7,
       system: `
      Please provide the following:
      
      1. Calculations:
         - Calculate and provide the user's BMI.
         - Calculate and provide the user's BMR.
      2. Recommend the amount of Calories for users base on the Goal Users

    **Output Requirements**:
      - Maximum 300 words total.
      - Use line breaks to separate each content item.
      - Save the calories suggestion into FORMAT: Kcal:
      Please ensure the recommendations are tailored to the user's profile and preferences.
    `,
    messages: messages
      .filter((message) => message.role === "user")
      .map((message) => ({
        role: message.role,
        content: message.content,
      })),
    // prompt: formattedMessages,
    maxRetries: 1,
    // maxTokens: 200,
  });
  result.pipeTextStreamToResponse(res);
});

export default handleChat;
