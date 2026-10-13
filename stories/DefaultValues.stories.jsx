import React from 'react'

import DropdownTreeSelect from '../src'
import { actionArgs, hiddenArgTypes } from './actions'
import data from './data/default-values.json'

const meta = {
  title: 'Examples/Default Values',
  component: DropdownTreeSelect,
  argTypes: hiddenArgTypes,
  args: actionArgs(),
}

export default meta

export const DefaultValues = {
  name: 'Default Values',
  render: args => (
    <div>
      <h1>Component with Default Values</h1>
      <p>
        Default Values get applied when there is no other user based selection. User can select more values and unselect
        default values as long as there is at least one user-selected value still present.
      </p>
      <DropdownTreeSelect data={data} {...args} />
    </div>
  ),
}
