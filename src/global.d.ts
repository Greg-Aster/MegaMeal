import type { AstroIntegration } from '@swup/astro'

declare global {
  interface Window {
    // type from '@swup/astro' is incorrect
    swup: AstroIntegration
  }
}

// Svelte JSX namespace augmentation for custom events on intrinsic elements
declare namespace svelte.JSX {
  interface HTMLAttributes<T extends EventTarget> {
    'on:timeline:resize'?: (event: CustomEvent<any> & { currentTarget: EventTarget & T }) => void;
  }
}
