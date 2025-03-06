import { configureStore } from "@reduxjs/toolkit"
import web3Reducer from "./web3Slice"

console.log("🚀 store/index.js is being executed")

// Middleware 
const simpleLoggerMiddleware = (store) => (next) => (action) => {
  console.log("Action:", action.type)
  console.log("Payload:", action.payload)
  const result = next(action)
  console.log("New State:", store.getState())
  return result
}

// Configure store 
const store = configureStore({
  reducer: {
    web3: web3Reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(simpleLoggerMiddleware),
})

console.log("🏗️ Redux store created")
console.log("Initial state:", store.getState())

if (typeof window !== "undefined") {
  window.reduxStore = store
  console.log("📊 Redux store exposed as window.reduxStore")
}

// Dispatch a test action immediately
store.dispatch({ type: "TEST_ACTION", payload: "Hello, Redux!" })

export default store

