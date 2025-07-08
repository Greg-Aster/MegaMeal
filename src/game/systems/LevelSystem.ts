// Level loading and management system

export interface LevelConfig {
  id: string;
  name: string;
  environment: {
    skybox?: string;
    fog?: { color: string; density: number };
  };
  entities: any[];
  physics?: {
    gravity: [number, number, number];
  };
}

export class LevelSystem {
  private currentLevel: LevelConfig | null = null;
  
  public async loadLevel(config: LevelConfig): Promise<void> {
    this.currentLevel = config;
    console.log(`Loading level: ${config.name}`);
  }
  
  public getCurrentLevel(): LevelConfig | null {
    return this.currentLevel;
  }
  
  public dispose(): void {
    this.currentLevel = null;
  }
}