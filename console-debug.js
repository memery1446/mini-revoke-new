// This file tests if console logging is working at all
// Add this file to your project and import it in your main index.js

// Immediately execute logging when imported
(function() {
  // Try different console methods
  console.log("TEST: Basic console.log is working");
  console.info("TEST: console.info is working");
  console.warn("TEST: console.warn is working");
  console.error("TEST: console.error is working");
  
  // Try different ways to log to console
  window.console.log("TEST: window.console.log is working");
  
  // Create a visible element on the page with debug info
  setTimeout(() => {
    const debugDiv = document.createElement('div');
    debugDiv.style.position = 'fixed';
    debugDiv.style.bottom = '10px';
    debugDiv.style.right = '10px';
    debugDiv.style.padding = '10px';
    debugDiv.style.background = 'black';
    debugDiv.style.color = 'lime';
    debugDiv.style.zIndex = '9999';
    debugDiv.style.fontFamily = 'monospace';
    debugDiv.style.fontSize = '12px';
    debugDiv.innerText = 'Debug: Console test executed\nClick to test window.store';
    
    debugDiv.addEventListener('click', () => {
      if (window.store) {
        debugDiv.innerText = 'Redux store found: ' + 
          JSON.stringify(window.store.getState()).substring(0, 100) + '...';
        console.log("Redux store state:", window.store.getState());
      } else {
        debugDiv.innerText = 'Redux store NOT found on window';
        console.error("Redux store not found on window");
      }
    });
    
    document.body.appendChild(debugDiv);
  }, 1000);
  
  // Test if there's a console redirection happening
  const originalConsoleLog = console.log;
  console.log = function(...args) {
    document.title = "Console working: " + args[0];
    originalConsoleLog.apply(console, args);
  };
  
  console.log("OVERRIDE TEST: Console override is working");
  
  // Check browser compatibility
  console.log("Browser info:", navigator.userAgent);
})();

export default "Console debug executed";
