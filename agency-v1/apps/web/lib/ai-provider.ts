import { createVertex } from "@ai-sdk/google-vertex";

// Initialize Vertex AI with the service account from environment variables/JSON
export const vertex = createVertex({
  project: process.env.GOOGLE_PROJECT_ID || "legacymark-bic-sas",
  location: process.env.GOOGLE_LOCATION || "us-central1",
  // google-vertex automatically picks up GOOGLE_APPLICATION_CREDENTIALS 
  // from the environment if it points to a valid JSON file.
});

// Helper to get the default model
export const geminiModel = vertex("gemini-1.5-pro");
export const geminiFlashModel = vertex("gemini-2.0-flash");
