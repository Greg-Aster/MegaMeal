// src/modules/starmap/ConstellationBuilder.js
// Handles constellation patterns and connecting lines

export class ConstellationBuilder {
  constructor() {
    this.constellationConfig = {
      'ancient-epoch': { centerAzimuth: 0, centerElevation: 45, spread: 40, pattern: 'ancient_wisdom' },
      'awakening-era': { centerAzimuth: 60, centerElevation: 50, spread: 35, pattern: 'rising_dawn' },
      'golden-age': { centerAzimuth: 120, centerElevation: 55, spread: 45, pattern: 'crown' },
      'conflict-epoch': { centerAzimuth: 180, centerElevation: 40, spread: 40, pattern: 'crossed_swords' },
      'singularity-conflict': { centerAzimuth: 240, centerElevation: 45, spread: 35, pattern: 'supernova' },
      'transcendent-age': { centerAzimuth: 300, centerElevation: 60, spread: 40, pattern: 'ascension' },
      'final-epoch': { centerAzimuth: 340, centerElevation: 65, spread: 30, pattern: 'omega' },
      'unknown': { centerAzimuth: 30, centerElevation: 35, spread: 25, pattern: 'scattered' }
    };

    this.constellationPatterns = {
      ancient_wisdom: [
        { azOffset: 0, elOffset: 0 }, 
        { azOffset: -15, elOffset: 10 }, 
        { azOffset: 15, elOffset: 8 }, 
        { azOffset: -8, elOffset: -12 }, 
        { azOffset: 12, elOffset: -10 }, 
        { azOffset: 0, elOffset: 20 }, 
        { azOffset: -20, elOffset: -5 }, 
        { azOffset: 25, elOffset: -8 }
      ],
      rising_dawn: [
        { azOffset: -10, elOffset: -15 }, 
        { azOffset: 0, elOffset: 0 }, 
        { azOffset: 10, elOffset: 15 }, 
        { azOffset: -5, elOffset: 8 }, 
        { azOffset: 5, elOffset: 8 }, 
        { azOffset: 15, elOffset: 25 }, 
        { azOffset: -15, elOffset: 20 }
      ],
      crown: [
        { azOffset: 0, elOffset: 15 }, 
        { azOffset: -12, elOffset: 8 }, 
        { azOffset: 12, elOffset: 8 }, 
        { azOffset: -6, elOffset: 0 }, 
        { azOffset: 6, elOffset: 0 }, 
        { azOffset: -20, elOffset: -5 }, 
        { azOffset: 20, elOffset: -5 }, 
        { azOffset: 0, elOffset: -10 }
      ],
      crossed_swords: [
        { azOffset: -15, elOffset: 15 }, 
        { azOffset: 15, elOffset: -15 }, 
        { azOffset: 15, elOffset: 15 }, 
        { azOffset: -15, elOffset: -15 }, 
        { azOffset: 0, elOffset: 0 }, 
        { azOffset: -25, elOffset: 10 }, 
        { azOffset: 25, elOffset: -10 }
      ],
      supernova: [
        { azOffset: 0, elOffset: 0 }, 
        { azOffset: 0, elOffset: 20 }, 
        { azOffset: 17, elOffset: 10 }, 
        { azOffset: 20, elOffset: 0 }, 
        { azOffset: 17, elOffset: -10 }, 
        { azOffset: 0, elOffset: -20 }, 
        { azOffset: -17, elOffset: -10 }, 
        { azOffset: -20, elOffset: 0 }, 
        { azOffset: -17, elOffset: 10 }
      ],
      ascension: [
        { azOffset: 0, elOffset: 25 }, 
        { azOffset: -8, elOffset: 15 }, 
        { azOffset: 8, elOffset: 15 }, 
        { azOffset: -15, elOffset: 5 }, 
        { azOffset: 15, elOffset: 5 }, 
        { azOffset: -20, elOffset: -10 }, 
        { azOffset: 20, elOffset: -10 }, 
        { azOffset: 0, elOffset: -5 }
      ],
      omega: [
        { azOffset: -10, elOffset: 10 }, 
        { azOffset: 10, elOffset: 10 }, 
        { azOffset: -15, elOffset: 0 }, 
        { azOffset: 15, elOffset: 0 }, 
        { azOffset: -8, elOffset: -10 }, 
        { azOffset: 8, elOffset: -10 }, 
        { azOffset: 0, elOffset: 5 }
      ],
      scattered: [
        { azOffset: 5, elOffset: 8 }, 
        { azOffset: -12, elOffset: -5 }, 
        { azOffset: 18, elOffset: 12 }, 
        { azOffset: -8, elOffset: 15 }, 
        { azOffset: 10, elOffset: -10 }, 
        { azOffset: -15, elOffset: 3 }
      ]
    };

    this.connectionPatterns = {
      ancient_wisdom: [[0,1], [0,2], [1,5], [2,5], [0,3], [0,4]], // Star formation
      rising_dawn: [[0,1], [1,2], [1,3], [1,4], [2,5], [2,6]], // Rising pattern
      crown: [[0,1], [0,2], [1,3], [2,4], [3,7], [4,7], [5,6]], // Crown shape
      crossed_swords: [[0,1], [2,3]], // Simple X pattern
      supernova: [[0,1], [0,2], [0,3], [0,4], [0,5], [0,6], [0,7], [0,8]], // Radial
      ascension: [[0,1], [0,2], [1,3], [2,4], [3,5], [4,6], [7,1], [7,2]], // Ascending
      omega: [[0,1], [2,3], [4,5], [0,6], [1,6], [2,4], [3,5]], // Omega shape
      scattered: [[0,1], [1,2], [2,3]] // Simple connections
    };
  }

