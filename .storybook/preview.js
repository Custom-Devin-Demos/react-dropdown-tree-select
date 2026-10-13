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
        order: ['Introduction', 'Guides', ['HOC', 'CodeSandbox Examples'], 'Examples', 'Modes'],
      },
    },
  },
}

export default preview
