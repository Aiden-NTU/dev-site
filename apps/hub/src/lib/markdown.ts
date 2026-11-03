import { marked } from "marked";
import markedKatex from "marked-katex-extension";

marked.use(
  markedKatex({
    throwOnError: false,
  }),
);

export async function renderMarkdown(md: string): Promise<string> {
  return marked.parse(md, { async: true }) as Promise<string>;
}
