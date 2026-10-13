import { fireEvent, render } from '@testing-library/react'
import { spy } from 'sinon'
import React from 'react'
import test from 'ava'

import TreeNode, { TreeNodeComponentProps } from './index'

const noop = () => {}
const baseNode: TreeNodeComponentProps = {
  onNodeToggle: noop,
  onCheckboxChange: noop,
  _id: '0-0-0',
  _parent: '0-0',
  label: 'item0-0-0',
  value: 'value0-0-0',
  className: 'cn0-0-0',
}

const renderNode = (props: Partial<TreeNodeComponentProps>) => {
  const { container } = render(
    <ul>
      <TreeNode {...baseNode} {...props} />
    </ul>
  )
  return { container, li: container.querySelector('li') as HTMLLIElement }
}

const hasGap = (li: HTMLLIElement) => !!li.style.paddingLeft

test('renders tree node', t => {
  const { container, li } = renderNode({
    actions: [
      {
        id: 'NOT',
        title: 'NOT',
        className: 'fa fa-ban',
      },
    ],
  })
  t.is(li.id, '0-0-0_li')
  t.is(li.className, 'node leaf cn0-0-0')
  t.truthy(li.querySelector('i.fa-ban'))
  t.snapshot(container.innerHTML)
  t.true(hasGap(li))
})

test('notifies node toggle changes', t => {
  const onChange = spy()
  const { li } = renderNode({ _children: ['0-0-1', '0-0-2'], onNodeToggle: onChange })
  fireEvent.click(li.querySelector('.toggle') as HTMLElement)
  t.true(onChange.calledWith('0-0-0'))
})

test('can toggle with enter and space', t => {
  ;[{ key: 'Enter' }, { keyCode: 32 }].forEach(event => {
    const onChange = spy()
    const { li } = renderNode({ _children: ['0-0-1', '0-0-2'], onNodeToggle: onChange })
    fireEvent.keyDown(li.querySelector('.toggle') as HTMLElement, event)
    t.true(onChange.calledWith('0-0-0'))
  })
})

test('remove gap during search', t => {
  const { li } = renderNode({ searchModeOn: true })
  t.false(hasGap(li))
})

test('disable checkbox if the node has disabled status', t => {
  const { li } = renderNode({ disabled: true, searchModeOn: true })
  t.true(li.classList.contains('disabled'))
  t.is(li.getAttribute('aria-disabled'), 'true')
})

test('should render data attributes', t => {
  const { li } = renderNode({ dataset: { first: 'john', last: 'smith' } })
  t.is(li.getAttribute('data-first'), 'john')
  t.is(li.getAttribute('data-last'), 'smith')
})

test('should set aria-selected to true for selected node', t => {
  const { li } = renderNode({ checked: true, mode: 'simpleSelect' })
  t.is(li.getAttribute('role'), 'option')
  t.is(li.getAttribute('aria-selected'), 'true')
  t.false(li.hasAttribute('aria-checked'))
})

test('should set aria-selected to false for selected nods', t => {
  const { li } = renderNode({ checked: false, mode: 'simpleSelect' })
  t.is(li.getAttribute('aria-selected'), 'false')
})

test('should set aria-checked to true for checked nodes', t => {
  const { li } = renderNode({ checked: true })
  t.is(li.getAttribute('role'), 'treeitem')
  t.is(li.getAttribute('aria-checked'), 'true')
  t.is(li.getAttribute('aria-level'), '1')
})

test('should set aria-checked to false for unchecked nodes', t => {
  const { li } = renderNode({ checked: false })
  t.is(li.getAttribute('aria-checked'), 'false')
})

test('should set aria-checked to mixed for partial nodes', t => {
  const { li } = renderNode({ partial: true })
  t.is(li.getAttribute('aria-checked'), 'mixed')
})

test('should set aria-expanded for parent nodes', t => {
  t.is(renderNode({ _children: ['a'], expanded: true }).li.getAttribute('aria-expanded'), 'true')
  t.is(renderNode({ _children: ['a'] }).li.getAttribute('aria-expanded'), 'false')
})
