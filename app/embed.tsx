import React from 'react';
import ReactDOM from 'react-dom';
import Widget from './widget';

function mountWidget(containerId: string) {
  const container = document.getElementById(containerId);
  if (container) {
    ReactDOM.render(<Widget />, container);
  }
}

// Expose mountWidget to global scope
(window as any).mountChatWidget = mountWidget;