  // === CONFIGURATION GETTERS ===
  getConstellationConfig(era) {
    return this.constellationConfig[era] || this.constellationConfig['unknown'];
  }

  getConstellationPattern(patternName) {
    return this.constellationPatterns[patternName] || this.constellationPatterns['scattered'];
  }

  getConnectionPattern(patternName) {
    return this.connectionPatterns[patternName] || this.connectionPatterns['scattered'];
  }

  // === CONSTELLATION LINE CREATION ===
  createConstellationLines(eventsByEra, starSprites, starsGroup, THREE, eraColorMap) {
    Object.entries(eventsByEra).forEach(([era, eraEvents]) => {
      if (eraEvents.length < 2) return; // Need at least 2 stars to connect
      
      const config = this.getConstellationConfig(era);
      if (!config) {
        console.warn(`[ConstellationBuilder] No config found for era: ${era}`);
        return;
      }
      
      const connections = this.getConnectionPattern(config.pattern);
      const linePositions = this.calculateLinePositions(eraEvents, connections, starSprites);
      
      if (linePositions.length > 0) {
        this.createConstellationLineGeometry(linePositions, era, eraColorMap, starsGroup, THREE);
      }
    });
  }

  calculateLinePositions(eraEvents, connections, starSprites) {
    const linePositions = [];
    
    connections.forEach(([startIdx, endIdx]) => {
      if (startIdx < eraEvents.length && endIdx < eraEvents.length) {
        const startEventData = eraEvents[startIdx];
        const endEventData = eraEvents[endIdx];
        
        // Construct unique IDs to fetch sprites
        const startUniqueId = `${startEventData.slug}-${startEventData.year}-${startIdx}`;
        const endUniqueId = `${endEventData.slug}-${endEventData.year}-${endIdx}`;
        
        const startSprite = starSprites.get(startUniqueId);
        const endSprite = starSprites.get(endUniqueId);
        
        if (startSprite && endSprite) {
          linePositions.push(startSprite.position.clone());
          linePositions.push(endSprite.position.clone());
        }
      }
    });
    
    return linePositions;
  }

  createConstellationLineGeometry(linePositions, era, eraColorMap, starsGroup, THREE) {
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePositions);
    
    // Create dashed line material for better constellation visibility
    const lineMaterial = new THREE.LineDashedMaterial({ 
      color: eraColorMap[era] || '#6366f1',
      transparent: true,
      opacity: 0.2,
      linewidth: 2,
      dashSize: 3,
      gapSize: 2
    });
    
    const constellationLine = new THREE.LineSegments(lineGeometry, lineMaterial);
    constellationLine.computeLineDistances(); // Required for dashed lines
    constellationLine.userData = {
      type: 'constellation-line',
      era: era
    };
    
