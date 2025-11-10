export interface TutorialFeature {
  id: string;
  name: string;
  description: string;
  steps: string[];
  tips: string[];
  commonMistakes: string[];
}

export class TutorialDatabase {
  private features: Map<string, TutorialFeature>;

  constructor() {
    this.features = new Map();
    this.initializeFeatures();
  }

  private initializeFeatures() {
    // This will be populated with actual tutorial content
    // For MVP, we'll add features as we build the demo app
    this.features.set('navigation', {
      id: 'navigation',
      name: 'Navigation',
      description: 'Learn how to navigate the application',
      steps: [
        'Understand the main menu',
        'Navigate between pages',
        'Use breadcrumbs'
      ],
      tips: [
        'The menu is always accessible',
        'Use keyboard shortcuts for faster navigation'
      ],
      commonMistakes: [
        'Clicking too quickly',
        'Not noticing the current page indicator'
      ]
    });
  }

  getFeature(featureId: string): TutorialFeature | undefined {
    return this.features.get(featureId);
  }

  getAllFeatures(): TutorialFeature[] {
    return Array.from(this.features.values());
  }

  addFeature(feature: TutorialFeature): void {
    this.features.set(feature.id, feature);
  }
}

