import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY, {
    apiEndpoint: "https://generativelanguage.googleapis.com/v1",
  });

  const response = await fetch("https://generativelanguage.googleapis.com/v1/models?key=" + process.env.GEMINI_API_KEY);
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

listModels();