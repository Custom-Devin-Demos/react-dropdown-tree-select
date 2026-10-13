const fs = require('fs')
const path = require('path')

// package.json#types points at dist/react-dropdown-tree-select.d.ts; re-export the declarations emitted by tsc
const entry = path.join(__dirname, '..', 'dist', 'react-dropdown-tree-select.d.ts')
fs.writeFileSync(entry, "export { default } from './types/index'\nexport * from './types/index'\n")
