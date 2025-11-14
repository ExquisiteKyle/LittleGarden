import * as fs from 'fs';
import * as path from 'path';
import { AppState, ToolResult, ToolName, ToolAction } from './types';

const loadTranslations = () => {
  try {
    const translationsPath = path.join(process.cwd(), 'src/translations/en.json');
    return JSON.parse(fs.readFileSync(translationsPath, 'utf-8'));
  } catch (error) {
    console.error('Failed to load translations from en.json:', error);
    throw new Error('Translations file is required. Please ensure src/translations/en.json exists.');
  }
};

const translations = loadTranslations();

export class ToolUse {
  getToolDefinitions = () => [
      {
        name: ToolName.CHECK_USER_PROGRESS,
        description: translations.TOOL_DESCRIPTIONS.CHECK_USER_PROGRESS,
        parameters: {
          type: 'object',
          properties: {
            feature: {
              type: 'string',
              description: translations.TOOL_PARAM_DESCRIPTIONS.FEATURE
            }
          }
        }
      },
      {
        name: ToolName.CHECK_GAME_STATE,
        description: translations.TOOL_DESCRIPTIONS.CHECK_GAME_STATE,
        parameters: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              description: translations.TOOL_PARAM_DESCRIPTIONS.KEY
            }
          },
          required: ['key']
        }
      },
      {
        name: ToolName.HIGHLIGHT_UI_ELEMENT,
        description: translations.TOOL_DESCRIPTIONS.HIGHLIGHT_UI_ELEMENT,
        parameters: {
          type: 'object',
          properties: {
            elementId: {
              type: 'string',
              description: translations.TOOL_PARAM_DESCRIPTIONS.ELEMENT_ID
            },
            message: {
              type: 'string',
              description: translations.TOOL_PARAM_DESCRIPTIONS.MESSAGE
            }
          },
          required: ['elementId']
        }
      },
      {
        name: ToolName.CHECK_APP_STATE,
        description: translations.TOOL_DESCRIPTIONS.CHECK_APP_STATE,
        parameters: {
          type: 'object',
          properties: {
            checkType: {
              type: 'string',
              enum: ['currentPage', 'actions', 'featuresUsed'],
              description: translations.TOOL_PARAM_DESCRIPTIONS.CHECK_TYPE
            }
          }
        }
      },
      {
        name: ToolName.HIGHLIGHT_TILE,
        description: translations.TOOL_DESCRIPTIONS.HIGHLIGHT_TILE,
        parameters: {
          type: 'object',
          properties: {
            x: { type: 'number', description: translations.TOOL_PARAM_DESCRIPTIONS.TILE_X },
            y: { type: 'number', description: translations.TOOL_PARAM_DESCRIPTIONS.TILE_Y }
          },
          required: ['x', 'y']
        }
      },
      {
        name: ToolName.SET_OBJECTIVE,
        description: translations.TOOL_DESCRIPTIONS.SET_OBJECTIVE,
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'string', description: translations.TOOL_PARAM_DESCRIPTIONS.OBJECTIVE_ID }
          },
          required: ['id']
        }
      },
      {
        name: ToolName.UNLOCK_ABILITY,
        description: translations.TOOL_DESCRIPTIONS.UNLOCK_ABILITY,
        parameters: {
          type: 'object',
          properties: {
            canInteract: { type: 'boolean', description: translations.TOOL_PARAM_DESCRIPTIONS.CAN_INTERACT },
            canCollect: { type: 'boolean', description: translations.TOOL_PARAM_DESCRIPTIONS.CAN_COLLECT },
            canOpenChest: { type: 'boolean', description: translations.TOOL_PARAM_DESCRIPTIONS.CAN_OPEN_CHEST },
            canFight: { type: 'boolean', description: translations.TOOL_PARAM_DESCRIPTIONS.CAN_FIGHT }
          }
        }
      }
    ];

  executeTool = async (
    toolName: string,
    args: any,
    appState: AppState
  ): Promise<ToolResult> => {
    if (toolName === ToolName.CHECK_USER_PROGRESS) {
      return {
        action: ToolAction.CHECK_PROGRESS,
        data: {
          feature: args.feature,
          used: appState.featuresUsed?.includes(args.feature) || false
        }
      };
    }

    if (toolName === ToolName.HIGHLIGHT_UI_ELEMENT) {
      return {
        action: ToolAction.HIGHLIGHT,
        target: args.elementId,
        data: {
          message: args.message
        }
      };
    }

    if (toolName === ToolName.CHECK_APP_STATE) {
      return {
        action: ToolAction.CHECK_STATE,
        data: {
          type: args.checkType,
          value: appState[args.checkType as keyof AppState]
        }
      };
    }

    if (toolName === ToolName.CHECK_GAME_STATE) {
      const value = (appState as any)?.game?.[args.key];
      return { action: ToolAction.CHECK_GAME_STATE, data: { key: args.key, value } };
    }

    if (toolName === ToolName.HIGHLIGHT_TILE) {
      return { action: ToolAction.HIGHLIGHT_TILE, data: { x: args.x, y: args.y } };
    }

    if (toolName === ToolName.SET_OBJECTIVE) {
      return { action: ToolAction.SET_OBJECTIVE, data: { id: args.id } };
    }

    if (toolName === ToolName.UNLOCK_ABILITY) {
      return { 
        action: ToolAction.UNLOCK_ABILITY, 
        data: { 
          canInteract: args.canInteract,
          canCollect: args.canCollect,
          canOpenChest: args.canOpenChest,
          canFight: args.canFight
        } 
      };
    }

    throw new Error(`Unknown tool: ${toolName}`);
  }
}

