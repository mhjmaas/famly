import { tavily } from "@tavily/core";
import { z } from "zod";

export const webSearchTool = {
  description:
    "Perform a web search with the given query and return a string message with the search results.",
  inputSchema: z.object({
    query: z.string().describe("The search query to use for web search"),
  }),
  execute: async ({ query }: { query: string }) => {
    console.log("Executing web search with query:", query);

    try {
      // Validate API key exists
      if (
        !process.env.TAVILY_KEY ||
        process.env.TAVILY_KEY === "your_tavily_key_here"
      ) {
        throw new Error(
          "Tavily API key is not configured. Please set TAVILY_KEY environment variable.",
        );
      }

      const client = tavily({ apiKey: process.env.TAVILY_KEY });
      const searchResult = await client.search(query, {
        includeAnswer: true,
        maxResults: 5,
      });

      const result = {
        answer: searchResult.answer,
        links: searchResult.results.map((link) => ({
          title: link.title,
          url: link.url,
          content: link.content,
        })),
      };

      console.log("Web Search Tool with result", result);
      return result;
    } catch (error) {
      console.error("Error performing web search:", error);
      throw new Error(
        `Failed to perform web search: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
};
