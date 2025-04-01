import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

const ThemeContext = createContext<{
    theme: Theme
    setTheme: (t: Theme) => void
    toggleTheme: () => void
}>({
    theme: 'dark',
    setTheme: () => {}, // ✅
    toggleTheme: () => {}
})


export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [theme, setTheme] = useState<Theme>(
        (localStorage.getItem('theme') as Theme) || 'dark'
    )

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        localStorage.setItem('theme', theme)
    }, [theme])

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => useContext(ThemeContext)
