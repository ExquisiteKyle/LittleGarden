import OpenAI from 'openai';
import { Memory } from './memory';
import { ToolUse } from './tools';
import { Planning } from './planning';
import { AppState, AgentResponse, ToolName } from './types';
import { buildSystemPrompt } from './prompts';

export class TutorialAgent {
  private openai: OpenAI;
  private memory: Memory;
  private tools: ToolUse;
  private planning: Planning;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }
    
    this.openai = new OpenAI({ apiKey });
    this.memory = new Memory();
    this.tools = new ToolUse();
    this.planning = new Planning();
  }

  async processMessage(
    message: string,
    userId: string,
    appState: AppState
  ): Promise<AgentResponse> {
    const context = this.prepareContext(userId, appState);
    const response = await this.callLLM(message, context);
    const { toolCalls, finalMessage } = await this.processToolCalls(
      response,
      message,
      context,
      userId,
      appState
    );
    
    this.memory.addToHistory(userId, message, finalMessage);
    const reasoning = this.extractReasoning(finalMessage);

    return { message: finalMessage, toolCalls, reasoning };
  }

  private prepareContext = (userId: string, appState: AppState) => {
    const userProgress = this.memory.getUserProgress(userId);
    const teachingPlan = this.planning.planNextStep(userProgress, appState);
    const systemPrompt = buildSystemPrompt(teachingPlan, userProgress);
    const conversationHistory = this.memory.getConversationHistory(userId);
    
    return { systemPrompt, conversationHistory, userProgress };
  }

  private callLLM = async (message: string, context: any) => {
    const toolDefinitions = this.tools.getToolDefinitions();
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: context.systemPrompt },
        ...context.conversationHistory,
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      tools: toolDefinitions.map(tool => ({
        type: 'function' as const,
        function: tool
      })),
      tool_choice: 'auto'
    });

    return completion.choices[0].message;
  }

  private processToolCalls = async (
    response: any,
    message: string,
    context: any,
    userId: string,
    appState: AppState
  ) => {
    if (!response.tool_calls?.length) {
      return { toolCalls: [], finalMessage: response.content || '' };
    }

    const toolCalls: Array<{ tool: string; action: string; target?: string }> = [];
    const toolMessages: any[] = [];

    for (const toolCall of response.tool_calls) {
      const toolName = toolCall.function.name;
      const toolArgs = JSON.parse(toolCall.function.arguments || '{}');
      const toolResult = await this.tools.executeTool(toolName, toolArgs, appState);

      toolCalls.push({
        tool: toolName,
        action: toolResult.action,
        target: toolResult.target
      });

      if (toolName === ToolName.CHECK_USER_PROGRESS && toolArgs.feature) {
        this.memory.markFeatureLearned(userId, toolArgs.feature);
      }

      toolMessages.push({
        role: 'tool' as const,
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolResult)
      });
    }

    const followUpCompletion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: context.systemPrompt },
        ...context.conversationHistory,
        { role: 'user', content: message },
        response,
        ...toolMessages
      ],
      temperature: 0.7
    });

    return {
      toolCalls,
      finalMessage: followUpCompletion.choices[0].message.content || ''
    };
  }


  private extractReasoning = (content: string): string | undefined => 
    content.match(/Reasoning: (.+?)(?:\n|$)/i)?.[1];

  getUserProgress = (userId: string) => this.memory.getUserProgress(userId);
}

