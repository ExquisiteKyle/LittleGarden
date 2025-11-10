import { UserProgress, ConversationMessage } from './types';

export class Memory {
  private userProgress: Map<string, UserProgress>;
  private conversationHistory: Map<string, ConversationMessage[]>;

  constructor() {
    this.userProgress = new Map();
    this.conversationHistory = new Map();
  }

  getUserProgress = (userId: string): UserProgress => {
    if (!this.userProgress.has(userId)) {
      this.userProgress.set(userId, {
        featuresLearned: [],
        featuresMastered: [],
        struggles: []
      });
    }
    return this.userProgress.get(userId)!;
  }

  getUserHistory = (userId: string): UserProgress => this.getUserProgress(userId);

  getConversationHistory = (userId: string): ConversationMessage[] => {
    if (!this.conversationHistory.has(userId)) {
      this.conversationHistory.set(userId, []);
    }
    return this.conversationHistory.get(userId)!;
  }

  addToHistory = (userId: string, userMessage: string, assistantMessage: string): void => {
    const history = this.getConversationHistory(userId);
    history.push({ role: 'user', content: userMessage });
    history.push({ role: 'assistant', content: assistantMessage });
    
    if (history.length <= 10) return;
    history.splice(0, history.length - 10);
  }

  markFeatureLearned = (userId: string, feature: string): void => {
    const progress = this.getUserProgress(userId);
    if (progress.featuresLearned.includes(feature)) return;
    progress.featuresLearned.push(feature);
  }

  markFeatureMastered = (userId: string, feature: string): void => {
    this.markFeatureLearned(userId, feature);
    const progress = this.getUserProgress(userId);
    if (progress.featuresMastered.includes(feature)) return;
    progress.featuresMastered.push(feature);
  }

  recordStruggle = (userId: string, feature: string): void => {
    const progress = this.getUserProgress(userId);
    if (progress.struggles.includes(feature)) return;
    progress.struggles.push(feature);
  }
}

