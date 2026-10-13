import { render } from '@testing-library/react'
import React from 'react'
import test from 'ava'

import RadioButton, { refUpdater } from './index'

test('Radio component', t => {
  const { container } = render(<RadioButton className="sample" name="sample" />)
  const input = container.querySelector('input') as HTMLInputElement
  t.is(input.type, 'radio')
  t.is(input.name, 'sample')
  t.snapshot(container.innerHTML)
})

test('renders checked state', t => {
  const input = {} as HTMLInputElement
  refUpdater({ checked: true })(input)
  t.true(input.checked)
})

test('renders disabled state', t => {
  const { container } = render(<RadioButton name="sample" disabled />)
  t.true((container.querySelector('input') as HTMLInputElement).disabled)
  t.snapshot(container.innerHTML)
})
