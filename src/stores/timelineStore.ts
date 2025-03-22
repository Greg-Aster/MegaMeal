import { writable, derived } from 'svelte/store';
import type { TimelineEvent } from '../services/TimelineService.client';
import { processTimelineEvents } from '../services/TimelineService.client';

// Define interface for the timeline view state
interface TimelineViewState {
  // Current view mode
  viewMode: 'timeline' | 'list' | 'tree' | 'map';
  
  // Display options
  compact: boolean;
  asBanner: boolean;
  
  // Navigation state
  scale: number;
  offsetX: number;
  offsetY: number;
  
  // Event selection
  selectedEventId: string | null;
  
  // Filter options
  category: string | null;
  era: string | null;
  startYear: number | null;
  endYear: number | null;
  showOnlyKeyEvents: boolean;
  
  // Visuals
  background: string;

  // Events data
  events: TimelineEvent[];
  
  // Position memory
  lastEra: string | null; // Store the last selected era
  lastEraScale: number | null; // Store the zoom level for the era
  lastEraOffsetX: number | null; // Store the X offset for the era
  lastEraOffsetY: number | null; // Store the Y offset for the era
}

// Initial state
const initialState: TimelineViewState = {
  viewMode: 'timeline',
  compact: false,
  asBanner: false,
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  selectedEventId: null,
  category: null,
  era: null,
  startYear: null,
  endYear: null,
  showOnlyKeyEvents: false,
  background: '/assets/banner/0001.png',
  events: [],
  lastEra: null,
  lastEraScale: null,
  lastEraOffsetX: null,
  lastEraOffsetY: null
};

// Try to load saved preferences from localStorage if available
function loadSavedPreferences(): Partial<TimelineViewState> {
  const savedPrefs: Partial<TimelineViewState> = {};
  
  try {
    if (typeof window !== 'undefined') { // Check if we're in a browser
      // Load view mode preference
      const savedViewMode = localStorage.getItem('timeline-view-preference');
      if (savedViewMode && ['timeline', 'list', 'tree', 'map'].includes(savedViewMode)) {
        savedPrefs.viewMode = savedViewMode as any;
      }
      
      // Load compact mode preference
      const savedCompact = localStorage.getItem('timeline-compact-mode');
      if (savedCompact) {
        savedPrefs.compact = savedCompact === 'true';
      }
      
      // Load last selected era
      const savedEra = localStorage.getItem('timeline-last-era');
      if (savedEra) {
        savedPrefs.lastEra = savedEra;
        savedPrefs.era = savedEra; // Also set as current era
      }
      
      // Load navigation state for the era
      const savedScale = localStorage.getItem('timeline-last-era-scale');
      if (savedScale) {
        savedPrefs.lastEraScale = parseFloat(savedScale);
        savedPrefs.scale = parseFloat(savedScale);
      }
      
      const savedOffsetX = localStorage.getItem('timeline-last-era-offset-x');
      if (savedOffsetX) {
        savedPrefs.lastEraOffsetX = parseFloat(savedOffsetX);
        savedPrefs.offsetX = parseFloat(savedOffsetX);
      }
      
      const savedOffsetY = localStorage.getItem('timeline-last-era-offset-y');
      if (savedOffsetY) {
        savedPrefs.lastEraOffsetY = parseFloat(savedOffsetY);
        savedPrefs.offsetY = parseFloat(savedOffsetY);
      }
    }
  } catch (e) {
    // Ignore localStorage errors (happens in incognito or when storage is disabled)
    console.log('Unable to load timeline preferences from localStorage');
  }
  
  return savedPrefs;
}

// Save current view state to localStorage
function saveViewState(state: TimelineViewState) {
  try {
    if (typeof window !== 'undefined') {
      // Save view mode
      localStorage.setItem('timeline-view-preference', state.viewMode);
      
      // Save compact mode
      localStorage.setItem('timeline-compact-mode', String(state.compact));
      
      // Save current era if set
      if (state.era) {
        localStorage.setItem('timeline-last-era', state.era);
      }
      
      // Save navigation state
      localStorage.setItem('timeline-last-era-scale', String(state.scale));
      localStorage.setItem('timeline-last-era-offset-x', String(state.offsetX));
      localStorage.setItem('timeline-last-era-offset-y', String(state.offsetY));
    }
  } catch (e) {
    // Ignore localStorage errors
    console.log('Unable to save timeline preferences to localStorage', e);
  }
}

