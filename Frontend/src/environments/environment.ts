export const environment = {
  production: false,
  newsApiKey: '', // Set your NewsAPI key here or use localStorage
  /**
   * Local dev: call the Node API directly so /api/* returns JSON (not index.html from :4200).
   * Ensure the backend is running on port 3000 and CORS allows http://localhost:4200 (default when FRONTEND_URL is unset).
   * Optional: set to '' and rely on proxy.conf.js — restart `ng serve` after changing proxy.
   */
  apiUrl: 'http://localhost:3000'
};
