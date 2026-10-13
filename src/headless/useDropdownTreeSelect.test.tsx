import test from 'ava'
import React from 'react'
import { act, cleanup, fireEvent, render, renderHook } from '@testing-library/react'
import { spy } from 'sinon'

import { useDropdownTreeSelect, UseDropdownTreeSelectResult } from './index'
import { DropdownTreeSelectProps, TreeNodeProps } from '../types'

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

const byLabel = (result: UseDropdownTreeSelectResult, label: string) => {
  const node = result.tree.find(n => n.label === label)
  if (!node) throw new Error(`node ${label} is not visible`)
  return node
}

const setup = (props: Partial<DropdownTreeSelectProps> = {}) =>
  renderHook(p => useDropdownTreeSelect(p), { initialProps: { id: 'rdts', data, ...props } as DropdownTreeSelectProps })

test.afterEach.always(cleanup)

test('exposes the initial state', t => {
  const { result } = setup()
  const r = result.current
  t.is(r.clientId, 'rdts')
  t.false(r.isOpen)
  t.false(r.searchModeOn)
  t.is(r.searchTerm, '')
  t.false(r.allNodesHidden)
  t.is(r.activeDescendant, undefined)
  t.deepEqual(r.tags, [])
  t.deepEqual(
    r.tree.map(({ label, depth, isLeaf, expanded, checked, partial, focused }) => ({
      label,
      depth,
      isLeaf,
      expanded,
      checked,
      partial,
      focused,
    })),
    [
      { label: 'parent', depth: 0, isLeaf: false, expanded: false, checked: false, partial: false, focused: false },
      { label: 'other', depth: 0, isLeaf: true, expanded: false, checked: false, partial: false, focused: false },
    ]
  )
  t.is(byLabel(r, 'parent').node.value, 'parent')
})

test('open, close and toggle the dropdown', t => {
  const { result } = setup()
  act(() => result.current.open())
  t.true(result.current.isOpen)
  act(() => result.current.open())
  t.true(result.current.isOpen)
  act(() => result.current.close())
  t.false(result.current.isOpen)
  act(() => result.current.toggle())
  t.true(result.current.isOpen)
  act(() => result.current.toggle())
  t.false(result.current.isOpen)
})

test('honours showDropdown', t => {
  const { result } = setup({ showDropdown: 'initial' })
  t.true(result.current.isOpen)
})

test('toggleNode expands and collapses nodes', t => {
  const onNodeToggle = spy()
  const { result } = setup({ onNodeToggle })
  act(() => result.current.toggleNode(byLabel(result.current, 'parent').id))
  t.deepEqual(
    result.current.tree.map(n => [n.label, n.depth]),
    [
      ['parent', 0],
      ['child 1', 1],
      ['child 2', 1],
      ['other', 0],
    ]
  )
  t.true(byLabel(result.current, 'parent').expanded)
  t.is(byLabel(result.current, 'child 1').parentId, byLabel(result.current, 'parent').id)
  t.true(onNodeToggle.calledOnce)

  act(() => result.current.toggleNode(byLabel(result.current, 'parent').id))
  t.is(result.current.tree.length, 2)
})

test('checkNode and removeTag update tags and call onChange', t => {
  const onChange = spy()
  const { result } = setup({ onChange, showPartiallySelected: true })
  act(() => result.current.toggleNode(byLabel(result.current, 'parent').id))
  act(() => result.current.checkNode(byLabel(result.current, 'child 1').id, true))

  t.deepEqual(
    result.current.tags.map(tag => tag.label),
    ['child 1']
  )
  t.true(byLabel(result.current, 'child 1').checked)
  t.true(byLabel(result.current, 'parent').partial)
  t.true(onChange.calledOnce)
  t.is(onChange.lastCall.args[0].label, 'child 1')

  act(() => result.current.checkNode(byLabel(result.current, 'child 2').id, true))
  t.deepEqual(
    result.current.tags.map(tag => tag.label),
    ['parent']
  )

  act(() => result.current.removeTag(result.current.tags[0].id))
  t.deepEqual(result.current.tags, [])
  t.false(byLabel(result.current, 'parent').checked)
  t.is(onChange.callCount, 3)
})

