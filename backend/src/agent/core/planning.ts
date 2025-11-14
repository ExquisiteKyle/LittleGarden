import { AppState, UserProgress, TeachingPlan } from './types';

export class Planning {
  // Analyze player state and provide context - let AI make decisions
  analyzePlayerState = (userProgress: UserProgress, appState: AppState): {
    gameState: {
      abilities: any;
      inventory: any[];
      npcs: any[];
      hasMoved: boolean;
      talkedToNPCs: boolean;
      hasKey: boolean;
      hasSword: boolean;
      chestOpened: boolean;
      enemyHP: number;
      enemyDefeated: boolean;
    };
    learningProgress: {
      featuresLearned: string[];
      featuresMastered: string[];
      struggles: string[];
      pace: 'slow' | 'normal' | 'fast';
    };
    tutorialSequence: string[];
  } => {
    const game: any = (appState as any)?.game || {};
    const abilities = game.abilities || {};
    const inventory = game.inventory || [];
    const npcs = game.npcs || [];
    
    // Extract state information (no decisions, just facts)
    const hasMoved = Array.isArray(appState.actions) && appState.actions.some(a => a.startsWith('move_'));
    const talkedToNPCs = npcs.some((npc: any) => npc.talked);
    const hasKey = inventory.some((item: any) => item.type === 'key');
    const hasSword = inventory.some((item: any) => item.type === 'sword');
    const chestOpened = !!game.chestOpened;
    const enemyHP = typeof game.enemyHP === 'number' ? game.enemyHP : 0;
    const enemyDefeated = !!game.enemyDefeated;

    // Calculate learning pace (simple metric, not a decision)
    const history = userProgress.featuresLearned.length;
    const struggles = userProgress.struggles.length;
    let pace: 'slow' | 'normal' | 'fast' = 'normal';
    if (struggles > history * 0.5) pace = 'slow';
    else if (struggles === 0 && history > 2) pace = 'fast';

    return {
      gameState: {
        abilities,
        inventory,
        npcs,
        hasMoved,
        talkedToNPCs,
        hasKey,
        hasSword,
        chestOpened,
        enemyHP,
        enemyDefeated
      },
      learningProgress: {
        featuresLearned: userProgress.featuresLearned,
        featuresMastered: userProgress.featuresMastered,
        struggles: userProgress.struggles,
        pace
      },
      tutorialSequence: ['rpg-move', 'rpg-talk', 'rpg-loot', 'rpg-strike']
    };
  }

  // Legacy method for backward compatibility - now just returns context
  planNextStep = (userProgress: UserProgress, appState: AppState): TeachingPlan => {
    const analysis = this.analyzePlayerState(userProgress, appState);
    
    // Return minimal plan - AI will make the actual decisions
    return {
      nextFeature: undefined, // Let AI decide
      reason: 'AI will analyze current state and determine next steps',
      adaptPace: analysis.learningProgress.pace === 'slow',
      strategy: 'Use game state analysis to make intelligent teaching decisions'
    };
  }
}

