import test from 'ava'
import React, { StrictMode, useState } from 'react'
import { render } from '@testing-library/react'
import { spy, SinonSpy } from 'sinon'

import DropdownTreeSelect from './index'
import { act, cleanup, fireEvent, renderDropdown } from './test-utils'
import { TreeNodeProps } from './types'

const data: TreeNodeProps[] = [
  {
    label: 'parent',
    value: 'parent',
    children: [
      { label: 'child 1', value: 'child1' },
      { label: 'child 2', value: 'child2' },
    ],
  },
  { label: 'other', value: 'other' },
]

const countClickListeners = (add: SinonSpy, remove: SinonSpy) =>
  add.getCalls().filter(c => c.args[0] === 'click').length - remove.getCalls().filter(c => c.args[0] === 'click').length

const clickOutside = () =>
  act(() => {
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  })

test.afterEach.always(cleanup)

test('works under StrictMode without leaking document listeners', t => {
  const add = spy(document, 'addEventListener')
  const remove = spy(document, 'removeEventListener')
  const onChange = spy()
  const onFocus = spy()
  const onBlur = spy()

  try {
    const r = renderDropdown({ id: 'rdts', data, onChange, onFocus, onBlur }, { wrapper: StrictMode })
    t.is(countClickListeners(add, remove), 0)

    // open
    fireEvent.click(r.$('.dropdown-trigger') as HTMLElement)
    t.true(r.isOpen())
    t.true(onFocus.calledOnce)
    t.is(countClickListeners(add, remove), 1)

    // search
    r.search('child')
    t.true(r.isSearchModeOn())
    t.is(r.$$('li.node').length, 2)

    // select
    fireEvent.click(r.$('#rdts-0-0') as HTMLElement)
    t.true(onChange.calledOnce)
    t.is(r.tags().length, 1)
    t.true(r.isOpen())
    t.is(countClickListeners(add, remove), 1)

    // close via outside click (a real click outside blurs the search input first)
    fireEvent.blur(r.searchInput())
    clickOutside()
    t.false(r.isOpen())
    t.true(onBlur.calledOnce)
    t.is(countClickListeners(add, remove), 0)

    // re-open and unmount while open cleans up
    fireEvent.click(r.$('.dropdown-trigger') as HTMLElement)
    t.false(r.isSearchModeOn())
    t.is(countClickListeners(add, remove), 1)
    r.unmount()
    t.is(countClickListeners(add, remove), 0)
  } finally {
    add.restore()
    remove.restore()
  }
})

test('does not log React warnings', t => {
  const error = spy(console, 'error')
  const warn = spy(console, 'warn')
  try {
    ;(['multiSelect', 'simpleSelect', 'radioSelect', 'hierarchical'] as const).forEach(mode => {
      const r = renderDropdown(
        { data, mode, showDropdown: 'initial', texts: { label: 'test' }, showPartiallySelected: true },
        { wrapper: StrictMode }
      )
      fireEvent.click(r.$('.toggle.collapsed') as HTMLElement)
      r.search('child')
      r.keyDown(['ArrowDown', 'Enter'])
      r.setProps({ data: [...data], mode, showDropdown: 'initial' })
      clickOutside()
      r.unmount()
    })
    t.deepEqual(
      error.getCalls().map(c => c.args.join(' ')),
      []
    )
    t.deepEqual(
      warn.getCalls().map(c => c.args.join(' ')),
      []
    )
  } finally {
    error.restore()
    warn.restore()
  }
})

test('keeps expanded state when parent re-renders with the same data', t => {
  const Parent = () => {
    const [count, setCount] = useState(0)
    return (
      <div>
        <button id="rerender" onClick={() => setCount(count + 1)}>
          {count}
        </button>
        <DropdownTreeSelect id="rdts" data={data} showDropdown="always" />
      </div>
    )
  }
  const { container } = render(
    <StrictMode>
      <Parent />
    </StrictMode>
  )
  const nodes = () => container.querySelectorAll('li.node').length

  t.is(nodes(), 2)
  fireEvent.click(container.querySelector('#rdts-0_li .toggle') as HTMLElement)
  t.is(nodes(), 4)

  fireEvent.click(container.querySelector('#rerender') as HTMLElement)
  fireEvent.click(container.querySelector('#rerender') as HTMLElement)
  t.is((container.querySelector('#rerender') as HTMLElement).textContent, '2')
  t.is(nodes(), 4)
  t.truthy(container.querySelector('#rdts-0_li .toggle.expanded'))
})
