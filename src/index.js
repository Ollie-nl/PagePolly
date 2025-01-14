import React from 'react';
import ReactDOM from 'react-dom/client'; // Gebruik de nieuwe API
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root')); // Creëer een root
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
