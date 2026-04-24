// Naive but effective chunker: split by paragraphs, then merge into
// chunks up to ~1000 chars with ~200 char overlap for context.

const TARGET = 1000;
const OVERLAP = 200;

export function chunk(text: string): string[] {
  const clean = text.replace(/\r\n/g, "\n").trim();
  if (clean.length <= TARGET) return [clean];

  const paragraphs = clean.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let buf = "";

  for (const p of paragraphs) {
    if (buf.length + p.length + 2 <= TARGET) {
      buf = buf ? `${buf}\n\n${p}` : p;
    } else {
      if (buf) chunks.push(buf);
      if (p.length <= TARGET) {
        buf = p;
      } else {
        // hard-split oversized paragraph
        for (let i = 0; i < p.length; i += TARGET - OVERLAP) {
          chunks.push(p.slice(i, i + TARGET));
        }
        buf = "";
      }
    }
  }
  if (buf) chunks.push(buf);

  // add overlap tails between chunks
  return chunks.map((c, i) => {
    if (i === 0) return c;
    const prev = chunks[i - 1];
    const tail = prev.slice(-OVERLAP);
    return `${tail} ${c}`;
  });
}
