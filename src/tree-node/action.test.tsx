import { fireEvent, render } from '@testing-library/react'
import { spy, match } from 'sinon'
import React from 'react'
import test from 'ava'

import Action from './action'
import { NodeAction } from '../types'

const actionData = { action: { id: 'actionA' } as unknown as NodeAction, nodeId: 'nodeId' }

test('renders action with given props', t => {
  const props = {
    title: 'action',
    className: 'cn0-0-0',
    text: 'hello',
    junk: '1',
  }

  const { container } = render(<Action {...props} actionData={actionData} />)
  const i = container.querySelector('i') as HTMLElement
  t.is(i.title, 'action')
  t.is(i.className, 'cn0-0-0')
  t.is(i.textContent, 'hello')
  t.false(i.hasAttribute('junk'))
})

test('notifies clicks if handler is passed', t => {
  const onClick = spy()
  const props = {
    title: 'action',
    className: 'cn0-0-0',
    onAction: onClick,
    actionData,
  }

  const { container } = render(<Action {...props} />)
  fireEvent.click(container.querySelector('.cn0-0-0') as HTMLElement)
  t.true(onClick.calledOnce)
  t.true(onClick.calledWith(match('nodeId'), match({ id: 'actionA' })))
})

test('does not notify clicks when readOnly', t => {
  const onClick = spy()
  const { container } = render(<Action className="a" onAction={onClick} actionData={actionData} readOnly />)
  fireEvent.click(container.querySelector('.a') as HTMLElement)
  t.true(onClick.notCalled)
})
