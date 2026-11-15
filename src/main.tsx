import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/noto-serif-sc/400.css';
import '@fontsource/noto-serif-sc/600.css';
import './index.css';
import { App } from './App';
import { StoreProvider } from './state/useStore';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
);

// Installed on a phone, the app should open with no network. A service worker keeps a copy of the
// program on the device; once it is running we hand it the list of files this page loaded.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register('./sw.js');
      const ready = await navigator.serviceWorker.ready;
      const loaded = performance
        .getEntriesByType('resource')
        .map((e) => e.name)
        .filter((url) => url.startsWith(location.origin));
      ready.active?.postMessage({ cache: loaded });
    } catch {
      /* Offline use is a convenience; the app works without it. */
    }
  });
}
