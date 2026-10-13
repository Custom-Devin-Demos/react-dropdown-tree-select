import test from 'ava'
import React from 'react'
import { act, cleanup, fireEvent, render } from '@testing-library/react'

import TreeManager from '../tree-manager'
import Tree from './index'
import { getVisibleRows } from './virtualized'
import { renderDropdown } from '../test-utils'
import generateLargeTree from './generateLargeTree'

const noop = () => {}
const VIEWPORT = 300
const ROW = 30
const OVERSCAN = 10
// rows in the viewport + overscan below it (+1 for a partially visible row)
const MAX_ROWS = Math.ceil(VIEWPORT / ROW) + 2 * OVERSCAN + 1
// rows rendered when scrolled to the top: viewport + overscan below it
const TOP_ROWS = VIEWPORT / ROW + OVERSCAN

let originalOffsetHeight: PropertyDescriptor | undefined

test.before(() => {
  // jsdom has no layout: the scroll element reports the viewport height and every row a fixed height
  originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get() {
      if (this.classList.contains('virtualized-viewport')) return VIEWPORT
      if (this.tagName === 'LI') return ROW
      return 0
    },
  })
})

test.after.always(() => {
  if (originalOffsetHeight) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalOffsetHeight)
})

test.afterEach.always(cleanup)

const virtualized = { itemHeight: ROW, overscan: OVERSCAN, height: VIEWPORT }

test('renders only the rows around the viewport of a 100k-node tree', t => {
  const data = generateLargeTree({ expanded: true })
  const treeManager = new TreeManager({ data, rootPrefixId: 'rdts' })
  const { container } = render(
    <div>
      <Tree data={treeManager.tree} onNodeToggle={noop} onCheckboxChange={noop} virtualized={virtualized} />
    </div>
  )

  const root = container.querySelector('ul.root') as HTMLElement
  const rows = container.querySelectorAll('li.node')
  t.true(rows.length > 0)
  t.true(rows.length <= MAX_ROWS, `${rows.length} rows rendered`)
  t.is(root.getAttribute('role'), 'tree')
  t.is(root.getAttribute('aria-multiselectable'), 'false')
  t.true(root.classList.contains('virtualized'))
  const viewport = root.parentElement as HTMLElement
  t.true(viewport.classList.contains('virtualized-viewport'))
  t.is(viewport.style.maxHeight, `${VIEWPORT}px`)
  t.is(viewport.style.overflowY, 'auto')
  // the remaining (not rendered) rows are represented by padding
  t.is(root.style.paddingTop, '0px')
  t.is(root.style.paddingBottom, `${(treeManager.tree.size - rows.length) * ROW}px`)
  t.falsy(container.querySelector('.infinite-scroll-component'))
})

test('sets aria-setsize, aria-posinset and aria-level on rendered rows', t => {
  const data = generateLargeTree({ roots: 3, children: 2, leaves: 4, expanded: true })
  const treeManager = new TreeManager({ data, rootPrefixId: 'rdts' })
  const { container } = render(
    <Tree data={treeManager.tree} onNodeToggle={noop} onCheckboxChange={noop} virtualized={virtualized} />
  )

  const attrs = (id: string) => {
    const li = container.querySelector(`[id="${id}_li"]`) as HTMLElement
    return ['aria-setsize', 'aria-posinset', 'aria-level', 'data-index'].map(a => li.getAttribute(a))
  }
  t.deepEqual(attrs('rdts-0'), ['3', '1', '1', '0'])
  t.deepEqual(attrs('rdts-0-1'), ['2', '2', '2', '6'])
  t.deepEqual(attrs('rdts-0-1-3'), ['4', '4', '3', '10'])
})

test('uses the full row count as the set size of a simpleSelect listbox', t => {
  const data = [...Array(50).keys()].map(i => ({ label: `l${i}`, value: `v${i}` }))
  const treeManager = new TreeManager({ data, mode: 'simpleSelect', rootPrefixId: 'rdts' })
  const { container } = render(
    <Tree
      data={treeManager.tree}
      mode="simpleSelect"
      onNodeToggle={noop}
      onCheckboxChange={noop}
      virtualized={virtualized}
    />
  )
  t.is(container.querySelector('ul.root')!.getAttribute('role'), 'listbox')
  const first = container.querySelector('li.node') as HTMLElement
  t.is(first.getAttribute('aria-setsize'), '50')
  t.is(first.getAttribute('aria-posinset'), '1')
})

