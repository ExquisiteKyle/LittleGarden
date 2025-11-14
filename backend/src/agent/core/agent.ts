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
    // Analyze message type for proactive behavior
    const messageType = this.analyzeMessageType(message);
    const userProgress = this.memory.getUserProgress(userId);
    
    // Proactive analysis: if this is a game event, log state analysis for debugging
    if (messageType === 'game_event') {
      const analysis = this.planning.analyzePlayerState(userProgress, appState);
      console.log('[AGENT] Game event detected - state analysis:', {
        gameState: analysis.gameState,
        learningProgress: analysis.learningProgress
      });
    }

    const context = this.prepareContext(userId, appState);
    const response = await this.callLLM(message, context);
    const { toolCalls, finalMessage } = await this.processToolCalls(
      response,
      message,
      context,
      userId,
      appState
    );
    
    // Enhanced memory: track learning patterns
    this.updateMemoryFromResponse(userId, message, finalMessage, toolCalls, appState);
    const { reasoning, cleanMessage } = this.extractReasoning(finalMessage);

    console.log('[DEBUG] Agent returning message:', cleanMessage);
    console.log('[DEBUG] Agent returning toolCalls:', toolCalls);
    console.log('[DEBUG] Agent reasoning:', reasoning);

    return { message: cleanMessage, toolCalls, reasoning };
  }

  private analyzeMessageType = (message: string): 'user_query' | 'game_event' | 'idle' | 'talk' => {
    if (message.startsWith('[QUEST_COMPLETE]')) return 'game_event';
    if (message.startsWith('[GAME_EVENT]')) return 'game_event';
    if (message.startsWith('[IDLE]')) return 'idle';
    if (message.startsWith('[TALK]')) return 'talk';
    return 'user_query';
  }

  private updateMemoryFromResponse = (
    userId: string,
    userMessage: string,
    assistantMessage: string,
    toolCalls: Array<{ tool: string; action: string; target?: string; data?: any }>,
    appState: AppState
  ): void => {
    // Add to conversation history
    this.memory.addToHistory(userId, userMessage, assistantMessage);

    // Analyze tool calls to track learning
    const unlockCalls = toolCalls.filter(tc => tc.tool === 'unlock_ability');
    if (unlockCalls.length > 0) {
      // Player unlocked a new ability - mark as learned
      const game: any = (appState as any)?.game || {};
      const abilities = game.abilities || {};
      
      if (unlockCalls[0].data?.canInteract && !abilities.canInteract) {
        this.memory.markFeatureLearned(userId, 'rpg-talk');
      }
      if (unlockCalls[0].data?.canCollect && !abilities.canCollect) {
        this.memory.markFeatureLearned(userId, 'rpg-loot');
      }
      if (unlockCalls[0].data?.canOpenChest && !abilities.canOpenChest) {
        this.memory.markFeatureLearned(userId, 'rpg-loot');
      }
      if (unlockCalls[0].data?.canFight && !abilities.canFight) {
        this.memory.markFeatureLearned(userId, 'rpg-strike');
      }
    }

    // Detect struggles: if player asks same question multiple times or agent provides hints repeatedly
    const history = this.memory.getConversationHistory(userId);
    const recentHints = history
      .filter((msg, idx) => idx >= history.length - 6 && msg.role === 'assistant')
      .filter(msg => msg.content.toLowerCase().includes('hint') || msg.content.toLowerCase().includes('try'))
      .length;
    
    if (recentHints >= 3) {
      // Player struggling - identify which feature
      const currentPlan = this.planning.planNextStep(
        this.memory.getUserProgress(userId),
        appState
      );
      if (currentPlan.nextFeature) {
        this.memory.recordStruggle(userId, currentPlan.nextFeature);
      }
    }
  }

  private prepareContext = (userId: string, appState: AppState) => {
    const userProgress = this.memory.getUserProgress(userId);
    const stateAnalysis = this.planning.analyzePlayerState(userProgress, appState);
    const teachingPlan = this.planning.planNextStep(userProgress, appState);
    
    // Attach state analysis to teaching plan so prompts can use it
    (teachingPlan as any).stateAnalysis = stateAnalysis;
    
    const systemPrompt = buildSystemPrompt(teachingPlan, userProgress);
    const conversationHistory = this.memory.getConversationHistory(userId);
    
    return { systemPrompt, conversationHistory, userProgress };
  }

  private callLLM = async (message: string, context: any) => {
    const toolDefinitions = this.tools.getToolDefinitions();
    const messageType = this.analyzeMessageType(message);
    
    // For [GAME_EVENT] messages, REQUIRE tool usage - the model must call at least one tool
    const toolChoice = messageType === 'game_event' ? 'required' : 'auto';
    
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
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
      tool_choice: toolChoice
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

    console.log('[DEBUG] Initial tool calls from first completion:', response.tool_calls.map((tc: any) => tc.function.name));

    const toolCalls: Array<{ tool: string; action: string; target?: string; data?: any }> = [];
    const toolMessages: any[] = [];

    for (const toolCall of response.tool_calls) {
      const toolName = toolCall.function.name;
      const toolArgs = JSON.parse(toolCall.function.arguments || '{}');
      const toolResult = await this.tools.executeTool(toolName, toolArgs, appState);

      console.log(`[DEBUG] Tool executed: ${toolName}`, toolResult);

      toolCalls.push({
        tool: toolName,
        action: toolResult.action,
        target: toolResult.target,
        data: toolResult.data
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

    const toolDefinitions = this.tools.getToolDefinitions();
    
    console.log('[DEBUG] Making follow-up completion after tool execution...');
    const followUpCompletion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: context.systemPrompt },
        ...context.conversationHistory,
        { role: 'user', content: message },
        response,
        ...toolMessages
      ],
      temperature: 0.7,
      tools: toolDefinitions.map(tool => ({
        type: 'function' as const,
        function: tool
      }))
    });

    console.log('[DEBUG] Follow-up completion response:', JSON.stringify(followUpCompletion.choices[0].message, null, 2));
    let finalMessage = followUpCompletion.choices[0].message.content || '';
    
    // Check if follow-up also made tool calls
    if (followUpCompletion.choices[0].message.tool_calls?.length) {
      console.log('[DEBUG] Follow-up made additional tool calls:', followUpCompletion.choices[0].message.tool_calls.length);
      
      const followUpToolMessages: any[] = [];
      
      for (const toolCall of followUpCompletion.choices[0].message.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments || '{}');
        const toolResult = await this.tools.executeTool(toolName, toolArgs, appState);

        console.log(`[DEBUG] Follow-up tool executed: ${toolName}`, toolResult);

        toolCalls.push({
          tool: toolName,
          action: toolResult.action,
          target: toolResult.target,
          data: toolResult.data
        });
        
        followUpToolMessages.push({
          role: 'tool' as const,
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult)
        });
      }
      
      // Make another call to get the final message after tool execution
      const finalCompletion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: context.systemPrompt },
          ...context.conversationHistory,
          { role: 'user', content: message },
          response,
          ...toolMessages,
          followUpCompletion.choices[0].message,
          ...followUpToolMessages
        ],
        temperature: 0.7
      });
      
      finalMessage = finalCompletion.choices[0].message.content || '';
      console.log('[DEBUG] Final message after follow-up tools:', finalMessage);
    }

    return {
      toolCalls,
      finalMessage
    };
  }


  private extractReasoning = (content: string): { reasoning?: string; cleanMessage: string } => {
    const reasoningMatch = content.match(/Reasoning:\s*(.+?)(?:\n\n|\n|$)/i);
    const reasoning = reasoningMatch?.[1]?.trim();
    
    // Remove reasoning from the message so player only sees clean text
    const cleanMessage = content
      .replace(/Reasoning:\s*.+?(?:\n\n|\n|$)/i, '')
      .trim();
    
    return { reasoning, cleanMessage };
  };

  getUserProgress = (userId: string) => this.memory.getUserProgress(userId);
}

