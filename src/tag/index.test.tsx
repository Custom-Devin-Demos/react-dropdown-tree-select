import { fireEvent, render } from '@testing-library/react'
import { spy } from 'sinon'
import React from 'react'
import test from 'ava'

import Tag from './index'

const noop = () => {}
const getButton = (container: HTMLElement) => container.querySelector('.tag-remove') as HTMLButtonElement

test('renders label when passed in', t => {
  const { container } = render(<Tag label="hello" id="abc" onDelete={noop} />)
  t.is((container.querySelector('#abc_tag') as HTMLElement).textContent, 'hellox')
  t.snapshot(container.innerHTML)
})

test('call stopPropagation and stopImmediatePropagation when pill is closed', t => {
  const onDelete = spy()
  const outerClick = spy()
  const documentClick = spy()
  document.addEventListener('click', documentClick)
  const { container } = render(
    <div onClick={outerClick}>
      <Tag label="hello" id="abc" onDelete={onDelete} />
    </div>
  )
  fireEvent.click(getButton(container))
  document.removeEventListener('click', documentClick)
  t.true(onDelete.calledOnce)
  t.true(outerClick.notCalled)
  t.true(documentClick.notCalled)
})

test('call onDelete handler when pill is closed', t => {
  const onDelete = spy()
  const { container } = render(<Tag label="hello" id="abc" onDelete={onDelete} />)
  fireEvent.click(getButton(container))
  t.true(onDelete.calledWith('abc', false))
})

test('call onDelete handler with keyboard flag', t => {
  const onDelete = spy()
  const { container } = render(<Tag label="hello" id="abc" onDelete={onDelete} />)
  fireEvent.keyDown(getButton(container), { key: 'Backspace' })
  fireEvent.keyUp(getButton(container), { key: 'Enter' })
  fireEvent.keyUp(getButton(container), { key: 'a' })
  t.true(onDelete.calledTwice)
  t.true(onDelete.alwaysCalledWith('abc', true))
})

test('should not call onDelete when readOnly', t => {
  const onDelete = spy()
  const { container } = render(<Tag label="hello" id="abc" onDelete={onDelete} readOnly />)
  fireEvent.click(getButton(container))
  t.true(onDelete.notCalled)
})

test('should not call onDelete when disabled', t => {
  const onDelete = spy()
  const { container } = render(<Tag label="hello" id="abc" onDelete={onDelete} disabled />)
  fireEvent.click(getButton(container))
  t.true(onDelete.notCalled)
})

test('should not cause form submit', t => {
  const onSubmit = spy()
  const onDelete = spy()
  const { container } = render(
    <form onSubmit={onSubmit}>
      <Tag label="hello" id="abc" onDelete={onDelete} />
    </form>
  )
  fireEvent.click(getButton(container))
  t.false(onSubmit.called)
})
