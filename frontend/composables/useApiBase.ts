export function useApiBase() {
  const base = process.env.API_BASE || 'http://localhost:3000/api';

  if (typeof useRuntimeConfig !== 'undefined') {
    const config = useRuntimeConfig()
    return config.public?.apiBase || base
  }

  return base;
}
