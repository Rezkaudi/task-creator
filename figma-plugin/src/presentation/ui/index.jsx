import React from 'react';
import { createRoot } from 'react-dom/client';
import { setupGlobalHandlers } from './errorReporter.js';
import App from './components/App.jsx';

// Setup global error handlers
setupGlobalHandlers();

// Mount React app
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
