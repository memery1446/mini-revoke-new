// constants/config.js - Feature toggles and safety settings
export const FEATURES = {
  // Batch revocation features
  batchRevoke: {
    enabled: true, // Master toggle for batch revocation feature
    erc20Enabled: true, // Toggle for ERC-20 batch revocation
    nftEnabled: true, // Toggle for NFT batch revocation (disabled by default)
    erc1155Enabled: true, // Toggle for ERC-1155 batch revocation (disabled by default)
    maxBatchSize: 5, // Maximum number of approvals that can be revoked in one batch
    showGasEstimates: true, // Whether to show gas estimates before confirming
    requireConfirmation: true, // Whether to require explicit confirmation
    testMode: false, // Set to true for testing behaviors
  },
};

// Environment-specific overrides
const ENVIRONMENT = process.env.REACT_APP_ENVIRONMENT || 'production';

// Override features for specific environments
if (ENVIRONMENT === 'development') {
  FEATURES.batchRevoke.nftEnabled = true; // Enable NFT batch revocation in development
  FEATURES.batchRevoke.maxBatchSize = 10; // Allow larger batches in development
}

// Enable all features on localhost/testing environments
if (typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1'
)) {
  FEATURES.batchRevoke.nftEnabled = true;
  FEATURES.batchRevoke.erc1155Enabled = true;
}

// Expose feature flags to window for debugging
if (typeof window !== 'undefined') {
  window.APP_FEATURES = FEATURES;
  
  // Allow toggling features from the console for testing
  window.toggleFeature = (featurePath, value) => {
    const pathParts = featurePath.split('.');
    let target = FEATURES;
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      target = target[pathParts[i]];
      if (!target) return false;
    }
    
    const lastPart = pathParts[pathParts.length - 1];
    if (typeof target[lastPart] !== 'undefined') {
      if (value === undefined) {
        // Toggle boolean values if no value provided
        if (typeof target[lastPart] === 'boolean') {
          target[lastPart] = !target[lastPart];
        }
      } else {
        // Set to provided value
        target[lastPart] = value;
      }
      console.log(`Feature ${featurePath} set to:`, target[lastPart]);
      return true;
    }
    return false;
  };
}

export default FEATURES;
