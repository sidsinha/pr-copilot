// Configuration imports
import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from 'dotenv';

dotenv.config();

// Function to get CIS configuration
export function getCISConfig() {
  // Use system username first, then environment variable as fallback, then default
  let username;
  try {
    const os = require('os');
    username = os.userInfo().username;
  } catch (error) {
    console.warn("Could not determine system username using 'os.userInfo()'. Using CIS_USERNAME from environment or default. Error:", error instanceof Error ? error.message : String(error));
    username = 'default';
  }
  
  const cis_headers = { "WD-PCA-Feature-Key": username };
  
  return {
    username,
    cis_headers,
    base_url: "https://s0010-ml-https.s0010.us-west-2.awswd/ml/inference/cis/v1alpha1/openai/v1/",
    cis_api_key: "bypass-auth"
  };
}

export function getLLMClient() {
    const { username, cis_headers, base_url, cis_api_key } = getCISConfig();

    console.log("Username:-----------", username);

    const llm_client = new ChatOpenAI({
        model: "aviato-turbo/aviato-turbo",
        configuration: {
            baseURL: base_url,
            defaultHeaders: cis_headers,
        },
        apiKey: cis_api_key,
    });

    return llm_client;
}
