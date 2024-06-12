import React from 'react'
import { ThemeProvider } from 'theme-ui'
import theme from '../theme'

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
}

export const decorators = [
  (Story, context) => (
    <ThemeProvider theme={theme}>
      <Story {...context}/>
    </ThemeProvider>
  ),
]
