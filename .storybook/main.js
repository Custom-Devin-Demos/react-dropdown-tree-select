const path = require('path')

/** @type { import('@storybook/react-webpack5').StorybookConfig } */
module.exports = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-webpack5-compiler-babel', '@storybook/addon-essentials'],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  core: {
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
  },
  webpackFinal: async config => {
    config.resolve.extensions = Array.from(
      new Set([...(config.resolve.extensions || []), '.js', '.jsx', '.ts', '.tsx'])
    )

    // run the library's CSS through the same postcss pipeline used by the production build
    config.module.rules = config.module.rules.map(rule => {
      if (!rule || !rule.test || !rule.test.toString().includes('css') || !Array.isArray(rule.use)) return rule
      return {
        ...rule,
        use: [
          ...rule.use.map(loader =>
            loader && typeof loader === 'object' && /css-loader/.test(loader.loader)
              ? { ...loader, options: { ...loader.options, importLoaders: 1 } }
              : loader
          ),
          {
            loader: require.resolve('postcss-loader'),
            options: { config: { path: path.resolve(__dirname, '..') } },
          },
        ],
      }
    })

    return config
  },
}
