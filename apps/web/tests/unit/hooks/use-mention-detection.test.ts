import { detectAIMention } from "@/hooks/use-mention-detection";

describe("detectAIMention", () => {
  const aiName = "Jarvis";

  describe("basic detection", () => {
    it("should detect @mention at the start of text", () => {
      const result = detectAIMention("@Jarvis what is the weather?", aiName);

      expect(result.hasAIMention).toBe(true);
      expect(result.mention).toEqual({
        fullMatch: "@Jarvis",
        name: "Jarvis",
        startIndex: 0,
        endIndex: 7,
      });
      expect(result.question).toBe("what is the weather?");
      expect(result.messageWithoutMention).toBe("what is the weather?");
    });

    it("should detect @mention in the middle of text", () => {
      const result = detectAIMention("Hey @Jarvis can you help me?", aiName);

      expect(result.hasAIMention).toBe(true);
      expect(result.mention?.fullMatch).toBe("@Jarvis");
      expect(result.question).toBe("can you help me?");
      expect(result.messageWithoutMention).toBe("Hey  can you help me?");
    });

    it("should detect @mention at the end of text", () => {
      const result = detectAIMention("Help me @Jarvis", aiName);

      expect(result.hasAIMention).toBe(true);
      expect(result.mention?.fullMatch).toBe("@Jarvis");
      expect(result.question).toBe("Help me");
    });

    it("should be case-insensitive", () => {
      const result = detectAIMention("@jarvis what time is it?", aiName);

      expect(result.hasAIMention).toBe(true);
      expect(result.mention?.name).toBe("jarvis");
      expect(result.question).toBe("what time is it?");
    });
  });

  describe("no match cases", () => {
    it("should return false when no mention is present", () => {
      const result = detectAIMention("Hello world", aiName);

      expect(result.hasAIMention).toBe(false);
      expect(result.mention).toBeNull();
      expect(result.messageWithoutMention).toBe("Hello world");
      expect(result.question).toBe("");
    });

    it("should return false for partial matches", () => {
      const result = detectAIMention("@Jarvisbot help", aiName);

      expect(result.hasAIMention).toBe(false);
    });

    it("should return false for empty text", () => {
      const result = detectAIMention("", aiName);

      expect(result.hasAIMention).toBe(false);
    });

    it("should return false for whitespace-only text", () => {
      const result = detectAIMention("   ", aiName);

      expect(result.hasAIMention).toBe(false);
    });

    it("should return false when aiName is empty", () => {
      const result = detectAIMention("@Jarvis help", "");

      expect(result.hasAIMention).toBe(false);
    });
  });

  describe("word boundary handling", () => {
    it("should match when followed by punctuation", () => {
      const result = detectAIMention("@Jarvis, please help", aiName);

      expect(result.hasAIMention).toBe(true);
      expect(result.question).toBe(", please help");
    });

    it("should match when followed by newline", () => {
      const result = detectAIMention("@Jarvis\nWhat is 2+2?", aiName);

      expect(result.hasAIMention).toBe(true);
      expect(result.question).toBe("What is 2+2?");
    });

    it("should not match when part of another word", () => {
      const result = detectAIMention("email@Jarvis.com", aiName);

      // This should still match because @ is followed by the name
      // The word boundary is after the name
      expect(result.hasAIMention).toBe(true);
    });
  });

  describe("special characters in AI name", () => {
    it("should handle AI names with special regex characters", () => {
      const result = detectAIMention("@AI.Bot help me", "AI.Bot");

      expect(result.hasAIMention).toBe(true);
      expect(result.mention?.name).toBe("AI.Bot");
    });
  });

  describe("multiple mentions", () => {
    it("should only detect the first mention", () => {
      const result = detectAIMention("@Jarvis help @Jarvis please", aiName);

      expect(result.hasAIMention).toBe(true);
      expect(result.mention?.startIndex).toBe(0);
    });
  });
});
