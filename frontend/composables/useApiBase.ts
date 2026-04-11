export function useApiBase() {
  if (typeof useRuntimeConfig !== 'undefined') {
    const config = useRuntimeConfig()
    return config.public?.apiBase || process.env.API_BASE || 'http://localhost:3000'
  }

  return process.env.API_BASE || 'http://localhost:3000'
}
