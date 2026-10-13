import React from 'react'

import DropdownTreeSelect from '../src'
import { actionArgs, hiddenArgTypes } from './actions'
import data from './data/simple.json'

const meta = {
  title: 'Examples/Keyboard Navigation',
  component: DropdownTreeSelect,
  argTypes: hiddenArgTypes,
  args: { ...actionArgs(), texts: { label: 'Keyboard navigation demo' } },
}

export default meta

export const KeyboardNavigation = {
  name: 'Keyboard Navigation',
  render: args => (
    <div>
      <h1>Keyboard navigation</h1>
      <ul>
        <li>
          <kbd>ArrowUp</kbd>/<kbd>ArrowDown</kbd>, <kbd>PageUp</kbd>/<kbd>PageDown</kbd>, <kbd>Home</kbd>/<kbd>End</kbd>{' '}
          move the focus (and open the dropdown when closed)
        </li>
        <li>
          <kbd>ArrowRight</kbd>/<kbd>ArrowLeft</kbd> expand/collapse the focused node
        </li>
        <li>
          <kbd>Enter</kbd> toggles selection of the focused node
        </li>
        <li>
          <kbd>Escape</kbd> or <kbd>Tab</kbd> close the dropdown
        </li>
        <li>
          <kbd>Backspace</kbd> on an empty search input removes the last tag
        </li>
      </ul>
      <DropdownTreeSelect data={data} {...args} />
    </div>
  ),
}
