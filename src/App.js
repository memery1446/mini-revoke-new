"use client"

import { useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Provider } from "react-redux" // Keep this import
import store from "./store/index" // Keep import for Redux store
import WalletConnect from "./components/WalletConnect.js"
import NetworkSelector from "./components/NetworkSelector.js"
import ApprovalDashboard from "./components/ApprovalDashboard.js" // Import the consolidated component
import BatchRevoke from "./components/BatchRevoke.js" 
import "bootstrap/dist/css/bootstrap.min.css"
import { BootstrapWrapper } from "./utils/provider"
import { initializeProvider } from "./utils/providerService"

console.log("🔴 App.js loaded - " + new Date().toISOString())

// Create a separate inner component that uses Redux hooks
const AppContent = () => {
  console.log("🔶 App content component rendering")
  const dispatch = useDispatch()
  const wallet = useSelector((state) => state.web3.account)
  const network = useSelector((state) => state.web3.network)
  const approvals = useSelector((state) => state.web3.approvals)

  useEffect(() => {
    console.log("🔄 Initializing provider service...")
    initializeProvider()
      .then(() => {
        console.log("✅ Provider service initialized")
      })
      .catch((error) => {
        console.error("❌ Provider initialization error:", error)
      })
  }, [])

  useEffect(() => {
    console.log("👛 Wallet:", wallet)
    console.log("🌐 Network:", network)
  }, [wallet, network])

  useEffect(() => {
    console.log("📋 Approvals updated:", approvals)
    console.log("📋 Total approvals:", approvals ? approvals.length : 0)
  }, [approvals])

  return (
    <BootstrapWrapper>
      <div className="container my-5">
        <header className="mb-4 text-center">
          <h1 className="text-primary fw-bold">
            <span className="me-2">🔒</span> Approval Manager
          </h1>
          <p className="text-muted">Review and revoke token approvals to protect your assets.</p>
        </header>

        <div className="row mb-4">
          <div className="col-md-6">
            <WalletConnect />
          </div>
          <div className="col-md-6">
            <NetworkSelector />
           
          </div>
        </div>

        {!wallet ? (
          <div className="text-center py-5">
            <h2>Connect Your Wallet</h2>
            <p className="text-muted">View and manage your active token approvals.</p>
          </div>
        ) : (
          <div className="row mt-4">
            <div className="col-lg-12">
              {/* Replace the previous components with the consolidated ApprovalDashboard */}
              <BatchRevoke />
              <ApprovalDashboard />
            </div>
          </div>
        )}
      </div>
    </BootstrapWrapper>
  )
}

const App = () => {
  console.log("🔶 App component rendering")

  useEffect(() => {
    console.log("🔄 App component useEffect running")
    // Expose store to window for debugging
    if (typeof window !== "undefined") {
      if (!window.store) {
        window.store = store
        console.log("📊 Redux store exposed to window")
      }

      // Setup debugging tools - keeping your exact implementation
      window.debugApp = {
        getState: () => (window.store ? window.store.getState() : "Store not available"),
        logState: () => {
          if (window.store) {
            const state = window.store.getState()
            console.log("Current Redux State:", state)
            return state
          }
          return "Store not available"
        },
      }

      // Add this new section to enable Redux logging in console
      console.log(
        "%c Redux Console Logging Enabled",
        "background: #4CAF50; color: white; padding: 4px; border-radius: 4px;",
      )
      console.log("Try dispatching an action to see detailed logs")

      // Test dispatch to demonstrate logging
      setTimeout(() => {
        if (window.store) {
          window.store.dispatch({ type: "TEST_ACTION", payload: { message: "Redux logger test" } })
          console.log("%c ✅ Redux logger test complete. You should see formatted logs above.", "color: #4CAF50;")
        }
      }, 1000)

      console.log("🛠️ Debug tools setup complete. Try window.debugApp.logState() in console")
    }

    // Dispatch a test action from the App component
    store.dispatch({ type: "APP_LOADED", payload: "App has loaded" })

    // Log the current state
    console.log("Current Redux State:", store.getState())
  }, [])

  // Return the AppContent wrapped in a Provider to fix the circular dependency issue
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  )
}

export default App

