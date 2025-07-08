// Entity/component system

export interface Entity {
  id: string;
  components: Map<string, any>;
}

export class EntitySystem {
  private entities = new Map<string, Entity>();
  
  public createEntity(id: string): Entity {
    const entity: Entity = {
      id,
      components: new Map()
    };
    this.entities.set(id, entity);
    return entity;
  }
  
  public getEntity(id: string): Entity | undefined {
    return this.entities.get(id);
  }
  
  public removeEntity(id: string): void {
    this.entities.delete(id);
  }
  
  public addComponent(entityId: string, componentName: string, component: any): void {
    const entity = this.entities.get(entityId);
    if (entity) {
      entity.components.set(componentName, component);
    }
  }
  
  public dispose(): void {
    this.entities.clear();
  }
}