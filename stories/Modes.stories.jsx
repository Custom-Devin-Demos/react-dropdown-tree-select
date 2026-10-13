import React from 'react'

import DropdownTreeSelect from '../src'
import { actionArgs, hiddenArgTypes } from './actions'
import data from './data/simple.json'

const meta = {
  title: 'Modes/Select Modes',
  component: DropdownTreeSelect,
  argTypes: {
    ...hiddenArgTypes,
    mode: { control: false },
  },
  args: { ...actionArgs(), showDropdown: 'initial' },
  render: args => <DropdownTreeSelect data={data} {...args} />,
}

export default meta

const modeStory = (mode, description) => ({
  args: { mode, texts: { label: mode } },
  parameters: { docs: { description: { story: description } } },
})

export const MultiSelect = modeStory(
  'multiSelect',
  'A multi selectable dropdown which supports tree data with parent-child relationships. Selecting a parent selects all its children.'
)

export const Hierarchical = modeStory(
  'hierarchical',
  'A multi selectable dropdown which supports tree data **without** parent-child relationships. Each node is independently selectable.'
)

export const SimpleSelect = modeStory(
  'simpleSelect',
  'Turns the dropdown into a simple, single select dropdown. Only one node can be selected and the dropdown closes on selection.'
)

export const RadioSelect = modeStory(
  'radioSelect',
  'Turns the dropdown into radio select dropdown. Like simpleSelect, only one node can be selected, but the dropdown stays open.'
)
