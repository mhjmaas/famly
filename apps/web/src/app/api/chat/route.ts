import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import {
  createAgentUIStreamResponse,
  type LanguageModel,
  stepCountIs,
  type Tool,
  ToolLoopAgent,
  type UIMessage,
} from "ai";
import { createOllama } from "ai-sdk-ollama";
import { NextResponse } from "next/server";
import { getAiInstructions } from "@/lib/ai-instructions";
import { ApiError, getFamilySettings, getMe } from "@/lib/api-client";
import { getCookieHeader } from "@/lib/server-cookies";
import {
  addMultipleShoppingListItemsTool,
  addShoppingListItemTool,
  cancelClaimTool,
  checkContributionGoalTool,
  checkShoppingListItemTool,
  claimRewardTool,
  completeTaskTool,
  createContributionGoalTool,
  createMultipleTasksTool,
  createShoppingListTool,
  createTaskTool,
  currentDateTimeTool,
  deductContributionGoalTool,
  deleteMultipleTasksTool,
  deleteShoppingListTool,
  deleteTaskTool,
  familyMembersTool,
  getClaimsTool,
  karmaBalanceTool,
  listFavouriteRewardsTool,
  listRewardsTool,
  listShoppingListsTool,
  listTasksTool,
  modifyKarmaTool,
  updateTaskTool,
} from "@/lib/tools";
import { webSearchTool } from "@/lib/tools/web-search.tool";

// Language mapping enum
const LANGUAGE_MAP: Record<string, string> = {
  "nl-NL": "Dutch",
  "en-US": "English",
};

function buildTools(webSearchEnabled: boolean): Record<string, Tool> {
  const tools: Record<string, Tool> = {
    familyMembersTool,
    currentDateTimeTool,
    karmaBalanceTool,
    modifyKarmaTool,
    checkContributionGoalTool,
    deductContributionGoalTool,
    createContributionGoalTool,
    listRewardsTool,
    listFavouriteRewardsTool,
    claimRewardTool,
    getClaimsTool,
    cancelClaimTool,
    listTasksTool,
    createTaskTool,
    createMultipleTasksTool,
    updateTaskTool,
    completeTaskTool,
    deleteTaskTool,
    deleteMultipleTasksTool,
    listShoppingListsTool,
    createShoppingListTool,
    addShoppingListItemTool,
    addMultipleShoppingListItemsTool,
    checkShoppingListItemTool,
    deleteShoppingListTool,
  };

  if (webSearchEnabled) {
    tools.webSearchTool = webSearchTool;
  }

  return tools;
}

function createModel(
  provider: string,
  modelName: string,
  apiEndpoint: string,
): LanguageModel {
  const lmStudioProvider = createOpenAICompatible({
    name: "lmstudio",
    baseURL: apiEndpoint,
  });

  const ollamaProvider = createOllama({
    baseURL: apiEndpoint,
  });

  switch (provider) {
    case "LM Studio":
      return lmStudioProvider(modelName);
    case "Ollama":
      return ollamaProvider(modelName);
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

async function getUserContext(cookieHeader: string) {
  const meResponse = await getMe(cookieHeader);
  const familyId = meResponse.user.families?.[0]?.familyId;

  if (!familyId) {
    throw new Error("No family found");
  }

  const settings = await getFamilySettings(familyId, cookieHeader);
  const language = meResponse.user.language || "en";

  const instructions = getAiInstructions({
    aiName: settings.aiSettings.aiName,
    language: LANGUAGE_MAP[language] || "English",
    userName: meResponse.user.name,
    familyId,
  });

  return { settings, instructions };
}

export async function POST(req: Request) {
  const {
    messages,
    data,
  }: { messages: UIMessage[]; data?: { webSearch?: boolean } } =
    await req.json();
  const webSearchEnabled = data?.webSearch ?? false;

  try {
    const cookieHeader = await getCookieHeader();
    const { settings, instructions } = await getUserContext(cookieHeader);

    const tools = buildTools(webSearchEnabled);
    const model = createModel(
      settings.aiSettings.provider,
      settings.aiSettings.modelName,
      settings.aiSettings.apiEndpoint,
    );

    const myAgent = new ToolLoopAgent({
      model,
      instructions,
      tools,
      stopWhen: stepCountIs(40),
      providerOptions: {
        openai: {
          reasoningEffort: "high",
        },
      },
    });

    return createAgentUIStreamResponse({
      agent: myAgent,
      messages,
      sendReasoning: false,
    });
  } catch (error) {
    if (error instanceof ApiError && error.isAuthError()) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    if (error instanceof Error && error.message === "No family found") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Error fetching AI settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI settings" },
      { status: 500 },
    );
  }
}
