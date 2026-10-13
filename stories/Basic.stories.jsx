import React from 'react'

import DropdownTreeSelect from '../src'
import { actionArgs, hiddenArgTypes } from './actions'
import data from './data/simple.json'

const meta = {
  title: 'Examples/Basic (no extra styles)',
  component: DropdownTreeSelect,
  argTypes: hiddenArgTypes,
  args: { ...actionArgs(), className: 'demo' },
}

export default meta

export const Basic = {
  name: 'Basic (no extra styles)',
  render: args => (
    <div>
      <h1>Basic component</h1>
      <p>
        This is a basic example of the component. Note that there are no external styles in this page, not even{' '}
        <code>reset.css</code> or <code>reboot.css</code> or <code>normalizer.css</code>.
      </p>
      <p>
        The idea is to showcase the component at its barest minimum. Of course, its easy to style it, using popular
        frameworks such as Bootstrap or Material Design (checkout the CodeSandbox examples).
      </p>
      <p>
        As a side effect, it also helps rule out issues arising out of using custom frameworks (if something
        doesn&apos;t look right in your app but looks OK here, you know what is messing things up).
      </p>
      <DropdownTreeSelect data={data} {...args} />
    </div>
  ),
}
