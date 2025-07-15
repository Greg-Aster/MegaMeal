import { GameState } from './GameState';
import type { GameStats, GameSettings } from './GameState';
import type { GameAction } from './GameActions';

/**
 * Comprehensive state validation system
 * Ensures game state integrity and consistency
 */

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  field: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
}

export interface ValidationWarning {
  code: string;
  message: string;
  field: string;
  suggestion: string;
}

export interface ValidationRule {
  name: string;
  description: string;
  validate: (state: GameState) => ValidationResult;
  autoFix?: (state: GameState) => GameState;
}

export class StateValidator {
  private rules: Map<string, ValidationRule> = new Map();
  private validationHistory: ValidationResult[] = [];
  private maxHistorySize = 50;
  
  constructor() {
    this.initializeDefaultRules();
  }
  
  /**
   * Validate the complete game state
   */
  public validateState(state: GameState): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };
    
    // Run all validation rules
    for (const rule of this.rules.values()) {
      const ruleResult = rule.validate(state);
      
      result.errors.push(...ruleResult.errors);
      result.warnings.push(...ruleResult.warnings);
      
      if (!ruleResult.isValid) {
        result.isValid = false;
      }
    }
    
    // Add to history
    this.addToHistory(result);
    
    return result;
  }
  
  /**
   * Validate a specific action before it's applied
   */
  public validateAction(action: GameAction, currentState: GameState): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };
    
    // Action-specific validation
    switch (action.type) {
      case 'LEVEL_TRANSITION_START':
        return this.validateLevelTransition(action, currentState);
      
      case 'STAR_SELECTED':
        return this.validateStarSelection(action, currentState);
      
      case 'STATS_UPDATE':
        return this.validateStatsUpdate(action, currentState);
      
      case 'SETTINGS_UPDATE':
        return this.validateSettingsUpdate(action, currentState);
      
      default:
        // Generic action validation
        return this.validateGenericAction(action, currentState);
    }
  }
  
  /**
   * Attempt to auto-fix validation errors
   */
  public autoFixState(state: GameState): GameState {
    let fixedState = state.clone();
    
    for (const rule of this.rules.values()) {
      if (rule.autoFix) {
        const validationResult = rule.validate(fixedState);
        if (!validationResult.isValid) {
          try {
            fixedState = rule.autoFix(fixedState);
            console.log(`✅ Auto-fixed state using rule: ${rule.name}`);
          } catch (error) {
            console.warn(`⚠️ Auto-fix failed for rule ${rule.name}:`, error);
          }
        }
      }
    }
    
    return fixedState;
  }
  
  /**
   * Add a custom validation rule
   */
  public addRule(rule: ValidationRule): void {
    this.rules.set(rule.name, rule);
  }
  
  /**
   * Remove a validation rule
   */
  public removeRule(name: string): void {
    this.rules.delete(name);
  }
  
  /**
   * Get validation history
   */
  public getValidationHistory(): ValidationResult[] {
    return [...this.validationHistory];
  }
  
  /**
   * Get validation statistics
   */
  public getValidationStats(): ValidationStats {
    const stats: ValidationStats = {
      totalValidations: this.validationHistory.length,
      successRate: 0,
      commonErrors: new Map(),
      criticalErrors: 0,
      autoFixSuccesses: 0
    };
    
    if (this.validationHistory.length === 0) return stats;
    
    let validCount = 0;
    
    for (const result of this.validationHistory) {
      if (result.isValid) {
        validCount++;
      }
      
      // Count error types
      for (const error of result.errors) {
        const count = stats.commonErrors.get(error.code) || 0;
        stats.commonErrors.set(error.code, count + 1);
        
        if (error.severity === 'critical') {
          stats.criticalErrors++;
        }
      }
    }
    
    stats.successRate = (validCount / this.validationHistory.length) * 100;
    
    return stats;
  }
  
  // Private methods
  
  private initializeDefaultRules(): void {
    // Level validation rules
    this.addRule({
      name: 'valid_current_level',
      description: 'Current level must be a valid level ID',
      validate: (state) => {
        const validLevels = ['observatory', 'miranda', 'restaurant'];
        const isValid = validLevels.includes(state.currentLevel);
        
        return {
          isValid,
          errors: isValid ? [] : [{
            code: 'INVALID_LEVEL',
            message: `Current level '${state.currentLevel}' is not valid`,
            field: 'currentLevel',
            severity: 'high',
            recoverable: true
          }],
          warnings: []
        };
      },
      autoFix: (state) => {
        const validLevels = ['observatory', 'miranda', 'restaurant'];
        if (!validLevels.includes(state.currentLevel)) {
          state.currentLevel = 'observatory';
        }
        return state;
      }
    });
    
    // Stats validation rules
    this.addRule({
      name: 'non_negative_stats',
      description: 'Game statistics must be non-negative',
      validate: (state) => {
        const errors: ValidationError[] = [];
        
        if (state.gameStats.starsDiscovered < 0) {
          errors.push({
            code: 'NEGATIVE_STARS',
            message: 'Stars discovered cannot be negative',
            field: 'gameStats.starsDiscovered',
            severity: 'medium',
            recoverable: true
          });
        }
        
        if (state.gameStats.timeExplored < 0) {
          errors.push({
            code: 'NEGATIVE_TIME',
            message: 'Time explored cannot be negative',
            field: 'gameStats.timeExplored',
            severity: 'medium',
            recoverable: true
          });
        }
        
        if (state.gameStats.levelsVisited < 0) {
          errors.push({
            code: 'NEGATIVE_LEVELS',
            message: 'Levels visited cannot be negative',
            field: 'gameStats.levelsVisited',
            severity: 'medium',
            recoverable: true
          });
        }
        
        return {
          isValid: errors.length === 0,
          errors,
          warnings: []
        };
      },
      autoFix: (state) => {
        state.gameStats.starsDiscovered = Math.max(0, state.gameStats.starsDiscovered);
        state.gameStats.timeExplored = Math.max(0, state.gameStats.timeExplored);
        state.gameStats.levelsVisited = Math.max(0, state.gameStats.levelsVisited);
        state.gameStats.interactionsPerformed = Math.max(0, state.gameStats.interactionsPerformed);
        state.gameStats.secretsFound = Math.max(0, state.gameStats.secretsFound);
        return state;
      }
    });
    
    // Settings validation rules
    this.addRule({
      name: 'valid_settings',
      description: 'Game settings must be within valid ranges',
      validate: (state) => {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];
        
        // Audio volume validation
        if (state.settings.audioVolume < 0 || state.settings.audioVolume > 1) {
          errors.push({
            code: 'INVALID_AUDIO_VOLUME',
            message: 'Audio volume must be between 0 and 1',
            field: 'settings.audioVolume',
            severity: 'low',
            recoverable: true
          });
        }
        
        // Sensitivity validation
        if (state.settings.mouseSensitivity < 0.1 || state.settings.mouseSensitivity > 5) {
          warnings.push({
            code: 'UNUSUAL_MOUSE_SENSITIVITY',
            message: 'Mouse sensitivity is outside normal range (0.1-5)',
            field: 'settings.mouseSensitivity',
            suggestion: 'Consider setting mouse sensitivity between 0.5 and 2.0'
          });
        }
        
        // Graphics quality validation
        const validQualities = ['low', 'medium', 'high', 'ultra'];
        if (!validQualities.includes(state.settings.graphicsQuality)) {
          errors.push({
            code: 'INVALID_GRAPHICS_QUALITY',
            message: 'Graphics quality must be low, medium, high, or ultra',
            field: 'settings.graphicsQuality',
            severity: 'medium',
            recoverable: true
          });
        }
        
        return {
          isValid: errors.length === 0,
          errors,
          warnings
        };
      },
      autoFix: (state) => {
        // Fix audio volume
        state.settings.audioVolume = Math.max(0, Math.min(1, state.settings.audioVolume));
        
        // Fix mouse sensitivity
        state.settings.mouseSensitivity = Math.max(0.1, Math.min(5, state.settings.mouseSensitivity));
        state.settings.touchSensitivity = Math.max(0.1, Math.min(5, state.settings.touchSensitivity));
        
        // Fix graphics quality
        const validQualities = ['low', 'medium', 'high', 'ultra'];
        if (!validQualities.includes(state.settings.graphicsQuality)) {
          state.settings.graphicsQuality = 'high';
        }
        
        return state;
      }
    });
    
    // Consistency validation rules
    this.addRule({
      name: 'consistent_progress',
      description: 'Game progress must be consistent',
      validate: (state) => {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];
        
        // Stars discovered should match discovered stars set
        if (state.gameStats.starsDiscovered !== state.discoveredStars.size) {
          errors.push({
            code: 'INCONSISTENT_STAR_COUNT',
            message: 'Star count in stats does not match discovered stars set',
            field: 'gameStats.starsDiscovered',
            severity: 'high',
            recoverable: true
          });
        }
        
        // Levels visited should be at least the number of completed levels
        if (state.gameStats.levelsVisited < state.completedLevels.size) {
          errors.push({
            code: 'INCONSISTENT_LEVEL_COUNT',
            message: 'Levels visited is less than completed levels',
            field: 'gameStats.levelsVisited',
            severity: 'medium',
            recoverable: true
          });
        }
        
        // Selected star should be in discovered stars (if not null)
        if (state.selectedStar && !state.discoveredStars.has(state.selectedStar.uniqueId)) {
          warnings.push({
            code: 'SELECTED_STAR_NOT_DISCOVERED',
            message: 'Selected star is not in discovered stars set',
            field: 'selectedStar',
            suggestion: 'Add selected star to discovered stars set'
          });
        }
        
        return {
          isValid: errors.length === 0,
          errors,
          warnings
        };
      },
      autoFix: (state) => {
        // Fix star count
        state.gameStats.starsDiscovered = state.discoveredStars.size;
        
        // Fix level count
        state.gameStats.levelsVisited = Math.max(state.gameStats.levelsVisited, state.completedLevels.size);
        
        // Fix selected star
        if (state.selectedStar && !state.discoveredStars.has(state.selectedStar.uniqueId)) {
          state.discoveredStars.add(state.selectedStar.uniqueId);
        }
        
        return state;
      }
    });
  }
  
  private validateLevelTransition(action: GameAction, currentState: GameState): ValidationResult {
    const { to } = action.payload;
    const validLevels = ['observatory', 'miranda', 'restaurant'];
    
    if (!validLevels.includes(to)) {
      return {
        isValid: false,
        errors: [{
          code: 'INVALID_TRANSITION_TARGET',
          message: `Cannot transition to invalid level: ${to}`,
          field: 'levelId',
          severity: 'high',
          recoverable: true
        }],
        warnings: []
      };
    }
    
    return { isValid: true, errors: [], warnings: [] };
  }
  
  private validateStarSelection(action: GameAction, currentState: GameState): ValidationResult {
    const { star } = action.payload;
    
    if (!star) {
      return {
        isValid: false,
        errors: [{
          code: 'NULL_STAR_DATA',
          message: 'Star data is null - cannot select star',
          field: 'star',
          severity: 'high',
          recoverable: false
        }],
        warnings: []
      };
    }
    
    if (!star.uniqueId) {
      return {
        isValid: false,
        errors: [{
          code: 'MISSING_STAR_ID',
          message: 'Star data is missing required uniqueId property',
          field: 'star.uniqueId',
          severity: 'high',
          recoverable: false
        }],
        warnings: []
      };
    }
    
    return { isValid: true, errors: [], warnings: [] };
  }
  
  private validateStatsUpdate(action: GameAction, currentState: GameState): ValidationResult {
    const { updates } = action.payload;
    const errors: ValidationError[] = [];
    
    // Validate each stat update
    for (const [key, value] of Object.entries(updates)) {
      if (typeof value === 'number' && value < 0) {
        errors.push({
          code: 'NEGATIVE_STAT_UPDATE',
          message: `Stat update for ${key} cannot be negative: ${value}`,
          field: `stats.${key}`,
          severity: 'medium',
          recoverable: true
        });
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }
  
  private validateSettingsUpdate(action: GameAction, currentState: GameState): ValidationResult {
    const { updates } = action.payload;
    const errors: ValidationError[] = [];
    
    // Validate audio volume
    if (updates.audioVolume !== undefined) {
      if (updates.audioVolume < 0 || updates.audioVolume > 1) {
        errors.push({
          code: 'INVALID_AUDIO_VOLUME_UPDATE',
          message: 'Audio volume must be between 0 and 1',
          field: 'settings.audioVolume',
          severity: 'low',
          recoverable: true
        });
      }
    }
    
    // Validate graphics quality
    if (updates.graphicsQuality !== undefined) {
      const validQualities = ['low', 'medium', 'high', 'ultra'];
      if (!validQualities.includes(updates.graphicsQuality)) {
        errors.push({
          code: 'INVALID_GRAPHICS_QUALITY_UPDATE',
          message: 'Graphics quality must be low, medium, high, or ultra',
          field: 'settings.graphicsQuality',
          severity: 'medium',
          recoverable: true
        });
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }
  
  private validateGenericAction(action: GameAction, currentState: GameState): ValidationResult {
    const errors: ValidationError[] = [];
    
    // Check for required action properties
    if (!action.type) {
      errors.push({
        code: 'MISSING_ACTION_TYPE',
        message: 'Action must have a type',
        field: 'action.type',
        severity: 'critical',
        recoverable: false
      });
    }
    
    if (!action.meta || !action.meta.timestamp) {
      errors.push({
        code: 'MISSING_ACTION_META',
        message: 'Action must have metadata with timestamp',
        field: 'action.meta',
        severity: 'low',
        recoverable: true
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }
  
  private addToHistory(result: ValidationResult): void {
    this.validationHistory.push(result);
    
    // Limit history size
    if (this.validationHistory.length > this.maxHistorySize) {
      this.validationHistory.shift();
    }
  }
}

export interface ValidationStats {
  totalValidations: number;
  successRate: number;
  commonErrors: Map<string, number>;
  criticalErrors: number;
  autoFixSuccesses: number;
}

// Singleton instance
export const stateValidator = new StateValidator();