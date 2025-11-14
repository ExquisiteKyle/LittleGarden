export interface AppState {
  currentPage?: string;
  actions?: string[];
  featuresUsed?: string[];
}

export interface ToolResult {
  action: string;
  target?: string;
  data?: any;
}

export enum ToolName {
  CHECK_USER_PROGRESS = 'check_user_progress',
  CHECK_GAME_STATE = 'check_game_state',
  HIGHLIGHT_UI_ELEMENT = 'highlight_ui_element',
  CHECK_APP_STATE = 'check_app_state',
  HIGHLIGHT_TILE = 'highlight_tile',
  SET_OBJECTIVE = 'set_objective',
  UNLOCK_ABILITY = 'unlock_ability'
}

export enum ToolAction {
  CHECK_PROGRESS = 'check_progress',
  HIGHLIGHT = 'highlight',
  CHECK_STATE = 'check_state',
  CHECK_GAME_STATE = 'check_game_state',
  HIGHLIGHT_TILE = 'highlight_tile',
  SET_OBJECTIVE = 'set_objective',
  UNLOCK_ABILITY = 'unlock_ability'
}

export interface UserProgress {
  featuresLearned: string[];
  featuresMastered: string[];
  struggles: string[];
  preferences?: {
    pace?: 'slow' | 'normal' | 'fast';
    style?: string;
  };
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentResponse {
  message: string;
  toolCalls?: Array<{
    tool: string;
    action: string;
    target?: string;
    data?: any;
  }>;
  reasoning?: string;
}

export interface TeachingPlan {
  nextFeature?: string;
  reason?: string;
  adaptPace?: boolean;
  strategy?: string;
}

