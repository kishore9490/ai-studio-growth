import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { App } from './App';
import { PlatformProvider } from './platform/PlatformProvider';
import './index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

/**
 * Routing mode.
 *
 * The app normally uses history routing. Built with VITE_ROUTER=hash it uses
 * hash routing instead, so the whole SPA works from a single static file with
 * no server rewrite rules — that is what makes a self-contained, shareable
 * build possible.
 */
const useHashRouting = import.meta.env.VITE_ROUTER === 'hash';
const Router = useHashRouting ? HashRouter : BrowserRouter;

createRoot(container).render(
  <StrictMode>
    {/*
      Opt in to the v7 behaviours now. `v7_relativeSplatPath` matters here
      because the product lives under a splat route (`/app/*`) with relative
      children; adopting it early keeps routing identical across the upgrade
      instead of inheriting a silent breakage.
    */}
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <PlatformProvider>
        <App />
      </PlatformProvider>
    </Router>
  </StrictMode>,
);
