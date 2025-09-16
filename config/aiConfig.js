// AI Configuration
import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from 'dotenv';

dotenv.config();

// Function to get AI configuration
export function getAIConfig() {
  const username = process.env.AI_USERNAME;
  const base_url = process.env.AI_BASE_URL;
  const api_key = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;
  
  if (!username) {
    throw new Error('AI_USERNAME environment variable is required');
  }
  
  if (!base_url) {
    throw new Error('AI_BASE_URL environment variable is required');
  }
  
  if (!api_key) {
    throw new Error('AI_API_KEY environment variable is required');
  }
  
  if (!model) {
    throw new Error('AI_MODEL environment variable is required');
  }
  
  const headers = { "Authorization": `Bearer ${api_key}` };
  
  return {
    username,
    headers,
    base_url,
    api_key,
    model
  };
}

export function getLLMClient() {
    const { username, headers, base_url, api_key, model } = getAIConfig();

    console.log("Username:-----------", username);

    const llm_client = new ChatOpenAI({
        model: model,
        configuration: {
            baseURL: base_url,
            defaultHeaders: headers,
        },
        apiKey: api_key,
    });

    return llm_client;
}
