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
  events: []
};

// Try to load saved preferences from localStorage if available
function loadSavedPreferences(): Partial<TimelineViewState> {
  const savedPrefs: Partial<TimelineViewState> = {};
  
  try {
    if (typeof window !== 'undefined') { // Check if we're in a browser
      const savedViewMode = localStorage.getItem('timeline-view-preference');
      if (savedViewMode && ['timeline', 'list', 'tree', 'map'].includes(savedViewMode)) {
        savedPrefs.viewMode = savedViewMode as any;
      }
      
      const savedCompact = localStorage.getItem('timeline-compact-mode');
      if (savedCompact) {
        savedPrefs.compact = savedCompact === 'true';
      }
    }
  } catch (e) {
    // Ignore localStorage errors (happens in incognito or when storage is disabled)
    console.log('Unable to load timeline preferences from localStorage');
  }
  
  return savedPrefs;
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
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('timeline-view-preference', mode);
      }
    } catch (e) {
      // Ignore localStorage errors
    }
    return baseStore.update(state => ({ ...state, viewMode: mode }));
  },
  
  // Toggle compact mode
  toggleCompact: () => {
    return baseStore.update(state => {
      const newCompact = !state.compact;
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('timeline-compact-mode', String(newCompact));
        }
      } catch (e) {
        // Ignore localStorage errors
      }
      return { ...state, compact: newCompact };
    });
  },
  
  // Set banner mode
  setBannerMode: (asBanner: boolean) => 
    baseStore.update(state => ({ ...state, asBanner })),
  
  // Navigation controls
  zoomIn: () => 
    baseStore.update(state => ({ ...state, scale: Math.min(5, state.scale + 0.2) })),
  
  zoomOut: () => 
    baseStore.update(state => ({ ...state, scale: Math.max(0.5, state.scale - 0.2) })),
  
  pan: (deltaX: number, deltaY: number) => 
    baseStore.update(state => ({ 
      ...state, 
      offsetX: state.offsetX + deltaX,
      offsetY: state.offsetY + deltaY
    })),
  
  resetView: () => 
    baseStore.update(state => ({ 
      ...state, 
      scale: 1,
      offsetX: 0,
      offsetY: 0
    })),
  
  // Selection
  selectEvent: (eventId: string | null) => 
    baseStore.update(state => ({ ...state, selectedEventId: eventId })),
  
  // Filters
  setCategory: (category: string | null) => 
    baseStore.update(state => ({ ...state, category })),
  
  setEra: (era: string | null) => 
    baseStore.update(state => ({ ...state, era })),
  
  setYearRange: (startYear: number | null, endYear: number | null) => 
    baseStore.update(state => ({ ...state, startYear, endYear })),
  
  toggleKeyEventsOnly: () => 
    baseStore.update(state => ({ ...state, showOnlyKeyEvents: !state.showOnlyKeyEvents })),
  
  setBackground: (background: string) => 
    baseStore.update(state => ({ ...state, background }))
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