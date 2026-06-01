// Shared Firebase Configuration
// This file ensures both admin panel and main website use the same Firebase endpoint

const FIREBASE_CONFIG = {
  DATABASE_URL: "https://froexbonuswhale-default-rtdb.firebaseio.com",
  BROKERS_ENDPOINT: "https://froexbonuswhale-default-rtdb.firebaseio.com/brokers.json"
};

// Export for use in both environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FIREBASE_CONFIG;
}
