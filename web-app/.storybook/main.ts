module.exports = {
  "stories": [
    "../components/**/*.stories.mdx",
    "../components/**/stories.@(ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions"
  ],
  "framework": "@storybook/react"
}
