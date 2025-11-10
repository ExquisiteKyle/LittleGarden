import { AppState, UserProgress, TeachingPlan } from './types';

export class Planning {
  private tutorialSequence = [
    'rpg-move',
    'rpg-talk',
    'rpg-loot',
    'rpg-strike'
  ];

  planNextStep = (userProgress: UserProgress, appState: AppState): TeachingPlan => {
    const game: any = (appState as any)?.game || {};
    const moved = Array.isArray(appState.actions) && appState.actions.some(a => a.startsWith('move_'));
    const talked = !!game.talkedToMentor;
    const chestOpened = !!game.chestOpened;
    const enemyHP = typeof game.enemyHP === 'number' ? game.enemyHP : 0;

    if (!moved) {
      return { nextFeature: 'rpg-move', reason: 'Start with basic movement', adaptPace: false };
    }
    if (!talked) {
      return { nextFeature: 'rpg-talk', reason: 'Introduce NPC interaction', adaptPace: false };
    }
    if (!chestOpened) {
      return { nextFeature: 'rpg-loot', reason: 'Teach looting and inventory basics', adaptPace: false };
    }
    if (enemyHP > 0) {
      return { nextFeature: 'rpg-strike', reason: 'Practice striking the target dummy', adaptPace: false };
    }

    return { nextFeature: undefined, reason: 'Tutorial loop complete. Offer tips or recap.', adaptPace: false };
  }
}

