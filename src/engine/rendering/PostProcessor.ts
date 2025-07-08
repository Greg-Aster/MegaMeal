// Post-processing pipeline as specified in plan

import { EffectComposer, RenderPass, BloomEffect, SSAOEffect, FXAAEffect, EffectPass } from 'postprocessing';
import * as THREE from 'three';

export class PostProcessor {
  private composer: EffectComposer;
  private bloomEffect: BloomEffect;
  private ssaoEffect: SSAOEffect;
  private fxaaEffect: FXAAEffect;
  
  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.composer = new EffectComposer(renderer);
    
    // Base render pass
    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);
    
    // Effects
    this.bloomEffect = new BloomEffect({ intensity: 0.5, luminanceThreshold: 0.9 });
    this.ssaoEffect = new SSAOEffect(camera, scene, { intensity: 0.5 });
    this.fxaaEffect = new FXAAEffect();
    
    const effectPass = new EffectPass(camera, this.bloomEffect, this.fxaaEffect);
    this.composer.addPass(effectPass);
  }
  
  public render(): void {
    this.composer.render();
  }
  
  public setSize(width: number, height: number): void {
    this.composer.setSize(width, height);
  }
  
  public dispose(): void {
    this.composer.dispose();
  }
}