// Create the main store with merged preferences
const savedPrefs = loadSavedPreferences();
const baseStore = writable<TimelineViewState>({
  ...initialState,
  ...savedPrefs
});

// Create action functions for updating the store
const actions = {
  // Set initial events
  setInitialEvents: (events: TimelineEvent[]) => 
    baseStore.update(state => ({ ...state, events })),
  
  // Reset to initial state
  reset: () => baseStore.set(initialState),
  
  // Set view mode
  setViewMode: (mode: 'timeline' | 'list' | 'tree' | 'map') => {
    return baseStore.update(state => {
      const newState = { ...state, viewMode: mode };
      saveViewState(newState);
      return newState;
    });
  },
  
  // Toggle compact mode
  toggleCompact: () => {
    return baseStore.update(state => {
      const newState = { ...state, compact: !state.compact };
      saveViewState(newState);
      return newState;
    });
  },
  
  // Set banner mode
  setBannerMode: (asBanner: boolean) => 
    baseStore.update(state => ({ ...state, asBanner })),
  
  // Navigation controls
  zoomIn: () => 
    baseStore.update(state => {
      const newState = { ...state, scale: Math.min(5, state.scale + 0.2) };
      saveViewState(newState);
      return newState;
    }),
  
  zoomOut: () => 
    baseStore.update(state => {
      const newState = { ...state, scale: Math.max(0.5, state.scale - 0.2) };
      saveViewState(newState);
      return newState;
    }),
  
  pan: (deltaX: number, deltaY: number) => 
    baseStore.update(state => {
      const newState = { 
        ...state, 
        offsetX: state.offsetX + deltaX,
        offsetY: state.offsetY + deltaY
      };
      saveViewState(newState);
      return newState;
    }),
  
  resetView: () => 
    baseStore.update(state => {
      const newState = { 
        ...state, 
        scale: 1,
        offsetX: 0,
        offsetY: 0
      };
      saveViewState(newState);
      return newState;
    }),
  
  // Selection
  selectEvent: (eventId: string | null) => 
    baseStore.update(state => ({ ...state, selectedEventId: eventId })),
  
  // Filters
  setCategory: (category: string | null) => 
    baseStore.update(state => ({ ...state, category })),
  
  setEra: (era: string | null) => 
    baseStore.update(state => {
      const newState = { ...state, era, lastEra: era };
      saveViewState(newState);
      return newState;
    }),
  
  setYearRange: (startYear: number | null, endYear: number | null) => 
    baseStore.update(state => ({ ...state, startYear, endYear })),
  
  toggleKeyEventsOnly: () => 
    baseStore.update(state => ({ ...state, showOnlyKeyEvents: !state.showOnlyKeyEvents })),
  
  setBackground: (background: string) => 
    baseStore.update(state => ({ ...state, background })),
    
  // Save the current position for the current era
  saveEraPosition: (scale: number, offsetX: number, offsetY: number) =>
    baseStore.update(state => {
      if (!state.era) return state;
      
      const newState = {
        ...state,
        scale,
        offsetX,
        offsetY,
        lastEraScale: scale,
        lastEraOffsetX: offsetX,
        lastEraOffsetY: offsetY
      };
      saveViewState(newState);
      return newState;
    })
};

// Export a combined store with both the writable store methods and our action methods
export const timelineStore = {
  subscribe: baseStore.subscribe,
  set: baseStore.set,
  update: baseStore.update,
  ...actions
};

// Export actions separately for use where direct imports are needed
export const timelineActions = actions;

// Create a derived store for current filtered events
export const filteredEvents = derived(baseStore, ($store, set) => {
  // Filter events based on current filters
  const filtered = processTimelineEvents($store.events, {
    category: $store.category || undefined,
    startYear: $store.startYear || undefined,
    endYear: $store.endYear || undefined,
    era: $store.era || undefined,
    onlyKeyEvents: $store.showOnlyKeyEvents
  });
  
  set(filtered);
}, [] as TimelineEvent[]);

// Create a derived store for the selected event
export const selectedEvent = derived(
  [baseStore, filteredEvents], 
  ([$store, $events]) => {
    if (!$store.selectedEventId) return null;
    return $events.find(event => event.slug === $store.selectedEventId) || null;
  }
);