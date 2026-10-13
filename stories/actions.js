import { fn } from '@storybook/test'

const events = ['onChange', 'onAction', 'onNodeToggle', 'onFocus', 'onBlur']

// Wires every callback prop to the Storybook "Actions" panel
export const actionArgs = () => events.reduce((args, name) => ({ ...args, [name]: fn().mockName(name) }), {})

export const hiddenArgTypes = {
  data: { table: { disable: true } },
  searchPredicate: { control: false },
  ...events.reduce((argTypes, name) => ({ ...argTypes, [name]: { table: { category: 'Events' } } }), {}),
}