    starsGroup.add(constellationLine);
  }

  // === CONSTELLATION ANALYSIS ===
  analyzeConstellationDensity(eventsByEra) {
    const analysis = {};
    
    Object.entries(eventsByEra).forEach(([era, events]) => {
      const config = this.getConstellationConfig(era);
      const pattern = this.getConstellationPattern(config.pattern);
      
      analysis[era] = {
        eventCount: events.length,
        patternSize: pattern.length,
        overflow: Math.max(0, events.length - pattern.length),
        density: events.length / pattern.length,
        azimuthSpread: this.calculateAzimuthSpread(config, pattern),
        elevationSpread: this.calculateElevationSpread(config, pattern)
      };
    });
    
    return analysis;
  }

  calculateAzimuthSpread(config, pattern) {
    const azOffsets = pattern.map(p => p.azOffset);
    return Math.max(...azOffsets) - Math.min(...azOffsets);
  }

  calculateElevationSpread(config, pattern) {
    const elOffsets = pattern.map(p => p.elOffset);
    return Math.max(...elOffsets) - Math.min(...elOffsets);
  }

  // === PATTERN GENERATION ===
  generateCustomPattern(centerAzimuth, centerElevation, spread, eventCount, shape = 'scattered') {
    const pattern = [];
    
    switch (shape) {
      case 'circle':
        for (let i = 0; i < eventCount; i++) {
          const angle = (i / eventCount) * Math.PI * 2;
          const radius = spread * 0.5;
          pattern.push({
            azOffset: Math.cos(angle) * radius,
            elOffset: Math.sin(angle) * radius
          });
        }
        break;
        
      case 'spiral':
        for (let i = 0; i < eventCount; i++) {
          const angle = (i / eventCount) * Math.PI * 4; // 2 full rotations
          const radius = (i / eventCount) * spread * 0.5;
          pattern.push({
            azOffset: Math.cos(angle) * radius,
            elOffset: Math.sin(angle) * radius
          });
        }
        break;
        
      case 'grid':
        const gridSize = Math.ceil(Math.sqrt(eventCount));
        const cellSize = spread / gridSize;
        for (let i = 0; i < eventCount; i++) {
          const x = i % gridSize;
          const y = Math.floor(i / gridSize);
          pattern.push({
            azOffset: (x - gridSize/2) * cellSize,
            elOffset: (y - gridSize/2) * cellSize
          });
        }
        break;
        
      default: // 'scattered'
        for (let i = 0; i < eventCount; i++) {
          pattern.push({
            azOffset: (Math.random() - 0.5) * spread,
            elOffset: (Math.random() - 0.5) * spread
          });
        }
        break;
    }
    
    return pattern;
  }

  // === CONSTELLATION VALIDATION ===
  validateConstellationConfig(era, eventCount) {
    const config = this.getConstellationConfig(era);
    const pattern = this.getConstellationPattern(config.pattern);
    const connections = this.getConnectionPattern(config.pattern);
    
    const issues = [];
    
    // Check if pattern has enough positions
    if (eventCount > pattern.length) {
      issues.push(`Pattern '${config.pattern}' has only ${pattern.length} positions but era '${era}' has ${eventCount} events`);
    }
    
    // Check if connections reference valid indices
    connections.forEach(([startIdx, endIdx]) => {
      if (startIdx >= eventCount) {
        issues.push(`Connection references index ${startIdx} but era '${era}' only has ${eventCount} events`);
      }
      if (endIdx >= eventCount) {
        issues.push(`Connection references index ${endIdx} but era '${era}' only has ${eventCount} events`);
      }
    });
    
    // Check for reasonable spread values
    if (config.spread > 60) {
      issues.push(`Era '${era}' has unusually large spread: ${config.spread}°`);
    }
    
    return {
      valid: issues.length === 0,
      issues: issues
    };
  }

  // === CONSTELLATION UTILITIES ===
  getConstellationBounds(era) {
    const config = this.getConstellationConfig(era);
    const pattern = this.getConstellationPattern(config.pattern);
    
    const azOffsets = pattern.map(p => p.azOffset);
    const elOffsets = pattern.map(p => p.elOffset);
    
    return {
      azimuth: {
        min: config.centerAzimuth + Math.min(...azOffsets),
        max: config.centerAzimuth + Math.max(...azOffsets),
        center: config.centerAzimuth
      },
      elevation: {
        min: config.centerElevation + Math.min(...elOffsets),
        max: config.centerElevation + Math.max(...elOffsets),
        center: config.centerElevation
      }
    };
  }

  getAllEras() {
    return Object.keys(this.constellationConfig);
  }

  getAllPatterns() {
    return Object.keys(this.constellationPatterns);
  }

  // === DYNAMIC PATTERN MODIFICATION ===
  addConstellationPattern(name, pattern, connections = []) {
    this.constellationPatterns[name] = pattern;
    this.connectionPatterns[name] = connections;
  }

  removeConstellationPattern(name) {
    delete this.constellationPatterns[name];
    delete this.connectionPatterns[name];
  }

  updateConstellationConfig(era, newConfig) {
    this.constellationConfig[era] = {
      ...this.constellationConfig[era],
      ...newConfig
    };
  }

  // === DEBUGGING UTILITIES ===
  getConstellationDebugInfo(era) {
    const config = this.getConstellationConfig(era);
    const pattern = this.getConstellationPattern(config.pattern);
    const connections = this.getConnectionPattern(config.pattern);
    const bounds = this.getConstellationBounds(era);
    
    return {
      era,
      config,
      pattern,
      connections,
      bounds,
      patternName: config.pattern,
      patternSize: pattern.length,
      connectionCount: connections.length
    };
  }

  logAllConstellations() {
    console.group('[ConstellationBuilder] All Constellation Configurations');
    this.getAllEras().forEach(era => {
      console.log(`${era}:`, this.getConstellationDebugInfo(era));
    });
    console.groupEnd();
  }
}