test('setSearch filters the visible nodes', t => {
  const { result } = setup()
  act(() => result.current.setSearch('child 2'))
  t.true(result.current.searchModeOn)
  t.is(result.current.searchTerm, 'child 2')
  t.deepEqual(
    result.current.tree.map(n => n.label),
    ['child 2']
  )

  act(() => result.current.setSearch('nothing'))
  t.true(result.current.allNodesHidden)

  act(() => result.current.setSearch(''))
  t.false(result.current.searchModeOn)
  t.is(result.current.searchTerm, '')
  t.deepEqual(
    result.current.tree.map(n => n.label),
    ['parent', 'other']
  )
})

test('keepTreeOnSearch keeps the ancestors of matches visible', t => {
  const { result } = setup({ keepTreeOnSearch: true })
  act(() => result.current.setSearch('child 2'))
  t.deepEqual(
    result.current.tree.map(n => n.label),
    ['parent', 'child 2']
  )
})

test('prop getters carry the ids and a11y attributes of the default markup', t => {
  const { result } = setup({ texts: { label: 'Pick' } })
  const r = result.current
  const parent = byLabel(r, 'parent')

  t.like(r.getRootProps(), { id: 'rdts', className: 'react-dropdown-tree-select' })
  t.like(r.getTriggerProps(), {
    id: 'rdts_trigger',
    role: 'button',
    tabIndex: 0,
    'aria-haspopup': 'tree',
    'aria-expanded': 'false',
    'aria-label': 'Pick',
  })
  t.like(r.getInputProps(), { className: 'search', 'aria-autocomplete': 'list', placeholder: 'Choose...' })
  t.like(r.getListProps(), { className: 'root', role: 'tree', 'aria-multiselectable': false })
  t.like(r.getNodeProps(parent), {
    id: `${parent.id}_li`,
    role: 'treeitem',
    'aria-level': 1,
    'aria-expanded': 'false',
    className: 'node tree',
  })
  t.like(r.getCheckboxProps(parent), { type: 'checkbox', id: parent.id, checked: false, tabIndex: -1 })
  t.like(r.getToggleProps(parent), { className: 'toggle collapsed', role: 'button', 'aria-hidden': true })
  t.like(r.getToggleProps(byLabel(r, 'other')), { style: { visibility: 'hidden' } })
})

test('prop getters merge user props', t => {
  const { result } = setup()
  const onClick = spy()
  const ref = React.createRef<HTMLElement>()
  const props = result.current.getTriggerProps({ className: 'mine', onClick, ref, title: 'x', style: { color: 'red' } })
  t.is(props.className, 'dropdown-trigger arrow bottom mine')
  t.is(props.title, 'x')
  t.deepEqual(props.style, { color: 'red' })

  const el = document.createElement('a')
  props.ref(el)
  t.is(ref.current, el)

  document.body.appendChild(el)
  el.focus()
  act(() => props.onClick({ key: undefined, nativeEvent: {} }))
  document.body.removeChild(el)
  t.true(onClick.calledOnce)
  t.true(result.current.isOpen)
})

test('getTagRemoveProps is disabled for readOnly / disabled', t => {
  const { result } = setup({ data: { label: 'a', value: 'a', checked: true }, readOnly: true })
  const tag = result.current.tags[0]
  t.like(result.current.getTagProps(tag), { id: `${tag.id}_tag`, className: 'tag', 'aria-label': 'a' })
  t.like(result.current.getTagRemoveProps(tag), {
    'aria-disabled': true,
    onClick: undefined,
    className: 'tag-remove readOnly',
  })
})