test('getVisibleRows skips collapsed branches and css-hidden rows', t => {
  const data = [
    {
      label: 'a',
      value: 'a',
      expanded: true,
      children: [
        { label: 'a1', value: 'a1', children: [{ label: 'a1x', value: 'a1x' }] },
        { label: 'a2', value: 'a2' },
      ],
    },
    { label: 'b', value: 'b', children: [{ label: 'b1', value: 'b1' }] },
  ]
  const treeManager = new TreeManager({ data, rootPrefixId: 'r' })
  t.deepEqual(
    getVisibleRows(treeManager.tree).nodes.map(n => n.label),
    ['a', 'a1', 'a2', 'b']
  )

  const { tree } = treeManager.filterTree('x', true)
  const rows = getVisibleRows(tree, true, true)
  // ancestors of a match are kept (match-in-children) when keepTreeOnSearch
  t.deepEqual(
    rows.nodes.map(n => n.label),
    ['a', 'a1', 'a1x']
  )
  // ...and hidden by css (so skipped) without keepTreeOnSearch
  t.deepEqual(
    getVisibleRows(tree, true, false).nodes.map(n => n.label),
    ['a1x']
  )
})

test('search and expand/collapse recompute the virtualized rows', async t => {
  const data = generateLargeTree({ roots: 50, children: 10, leaves: 20 })
  const { $, $$, search } = renderDropdown({ data, showDropdown: 'always', virtualized })

  t.is($$('li.node').length, TOP_ROWS)
  t.is($('li.node')!.getAttribute('aria-setsize'), '50')

  fireEvent.click($('[id$="-0_li"] .toggle')!)
  t.is($$('li.node')[1].textContent, 'Node 0-0')
  t.is($('[id$="-0-0_li"]')!.getAttribute('aria-setsize'), '10')

  search('leaf 7-3-')
  t.true($('ul.root')!.classList.contains('searchModeOn'))
  const rows = $$('li.node')
  t.is(rows.length, TOP_ROWS)
  t.true(rows.every(li => /^Leaf 7-3-/.test(li.textContent as string)))
  t.is(rows[0].getAttribute('aria-setsize'), '20')

  search('')
  // the search input is debounced (leading edge only)
  await act(() => new Promise(resolve => setTimeout(resolve, 350)))
  t.false($('ul.root')!.classList.contains('searchModeOn'))
  t.is($$('li.node')[1].textContent, 'Node 0-0')
})

test('keyboard navigation keeps the active descendant rendered', t => {
  const data = generateLargeTree({ roots: 20, children: 10, leaves: 10, expanded: true })
  const { $, $$, searchInput, keyDown } = renderDropdown({ data, showDropdown: 'always', virtualized })

  keyDown('End')
  const activeId = searchInput().getAttribute('aria-activedescendant') as string
  t.truthy(activeId)
  const active = document.getElementById(activeId) as HTMLElement
  t.truthy(active, 'focused row is rendered')
  t.true(active.classList.contains('focused'))
  t.is(active.textContent, 'Leaf 19-9-9')
  t.true($$('li.node').length <= MAX_ROWS + 1)

  keyDown('ArrowUp')
  const next = document.getElementById(searchInput().getAttribute('aria-activedescendant') as string) as HTMLElement
  t.is(next.textContent, 'Leaf 19-9-8')
  t.truthy($('li.focused'))
})

test('keeps the infinite scroll markup when virtualized is off', t => {
  const data = [...Array(250).keys()].map(i => ({ label: `l${i}`, value: `v${i}` }))
  const { $, $$ } = renderDropdown({ data, showDropdown: 'always', virtualized: false })
  t.is($$('li.node').length, 100)
  t.truthy($('ul.root > .infinite-scroll-component__outerdiv > .infinite-scroll-component'))
  t.false($('ul.root')!.classList.contains('virtualized'))
})
