import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Remove <React.StrictMode> if you're experiencing issues with third-party libraries
root.render(
  <App />
);

// Measure performance in your app (optional)
reportWebVitals(console.log);
