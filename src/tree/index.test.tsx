import test from 'ava'
import React from 'react'
import { render } from '@testing-library/react'
import TreeManager from '../tree-manager'
import Tree from './index'
import { TreeNodeProps } from '../types'

const noop = () => {}

const renderTree = (data: TreeNodeProps[], searchModeOn = false) => {
  const treeManager = new TreeManager({ data, rootPrefixId: 'rdts' })
  return render(
    <div>
      <Tree data={treeManager.tree} searchModeOn={searchModeOn} onNodeToggle={noop} onCheckboxChange={noop} />
    </div>
  )
}

const tree: TreeNodeProps[] = [
  {
    label: 'item1',
    value: 'value1',
    expanded: true,
    className: 'should-be-rendered',
    children: [
      {
        label: 'item1-1',
        value: 'value1-1',
        className: 'should-be-rendered',
        children: [
          { label: 'item1-1-1', value: 'value1-1-1', className: 'should-not-be-rendered' },
          { label: 'item1-1-2', value: 'value1-1-2', className: 'should-not-be-rendered' },
        ],
      },
      { label: 'item1-2', value: 'value1-2', className: 'should-be-rendered' },
    ],
  },
  {
    label: 'item2',
    value: 'value2',
    className: 'should-be-rendered',
    children: [
      {
        label: 'item2-1',
        value: 'value2-1',
        className: 'should-not-be-rendered',
        children: [{ label: 'item2-1-1', value: 'value2-1-1', className: 'should-not-be-rendered' }],
      },
    ],
  },
]

test('renders tree nodes when search mode is on', t => {
  const { container } = renderTree(tree, true)
  t.truthy(container.querySelector('ul.root.searchModeOn'))
  t.is(container.querySelectorAll('li.node').length, 8)
})

test('renders only expanded tree nodes when search mode is off', t => {
  const { container } = renderTree(tree)
  const root = container.querySelector('ul.root') as HTMLElement
  t.is(root.getAttribute('role'), 'tree')
  t.is(root.getAttribute('aria-multiselectable'), 'false')
  t.is(container.querySelectorAll('li.should-be-rendered').length, 4)
  t.is(container.querySelectorAll('li.should-not-be-rendered').length, 0)
})

test('paginates nodes', t => {
  const data = [...Array(250).keys()].map(i => ({ label: `l${i}`, value: `v${i}` }))
  const { container } = renderTree(data)
  t.is(container.querySelectorAll('li.node').length, 100)
  t.truthy(container.querySelector('ul.root > .infinite-scroll-component__outerdiv > .infinite-scroll-component'))
})
