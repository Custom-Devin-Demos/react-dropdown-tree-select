import React, { useMemo } from 'react'
import { fn } from '@storybook/test'

import DropdownTreeSelect from '../src'
import { actionArgs, hiddenArgTypes } from './actions'

// 100 roots × 10 nodes × 100 leaves (101,100 nodes) where every leaf is lazy (`hasChildren`),
// plus a few lazy roots on top whose children are only fetched when expanded
const LAZY_ROOTS = 5

const generateLazyTree = ({ roots = 100, children = 10, leaves = 100, expanded = true } = {}) => {
  const tree = []
  for (let i = 0; i < LAZY_ROOTS; i++) {
    tree.push({ label: `Lazy root ${i}`, value: `lazy-${i}`, hasChildren: true })
  }
  for (let r = 0; r < roots; r++) {
    const level1 = new Array(children)
    for (let c = 0; c < children; c++) {
      const level2 = new Array(leaves)
      for (let l = 0; l < leaves; l++) {
        level2[l] = { label: `Leaf ${r}-${c}-${l}`, value: `leaf-${r}-${c}-${l}`, hasChildren: true }
      }
      level1[c] = { label: `Node ${r}-${c}`, value: `node-${r}-${c}`, expanded, children: level2 }
    }
    tree.push({ label: `Root ${r}`, value: `root-${r}`, expanded, children: level1 })
  }
  return tree
}

const countNodes = nodes =>
  nodes.reduce((count, node) => count + 1 + (node.children ? countNodes(node.children) : 0), 0)

// lazy roots load 1,000 lazy children; any other lazy node loads 10 leaves
const createLoader = latency => node =>
  new Promise(resolve => {
    setTimeout(() => {
      const isLazyRoot = /^lazy-\d+$/.test(node.value)
      const count = isLazyRoot ? 1000 : 10
      resolve(
        Array.from({ length: count }, (_, i) => ({
          label: `${node.label} / ${i + 1}`,
          value: `${node.value}/${i + 1}`,
          hasChildren: isLazyRoot,
        }))
      )
    }, latency)
  })

const meta = {
  title: 'Features/Combined',
  component: DropdownTreeSelect,
  argTypes: {
    ...hiddenArgTypes,
    loadChildren: { control: false },
    onLoadChildrenError: { table: { category: 'Events' } },
    virtualized: { control: 'object' },
    latency: { control: { type: 'range', min: 0, max: 5000, step: 100 }, description: 'Simulated latency (ms)' },
  },
  args: {
    ...actionArgs(),
    onLoadChildrenError: fn().mockName('onLoadChildrenError'),
    showDropdown: 'initial',
    virtualized: { itemHeight: 32, overscan: 10, height: 400 },
    latency: 800,
    texts: { placeholder: 'Search loaded nodes...', loadingChildren: 'Loading...' },
  },
  parameters: {
    docs: {
      description: {
        component:
          '`virtualized` and `loadChildren` together: a 100k-node tree whose leaves (and a few extra roots) are lazy. ' +
          'Expanding a lazy node fetches its children with a simulated latency; only the rows in view are rendered.',
      },
    },
  },
}

export default meta

const CombinedExample = ({ latency, ...args }) => {
  // keep the data referentially stable so the tree is only built once
  const data = useMemo(() => generateLazyTree(), [])
  const count = useMemo(() => countNodes(data), [data])
  const loadChildren = useMemo(() => createLoader(latency), [latency])
  return (
    <div>
      <h1>{count.toLocaleString()} nodes, virtualized + lazy loading</h1>
      <p>
        The first {LAZY_ROOTS} roots load 1,000 lazy children each; every leaf loads 10 more nodes when expanded. Search
        only covers the nodes that have been loaded.
      </p>
      <DropdownTreeSelect data={data} {...args} loadChildren={loadChildren} />
    </div>
  )
}

export const VirtualizedLazyLoading = {
  name: 'Virtualized + Lazy Loading (100k Nodes)',
  render: args => <CombinedExample {...args} />,
}