const CustomUI = (props: DropdownTreeSelectProps) => {
  const ds = useDropdownTreeSelect(props)
  return (
    <div {...ds.getRootProps({ className: 'custom' })}>
      <div {...ds.getTriggerProps()}>
        {ds.tags.map(tag => (
          <span key={tag.id} {...ds.getTagProps(tag)}>
            {tag.label}
            <button {...ds.getTagRemoveProps(tag)}>remove</button>
          </span>
        ))}
        <input {...ds.getInputProps()} />
      </div>
      {ds.isOpen && (
        <ul {...ds.getListProps()}>
          {ds.tree.map(node => (
            <li key={node.id} {...ds.getNodeProps(node)}>
              {!node.isLeaf && <i {...ds.getToggleProps(node)} />}
              <label>
                <input {...ds.getCheckboxProps(node)} />
                {node.label}
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const renderCustom = (props: Partial<DropdownTreeSelectProps> = {}) => {
  const utils = render(<CustomUI id="rdts" data={data} {...props} />)
  const $ = <E extends Element = HTMLElement>(selector: string) => utils.container.querySelector(selector) as E
  const $$ = (selector: string) => Array.from(utils.container.querySelectorAll(selector))
  const labels = () => $$('li').map(li => li.textContent)
  const tags = () => $$('.tag').map(tag => tag.textContent)
  return { ...utils, $, $$, labels, tags, input: () => $<HTMLInputElement>('input.search') }
}

test('custom UI: open, expand and select with the mouse', t => {
  const onChange = spy()
  const { $, $$, labels, tags } = renderCustom({ onChange })
  t.is($$('li').length, 0)

  fireEvent.click($('.dropdown-trigger'))
  t.deepEqual(labels(), ['parent', 'other'])

  fireEvent.click($('.toggle'))
  t.deepEqual(labels(), ['parent', 'child 1', 'child 2', 'other'])

  fireEvent.click($$('input.checkbox-item')[1])
  t.deepEqual(tags(), ['child 1remove'])
  t.true(onChange.calledOnce)
  t.is($('li.node.partial') === null, true)
  t.is($('.dropdown-trigger').getAttribute('aria-labelledby'), `${$$('.tag')[0].id}`)
})

test('custom UI: search', async t => {
  const { input, labels } = renderCustom({ showDropdown: 'initial' })
  fireEvent.change(input(), { target: { value: 'child 1' } })
  await act(() => new Promise(resolve => setTimeout(resolve, 350)))
  t.deepEqual(labels(), ['child 1'])
  t.truthy(input().closest('div')!.parentElement!.querySelector('ul.root.searchModeOn'))
})

test('custom UI: keyboard navigation', t => {
  const onChange = spy()
  const { input, $, tags } = renderCustom({ onChange })
  fireEvent.keyDown(input(), { key: 'ArrowDown' })
  t.truthy($('ul.root'))
  const focused = $('li.focused')
  t.truthy(focused)
  t.is(input().getAttribute('aria-activedescendant'), focused.id)
  t.is(focused.textContent, 'parent')

  fireEvent.keyDown(input(), { key: 'ArrowRight' })
  fireEvent.keyDown(input(), { key: 'ArrowDown' })
  t.is($('li.focused').textContent, 'child 1')

  fireEvent.keyDown(input(), { key: 'Enter' })
  t.deepEqual(tags(), ['child 1remove'])
  t.true(onChange.calledOnce)
})

test('custom UI: tag remove', t => {
  const onChange = spy()
  const { $, tags } = renderCustom({
    onChange,
    data: [
      { label: 'a', value: 'a', checked: true },
      { label: 'b', value: 'b' },
    ],
  })
  t.deepEqual(tags(), ['aremove'])
  fireEvent.click($('.tag-remove'))
  t.deepEqual(tags(), [])
  t.true(onChange.calledOnce)
})
