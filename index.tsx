import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';

console.log("Index.tsx executing...");

// Lazy load the App component. 
// This prevents the entire script from failing if 'firebase' fails to import inside App.
// It allows the initial HTML to render first.
const App = React.lazy(() => import('./App'));

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const LoadingFallback = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#64748b', fontFamily: 'sans-serif' }}>
    <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem' }}></div>
    <p>Loading Modules...</p>
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

try {
  const root = createRoot(rootElement);
  
  root.render(
    <React.StrictMode>
      <Suspense fallback={<LoadingFallback />}>
        <App />
      </Suspense>
    </React.StrictMode>
  );
  
  console.log("React mount command sent.");
} catch (e) {
  console.error("Root render failed:", e);
  rootElement.innerHTML = `<div style="color:red; padding:20px;">Failed to mount application: ${e}</div>`;
}