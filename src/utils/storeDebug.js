// storeDebug.js
import store from './store/index';

// Explicitly connect store to window
window.reduxStore = store;

// Create helper functions
export function getReduxState() {
  return store.getState();
}

export function logReduxState() {
  const state = store.getState();
  console.log("📊 Redux State:", state);
  return state;
}

// Connect to window
window.logReduxState = logReduxState;

