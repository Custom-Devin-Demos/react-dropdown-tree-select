import React from 'react'

import DropdownTreeSelect from '../src'
import { actionArgs, hiddenArgTypes } from './actions'
import bigData from './data/big-data.json'

const meta = {
  title: 'Examples/Large Tree',
  component: DropdownTreeSelect,
  argTypes: hiddenArgTypes,
  args: actionArgs(),
}

export default meta

export const LargeTree = {
  name: 'Large Tree',
  render: args => (
    <div>
      <h1>Tree with large amount of nodes</h1>
      <p>Performance testing with large amount of nodes (15k+). Searching and rendering should be smooth.</p>
      <DropdownTreeSelect data={bigData} {...args} />
    </div>
  ),
}
