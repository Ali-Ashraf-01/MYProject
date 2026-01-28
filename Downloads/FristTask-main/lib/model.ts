import { createVertex } from '@ai-sdk/google-vertex';

// Create Vertex AI provider instance
export const vertex = createVertex({
  project: process.env.GOOGLE_VERTEX_PROJECT || 'gen-lang-client-0939978434',
  location: process.env.GOOGLE_VERTEX_LOCATION || 'us-central1',
});

export const model = vertex('gemini-2.5-flash');
