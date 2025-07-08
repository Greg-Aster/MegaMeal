// Game logic system

export class GameplaySystem {
  private score = 0;
  private timeElapsed = 0;
  
  public update(deltaTime: number): void {
    this.timeElapsed += deltaTime;
  }
  
  public addScore(points: number): void {
    this.score += points;
  }
  
  public getScore(): number {
    return this.score;
  }
  
  public getTimeElapsed(): number {
    return this.timeElapsed;
  }
  
  public reset(): void {
    this.score = 0;
    this.timeElapsed = 0;
  }
}