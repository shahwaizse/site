import Groq from "groq-sdk";

const apiKey = import.meta.env.GROQ_API_KEY ?? process.env.GROQ_API_KEY ?? "";
const model =
  import.meta.env.GROQ_MODEL ??
  process.env.GROQ_MODEL ??
  "llama-3.3-70b-versatile";

if (!apiKey) {
  console.warn("[groq] GROQ_API_KEY is not set");
}

export const groq = new Groq({ apiKey });
export const GROQ_MODEL = model;
