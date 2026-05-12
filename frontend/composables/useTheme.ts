import { ref, onMounted } from 'vue'

export type Theme = 'dark' | 'light'

export const useTheme = () => {
  const theme = ref<Theme>('dark')

  const toggleTheme = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    if (process.client) {
      document.documentElement.setAttribute('data-theme', theme.value)
      localStorage.setItem('theme', theme.value)
    }
  }

  onMounted(() => {
    if (process.client) {
      const savedTheme = localStorage.getItem('theme') as Theme | null
      const preferredTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
      
      theme.value = savedTheme || preferredTheme
      document.documentElement.setAttribute('data-theme', theme.value)
    }
  })

  return {
    theme,
    toggleTheme
  }
}
