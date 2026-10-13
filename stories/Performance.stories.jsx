import React, { useMemo } from 'react'

import DropdownTreeSelect from '../src'
import { actionArgs, hiddenArgTypes } from './actions'
import bigData from './data/big-data.json'
import generateLargeTree, { countNodes } from '../src/tree/generateLargeTree'

const meta = {
  title: 'Performance',
  component: DropdownTreeSelect,
  argTypes: {
    ...hiddenArgTypes,
    virtualized: { control: 'object' },
  },
  args: {
    ...actionArgs(),
    virtualized: { itemHeight: 32, overscan: 10, height: 300 },
  },
}

export default meta

const HugeTree = ({ expanded, ...args }) => {
  // keep the data referentially stable so the tree is only built once
  const data = useMemo(() => generateLargeTree({ expanded }), [expanded])
  const count = useMemo(() => countNodes(data), [data])
  return (
    <div>
      <h1>{count.toLocaleString()} nodes (virtualized)</h1>
      <p>
        100 roots × 10 nodes × 100 leaves. Only the rows in view (plus overscan) are rendered, so opening, expanding,
        scrolling and searching stay smooth.
      </p>
      <DropdownTreeSelect data={data} {...args} />
    </div>
  )
}

export const Virtualized100k = {
  name: '100k nodes (virtualized)',
  args: { expanded: true, texts: { placeholder: 'Search 100k nodes...' } },
  argTypes: { expanded: { control: 'boolean', description: 'Generate the tree fully expanded' } },
  render: args => <HugeTree {...args} />,
}

export const SideBySide15k = {
  name: '15k nodes: virtualized vs. infinite scroll',
  render: ({ virtualized, ...args }) => (
    <div>
      <h1>15k+ nodes side by side</h1>
      <p>
        The same data (see Examples/Large Tree) with <code>virtualized</code> on the left and the default infinite
        scroll on the right. Expand some nodes or search and scroll to compare.
      </p>
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3>virtualized</h3>
          <DropdownTreeSelect data={bigData} {...args} id="virtualized" virtualized={virtualized || true} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3>non-virtualized (infinite scroll)</h3>
          <DropdownTreeSelect data={bigData} {...args} id="paged" />
        </div>
      </div>
    </div>
  ),
}
