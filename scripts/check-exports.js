/* Consumer check for the built package: resolves every `package.json#exports` entry the way a consumer would
 * (self-reference by package name) and verifies the headless bundle is CSS free. Run after `yarn build`. */
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')

const { name } = require('../package.json')

const dist = path.join(__dirname, '..', 'dist')

const main = require(name)
const headless = require(`${name}/headless`)

const DropdownTreeSelect = main.default
assert.ok(DropdownTreeSelect, 'main entry has a default export')
assert.strictEqual(typeof main.useDropdownTreeSelect, 'function', 'main entry exports useDropdownTreeSelect')
assert.ok(main.DropdownTreeSelectUnstyled, 'main entry exports DropdownTreeSelectUnstyled')
assert.strictEqual(typeof headless.useDropdownTreeSelect, 'function', 'headless entry exports useDropdownTreeSelect')
assert.ok(headless.DropdownTreeSelectUnstyled, 'headless entry exports DropdownTreeSelectUnstyled')

// the old deep paths keep resolving
;['styles.css', 'dist/styles.css', 'dist/react-dropdown-tree-select.js', 'package.json'].forEach(subpath => {
  assert.ok(fs.existsSync(require.resolve(`${name}/${subpath}`)), `${name}/${subpath} resolves`)
})
;['react-dropdown-tree-select.d.ts', 'headless.d.ts'].forEach(file => {
  assert.ok(fs.existsSync(path.join(dist, file)), `dist/${file} exists`)
})

// headless bundle must not contain (or emit) any CSS
assert.ok(!fs.existsSync(path.join(dist, 'headless.css')), 'no dist/headless.css')
const { sources } = JSON.parse(fs.readFileSync(path.join(dist, 'headless.js.map'), 'utf8'))
const cssSources = sources.filter(source => /\.css$/.test(source))
assert.deepStrictEqual(cssSources, [], 'headless.js does not bundle CSS')
assert.ok(!/mini-css-extract-plugin/.test(fs.readFileSync(path.join(dist, 'headless.js'), 'utf8')), 'no css loader')
// dist/stats.json is written by webpack-bundle-analyzer during `yarn build`
const { chunks } = JSON.parse(fs.readFileSync(path.join(dist, 'stats.json'), 'utf8'))
const cssModuleCount = chunkName => {
  const chunk = chunks.find(c => c.names.includes(chunkName))
  assert.ok(chunk, `chunk ${chunkName} exists`)
  return chunk.modules.filter(m => /\.css$/.test(m.name || m.identifier)).length
}
assert.strictEqual(cssModuleCount('headless'), 0, 'headless chunk has no CSS modules')
assert.ok(cssModuleCount('react-dropdown-tree-select') > 0, 'main bundle still includes the styles')

// the unstyled component renders the same markup as the styled one
const data = { label: 'parent', value: 'parent', children: [{ label: 'child', value: 'child' }] }
const props = { id: 'rdts', data, showDropdown: 'always' }
const styled = renderToStaticMarkup(React.createElement(DropdownTreeSelect, props))
const unstyled = renderToStaticMarkup(React.createElement(headless.DropdownTreeSelectUnstyled, props))
assert.ok(styled.includes('react-dropdown-tree-select'), 'styled component renders')
assert.strictEqual(unstyled, styled, 'unstyled markup matches the styled markup')

console.log('check-exports: OK')
