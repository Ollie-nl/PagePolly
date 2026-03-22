// Puppeteer crawler defaults
export const PUPPETEER_CONFIG = {
  DEFAULT_SETTINGS: {
    simulateHumanBehavior: true,
    takeScreenshots: true,
    maxRetries: 3,
    navigationTimeout: 30000,
    waitForSelector: 'body'
  }
};
