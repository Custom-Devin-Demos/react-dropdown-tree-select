import { fireEvent, render } from '@testing-library/react'
import { spy } from 'sinon'
import React from 'react'
import test from 'ava'

import NodeLabel from './node-label'

const noop = () => {}
const baseNode = {
  id: '0-0-0',
  label: 'item0-0-0',
  value: 'value0-0-0',
}

test('renders node label', t => {
  const { container } = render(<NodeLabel clientId="snapshot" {...baseNode} onCheckboxChange={noop} />)
  const label = container.querySelector('label') as HTMLLabelElement
  t.is(label.title, 'item0-0-0')
  t.is(label.htmlFor, '0-0-0')
  t.truthy(container.querySelector('input.checkbox-item[type="checkbox"][id="0-0-0"]'))
  t.snapshot(container.innerHTML)
})

test('notifies checkbox changes', t => {
  const onChange = spy()
  const { container } = render(<NodeLabel {...baseNode} checked={false} onCheckboxChange={onChange} />)
  fireEvent.click(container.querySelector('.checkbox-item') as HTMLElement)
  t.true(onChange.calledWith('0-0-0', true))
})

test('disable checkbox if the node has disabled status', t => {
  const { container } = render(<NodeLabel clientId="snapshot" {...baseNode} disabled onCheckboxChange={noop} />)
  t.true((container.querySelector('input') as HTMLInputElement).disabled)
})

test('renders radio button in radioSelect mode', t => {
  const { container } = render(<NodeLabel clientId="rdts" {...baseNode} mode="radioSelect" onCheckboxChange={noop} />)
  const input = container.querySelector('input.radio-item') as HTMLInputElement
  t.is(input.type, 'radio')
  t.is(input.name, 'rdts')
})

test('notifies clicks in simple mode', t => {
  const onChange = spy()
  const { container } = render(
    <NodeLabel {...baseNode} checked={false} onCheckboxChange={onChange} mode="simpleSelect" />
  )
  fireEvent.click(container.querySelector('.node-label') as HTMLElement)
  t.true(onChange.calledWith('0-0-0', true))
})

test('call stopPropagation and stopImmediatePropagation when label is clicked', t => {
  const onChange = spy()
  const outerClick = spy()
  const documentClick = spy()
  document.addEventListener('click', documentClick)
  const { container } = render(
    <div onClick={outerClick}>
      <NodeLabel {...baseNode} checked={false} onCheckboxChange={onChange} mode="simpleSelect" />
    </div>
  )
  fireEvent.click(container.querySelector('.node-label') as HTMLElement)
  document.removeEventListener('click', documentClick)
  t.true(onChange.called)
  t.true(outerClick.notCalled)
  t.true(documentClick.notCalled)
})
