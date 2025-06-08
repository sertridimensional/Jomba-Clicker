
import React from 'react';
import ReactDOM from 'react-dom/client';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <div style={{ color: 'white', fontSize: '48px', textAlign: 'center', paddingTop: '50px' }}>
      Olá do React!
    </div>
  </React.StrictMode>
);
