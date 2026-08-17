import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { PlatformProvider } from './platform/PlatformProvider';
import './index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

createRoot(container).render(
  <StrictMode>
    {/*
      Opt in to the v7 behaviours now. `v7_relativeSplatPath` matters here
      because the product lives under a splat route (`/app/*`) with relative
      children; adopting it early keeps routing identical across the upgrade
      instead of inheriting a silent breakage.
    */}
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <PlatformProvider>
        <App />
      </PlatformProvider>
    </BrowserRouter>
  </StrictMode>,
);
