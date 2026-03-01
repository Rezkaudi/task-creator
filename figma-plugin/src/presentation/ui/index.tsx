import { createRoot } from 'react-dom/client';
import { setupGlobalHandlers } from './utils';
import App from './App.tsx';
import './styles/base.css';

// Setup global error handlers
setupGlobalHandlers();

// Mount React app
const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(<App />);
