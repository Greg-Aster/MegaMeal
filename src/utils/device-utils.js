// Detect if the current device is Android
export function isAndroid() {
    if (typeof navigator === 'undefined') return false;
    return /Android/i.test(navigator.userAgent);
  }
  
  // Detect if the current device is mobile
  export function isMobile() {
    if (typeof navigator === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           (typeof window !== 'undefined' && window.innerWidth < 768);
  }