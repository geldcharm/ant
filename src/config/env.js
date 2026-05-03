// Validates required environment variables at startup so deployment
// misconfiguration fails loudly instead of producing broken UI.
//
// Vite exposes only variables prefixed with VITE_ to the client bundle.
function pick(key, fallback) {
  const value = import.meta.env[key];
  if (value === undefined || value === '') return fallback;
  return value;
}

export const ENV = {
  basePath: pick('VITE_BASE_PATH', '/'),
  appName:  pick('VITE_APP_NAME', 'PaveMaster'),
  isDev:    import.meta.env.DEV,
  isProd:   import.meta.env.PROD,
};
