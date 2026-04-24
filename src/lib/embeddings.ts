// Voyage AI embeddings client. voyage-3-lite returns 512-dim vectors,
// voyage-3 returns 1024-dim. We default to voyage-3-lite (fast, cheap, great quality).

const VOYAGE_ENDPOINT = "https://api.voyageai.com/v1/embeddings";

const apiKey =
  import.meta.env.VOYAGE_API_KEY ?? process.env.VOYAGE_API_KEY ?? "";
const model =
  import.meta.env.VOYAGE_MODEL ?? process.env.VOYAGE_MODEL ?? "voyage-3-lite";

export const EMBEDDING_DIM = model === "voyage-3" ? 1024 : 512;

type VoyageResponse = {
  data: { embedding: number[]; index: number }[];
  model: string;
  usage: { total_tokens: number };
};

export async function embed(
  texts: string[],
  inputType: "document" | "query" = "document"
): Promise<number[][]> {
  if (!apiKey) {
    throw new Error("VOYAGE_API_KEY is not set");
  }
  if (texts.length === 0) return [];

  const res = await fetch(VOYAGE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: texts,
      model,
      input_type: inputType,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Voyage embedding failed: ${res.status} ${errText}`);
  }
  const json = (await res.json()) as VoyageResponse;
  // Ensure ordering by index
  return json.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

export async function embedOne(
  text: string,
  inputType: "document" | "query" = "query"
): Promise<number[]> {
  const [v] = await embed([text], inputType);
  return v;
}
