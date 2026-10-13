import { render } from '@testing-library/react'
import React from 'react'
import test from 'ava'

import Checkbox, { refUpdater } from './index'

test('Checkbox component', t => {
  const { container } = render(<Checkbox className="sample" />)
  const input = container.querySelector('input') as HTMLInputElement
  t.is(input.type, 'checkbox')
  t.is(input.className, 'sample')
  t.false(input.checked)
  t.false(input.indeterminate)
  t.snapshot(container.innerHTML)
})

test('renders indeterminate state', t => {
  const input = {} as HTMLInputElement
  refUpdater({ indeterminate: true })(input)
  t.true(input.indeterminate)
})

test('renders checked state', t => {
  const input = {} as HTMLInputElement
  refUpdater({ checked: true })(input)
  t.true(input.checked)
})

test('applies checked and indeterminate to the DOM node', t => {
  const { container, rerender } = render(<Checkbox checked indeterminate />)
  const input = container.querySelector('input') as HTMLInputElement
  t.true(input.checked)
  t.true(input.indeterminate)
  rerender(<Checkbox checked={false} indeterminate={false} />)
  t.false(input.checked)
  t.false(input.indeterminate)
})

test('renders disabled state', t => {
  const { container } = render(<Checkbox disabled />)
  t.true((container.querySelector('input') as HTMLInputElement).disabled)
  t.snapshot(container.innerHTML)
})

test('renders disabled state when readOnly', t => {
  const { container } = render(<Checkbox readOnly />)
  t.true((container.querySelector('input') as HTMLInputElement).disabled)
})
