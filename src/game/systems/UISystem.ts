// UI management system

export class UISystem {
  private activeUI = new Set<string>();
  
  public showUI(id: string): void {
    this.activeUI.add(id);
  }
  
  public hideUI(id: string): void {
    this.activeUI.delete(id);
  }
  
  public isUIActive(id: string): boolean {
    return this.activeUI.has(id);
  }
  
  public dispose(): void {
    this.activeUI.clear();
  }
}