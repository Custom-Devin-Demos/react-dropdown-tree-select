import '../stories/demo.css'

/** @type { import('@storybook/react').Preview } */
const preview = {
  parameters: {
    controls: {
      expanded: true,
      matchers: {
        color: /(background|color)$/i,
      },
    },
    options: {
      storySort: {
        order: [
          'Introduction',
          'Guides',
          ['README', 'Migration (v2 to v3)', 'HOC', 'CodeSandbox Examples'],
          'Examples',
          'Modes',
          'Features',
          'Headless',
          'Performance',
        ],
      },
    },
  },
}

export default preview
