import { fireEvent, render } from '@testing-library/react'
import { spy } from 'sinon'
import React from 'react'
import test from 'ava'

import Input from './index'

const noop = () => {}
const getInput = (container: HTMLElement) => container.querySelector('input') as HTMLInputElement

test('renders input', t => {
  const { container } = render(<Input onInputChange={noop} />)
  t.is(getInput(container).placeholder, 'Choose...')
  t.snapshot(container.innerHTML)
})

test('renders placeholder', t => {
  const placeholderText = 'select something'
  const { container } = render(<Input onInputChange={noop} texts={{ placeholder: placeholderText }} />)
  t.is(getInput(container).placeholder, placeholderText)
})

test('renders inline search placeholder', t => {
  const placeholderText = 'Search something'
  const { container } = render(
    <Input onInputChange={noop} inlineSearchInput={true} texts={{ inlineSearchPlaceholder: placeholderText }} />
  )
  t.is(getInput(container).placeholder, placeholderText)
})

test('raises onchange', t => {
  const onChange = spy()
  const { container } = render(<Input onInputChange={onChange} />)
  fireEvent.change(getInput(container), { target: { value: 'hello' } })
  t.true(onChange.calledWith('hello'))
})

test('debounces subsequent changes', async t => {
  const onChange = spy()
  const { container } = render(<Input onInputChange={onChange} />)
  fireEvent.change(getInput(container), { target: { value: 'h' } })
  fireEvent.change(getInput(container), { target: { value: 'he' } })
  fireEvent.change(getInput(container), { target: { value: 'hel' } })
  t.true(onChange.calledOnceWith('h'))
  await new Promise(resolve => setTimeout(resolve, 350))
  t.true(onChange.calledTwice)
  t.true(onChange.secondCall.calledWith('hel'))
})

test('should render disabled input', t => {
  const { container } = render(<Input onInputChange={noop} disabled />)
  t.true(getInput(container).disabled)
})
