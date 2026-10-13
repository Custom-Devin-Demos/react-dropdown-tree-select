import React from 'react'

import DropdownTreeSelect from '../src'
import { actionArgs, hiddenArgTypes } from './actions'
import data from './data/options.json'

const meta = {
  title: 'Examples/Options',
  component: DropdownTreeSelect,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Toggle different options (in the Controls panel) to see their effect on the dropdown.',
      },
    },
  },
  argTypes: {
    ...hiddenArgTypes,
    mode: {
      control: 'select',
      options: ['multiSelect', 'simpleSelect', 'radioSelect', 'hierarchical'],
      table: { defaultValue: { summary: 'multiSelect' } },
    },
    showDropdown: {
      control: 'select',
      options: ['default', 'initial', 'always'],
      table: { defaultValue: { summary: 'default' } },
    },
    texts: { control: 'object' },
    tabIndex: { control: 'number' },
  },
  args: {
    ...actionArgs(),
    id: 'rdts',
    mode: 'multiSelect',
    showDropdown: 'default',
    showPartiallySelected: false,
    keepTreeOnSearch: false,
    keepChildrenOnSearch: false,
    keepOpenOnSelect: false,
    inlineSearchInput: false,
    clearSearchOnChange: false,
    disabled: false,
    readOnly: false,
    disablePoppingOnBackspace: false,
    texts: { label: 'Demo Dropdown', placeholder: 'Choose...', inlineSearchPlaceholder: 'Search...' },
  },
  render: args => <DropdownTreeSelect data={data} {...args} />,
}

export default meta

export const Options = {}
