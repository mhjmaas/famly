import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import {
  createAgentUIStreamResponse,
  stepCountIs,
  ToolLoopAgent,
  type UIMessage,
} from "ai";
import { NextResponse } from "next/server";
import { getAiInstructions } from "@/lib/ai-instructions";
import { ApiError, getFamilySettings, getMe } from "@/lib/api-client";
import { getCookieHeader } from "@/lib/server-cookies";
import {
  cancelClaimTool,
  checkContributionGoalTool,
  claimRewardTool,
  completeTaskTool,
  createContributionGoalTool,
  createMultipleTasksTool,
  createTaskTool,
  currentDateTimeTool,
  deductContributionGoalTool,
  deleteMultipleTasksTool,
  deleteTaskTool,
  familyMembersTool,
  getClaimsTool,
  karmaBalanceTool,
  listFavouriteRewardsTool,
  listRewardsTool,
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

export async function POST(req: Request) {
  const {
    messages,
    data,
  }: { messages: UIMessage[]; data?: { webSearch?: boolean } } =
    await req.json();
  const webSearchEnabled = data?.webSearch ?? false;
  try {
    // Get cookie header for authentication (same method DAL uses)
    const cookieHeader = await getCookieHeader();

    // Get user info to extract familyId
    const meResponse = await getMe(cookieHeader);
    const familyId = meResponse.user.families?.[0]?.familyId;

    if (!familyId) {
      return NextResponse.json({ error: "No family found" }, { status: 400 });
    }

    // Get family settings including AI settings
    const settings = await getFamilySettings(familyId, cookieHeader);
    const name = meResponse.user.name;
    const language = meResponse.user.language || "en";

    console.log(`User: ${name}, Language: ${language}`);

    // Console.log the AI name
    console.log("AI Name:", settings.aiSettings.aiName);

    const lmstudio = createOpenAICompatible({
      name: "lmstudio",
      baseURL: settings.aiSettings.apiEndpoint,
    });

    const instructions = getAiInstructions({
      aiName: settings.aiSettings.aiName,
      language: LANGUAGE_MAP[language] || "English",
      userName: name,
      familyId,
    });

    // Base tools always available
    const tools: Record<string, any> = {
      familyMembersTool: familyMembersTool,
      currentDateTimeTool: currentDateTimeTool,
      karmaBalanceTool: karmaBalanceTool,
      modifyKarmaTool: modifyKarmaTool,
      checkContributionGoalTool: checkContributionGoalTool,
      deductContributionGoalTool: deductContributionGoalTool,
      createContributionGoalTool: createContributionGoalTool,
      listRewardsTool: listRewardsTool,
      listFavouriteRewardsTool: listFavouriteRewardsTool,
      claimRewardTool: claimRewardTool,
      getClaimsTool: getClaimsTool,
      cancelClaimTool: cancelClaimTool,
      listTasksTool: listTasksTool,
      createTaskTool: createTaskTool,
      createMultipleTasksTool: createMultipleTasksTool,
      updateTaskTool: updateTaskTool,
      completeTaskTool: completeTaskTool,
      deleteTaskTool: deleteTaskTool,
      deleteMultipleTasksTool: deleteMultipleTasksTool,
    };

    // Conditionally add web search tool if enabled
    if (webSearchEnabled) {
      tools.webSearchTool = webSearchTool;
      console.log("Web search tool enabled for this request");
    }

    const myAgent = new ToolLoopAgent({
      model: lmstudio(settings.aiSettings.modelName),
      instructions,
      tools,
      stopWhen: stepCountIs(40), // Allow up to 40 steps
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
    // Handle authentication errors with proper HTTP response (not redirect)
    if (error instanceof ApiError && error.isAuthError()) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    console.error("Error fetching AI settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI settings" },
      { status: 500 },
    );
  }
}
