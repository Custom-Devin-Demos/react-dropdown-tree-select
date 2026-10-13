import test from 'ava'
import { renderHook } from '@testing-library/react'
import { spy } from 'sinon'

import { act, cleanup, fireEvent, renderDropdown } from './test-utils'
import { useDropdownTreeSelect } from './headless'
import generateLargeTree from './tree/generateLargeTree'
import { DropdownTreeSelectProps, TreeNode, TreeNodeProps } from './types'

const VIEWPORT = 300
const ROW = 30
const OVERSCAN = 5
// rows in the viewport + overscan on both sides (+1 for a partially visible row, +1 for a detached focused row)
const MAX_ROWS = Math.ceil(VIEWPORT / ROW) + 2 * OVERSCAN + 2
const virtualized = { itemHeight: ROW, overscan: OVERSCAN, height: VIEWPORT }

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

interface Deferred {
  promise: Promise<TreeNodeProps[]>
  resolve: (children: TreeNodeProps[]) => void
  reject: (error: unknown) => void
}

const deferred = (): Deferred => {
  const d = {} as Deferred
  d.promise = new Promise((resolve, reject) => {
    d.resolve = resolve
    d.reject = reject
  })
  return d
}

const flush = () => act(() => new Promise<void>(resolve => setTimeout(resolve, 0)))

const lazyChildren = (parent: string, count: number): TreeNodeProps[] =>
  Array.from({ length: count }, (_, i) => ({ label: `${parent} ${i}`, value: `${parent}-${i}`, hasChildren: true }))

// a lazy root on top of a fully expanded 100k-node tree
const bigLazyTree = (): TreeNodeProps[] => [
  { label: 'Lazy', value: 'lazy', hasChildren: true },
  ...(generateLargeTree({ expanded: true }) as TreeNodeProps[]),
]

const setup = (props: Partial<DropdownTreeSelectProps> = {}) => {
  const loads: Deferred[] = []
  const loadChildren = spy((node: TreeNode) => {
    void node
    const d = deferred()
    loads.push(d)
    return d.promise
  })
  const r = renderDropdown({
    id: 'rdts',
    data: bigLazyTree(),
    showDropdown: 'always',
    virtualized,
    loadChildren,
    ...props,
  })
  const rows = () => r.$$('li.node')
  const lazyLi = () => r.$('#rdts-0_li') as HTMLLIElement
  const viewport = () => r.$('.virtualized-viewport') as HTMLDivElement
  const scrollTo = (top: number) => {
    viewport().scrollTop = top
    fireEvent.scroll(viewport())
  }
  return { ...r, loads, loadChildren, rows, lazyLi, viewport, scrollTo }
}

test('expanding a lazy node of a virtualized 100k tree keeps the DOM at viewport size', async t => {
  const r = setup()
  t.true(r.rows().length <= MAX_ROWS, `${r.rows().length} rows`)
  t.true(r.lazyLi().classList.contains('tree'))
  t.is(r.lazyLi().getAttribute('aria-expanded'), 'false')

  fireEvent.click(r.lazyLi().querySelector('.toggle') as HTMLElement)
  t.true(r.loadChildren.calledOnce)
  const li = r.lazyLi()
  t.true(li.classList.contains('loading'))
  t.is(li.getAttribute('aria-busy'), 'true')
  t.is(li.getAttribute('aria-expanded'), 'true')
  t.is((li.querySelector('.node-loading') as HTMLElement).textContent, 'Loading...')
  t.true(r.rows().length <= MAX_ROWS)

  r.loads[0].resolve(lazyChildren('Lazy', 1000))
  await flush()

  t.false(r.lazyLi().classList.contains('loading'))
  t.is(r.lazyLi().getAttribute('aria-busy'), null)
  const rows = r.rows()
  t.true(rows.length <= MAX_ROWS, `${rows.length} rows after load`)
  t.is((rows[1].querySelector('.node-label') as HTMLElement).textContent, 'Lazy 0')
  t.is(rows[1].getAttribute('aria-setsize'), '1000')
  t.is(rows[1].getAttribute('aria-level'), '2')
  // the loaded children are lazy themselves
  t.true(rows[1].classList.contains('tree'))
  // 1 lazy root + 1000 loaded + 101,100 generated rows, minus the rendered ones, are represented by padding
  const root = r.$('ul.root') as HTMLElement
  t.is(root.style.paddingBottom, `${(1 + 1000 + 101100 - rows.length) * ROW}px`)
})

test('scrolling into loaded children and expanding a nested lazy node stays windowed', async t => {
  const r = setup()
  fireEvent.click(r.lazyLi().querySelector('.toggle') as HTMLElement)
  r.loads[0].resolve(lazyChildren('Lazy', 1000))
  await flush()

  // row 500 is "Lazy 499"
  act(() => r.scrollTo(500 * ROW))
  const labels = r.rows().map(li => (li.querySelector('.node-label') as HTMLElement).textContent)
  t.true(labels.includes('Lazy 499'), labels.join(', '))
  t.false(labels.includes('Lazy 0'))
  t.true(r.rows().length <= MAX_ROWS)

  const nested = r.$('#rdts-0-499_li') as HTMLLIElement
  fireEvent.click(nested.querySelector('.toggle') as HTMLElement)
  t.is(r.loadChildren.callCount, 2)
  t.is((r.loadChildren.secondCall.args[0] as TreeNode).label, 'Lazy 499')
  t.true((r.$('#rdts-0-499_li') as HTMLElement).classList.contains('loading'))

  r.loads[1].resolve([{ label: 'deep', value: 'deep' }])
  await flush()
  const deep = r.$('#rdts-0-499-0_li') as HTMLLIElement
  t.truthy(deep, 'nested child rendered in place')
  t.is(deep.getAttribute('aria-level'), '3')
  t.true(r.rows().length <= MAX_ROWS)

  // far down: the generated part of the tree
  act(() => r.scrollTo(90000 * ROW))
  t.true(r.rows().length <= MAX_ROWS)
  t.true(r.rows().every(li => /^(Root|Node|Leaf) /.test(li.textContent as string)))
})

test('a checked lazy parent checks the loaded children in the virtualized tree', async t => {
  const onChange = spy()
  const r = setup({ onChange })
  fireEvent.click(r.lazyLi().querySelector('.checkbox-item') as HTMLElement)
  t.true(onChange.calledOnce)
  fireEvent.click(r.lazyLi().querySelector('.toggle') as HTMLElement)
  r.loads[0].resolve(lazyChildren('Lazy', 50))
  await flush()
  const child = r.$('#rdts-0-0_li') as HTMLLIElement
  t.true(child.classList.contains('checked'))
  t.true((child.querySelector('input') as HTMLInputElement).checked)
})

test('a failed load in the virtualized tree collapses the node and reports the error', async t => {
  const onLoadChildrenError = spy()
  const r = setup({ onLoadChildrenError })
  fireEvent.click(r.lazyLi().querySelector('.toggle') as HTMLElement)
  const error = new Error('boom')
  r.loads[0].reject(error)
  await flush()
  const li = r.lazyLi()
  t.true(li.classList.contains('load-error'))
  t.is(li.getAttribute('aria-expanded'), 'false')
  t.true(onLoadChildrenError.calledOnce)
  t.is((onLoadChildrenError.firstCall.args[0] as TreeNode).label, 'Lazy')
  t.is(onLoadChildrenError.firstCall.args[1], error)
  t.true(r.rows().length <= MAX_ROWS)

  // retry
  fireEvent.click(li.querySelector('.toggle') as HTMLElement)
  t.is(r.loadChildren.callCount, 2)
})

test('keyboard navigation into lazily loaded rows keeps the active descendant rendered', async t => {
  const r = setup()
  r.keyDown(['ArrowDown'])
  t.is(r.searchInput().getAttribute('aria-activedescendant'), 'rdts-0_li')
  r.keyDown('ArrowRight')
  t.true(r.loadChildren.calledOnce)
  r.loads[0].resolve(lazyChildren('Lazy', 1000))
  await flush()

  r.keyDown(Array(40).fill('ArrowDown'))
  const activeId = r.searchInput().getAttribute('aria-activedescendant') as string
  t.is(activeId, 'rdts-0-39_li')
  const active = document.getElementById(activeId) as HTMLElement
  t.truthy(active)
  t.true(active.classList.contains('focused'))
  t.true(r.rows().length <= MAX_ROWS)
})

test('the headless hook exposes the loading state and accepts virtualized + loadChildren', async t => {
  const loads: Deferred[] = []
  const loadChildren = (node: TreeNode) => {
    void node
    const d = deferred()
    loads.push(d)
    return d.promise
  }
  const { result } = renderHook(p => useDropdownTreeSelect(p), {
    initialProps: {
      id: 'rdts',
      data: [{ label: 'Lazy', value: 'lazy', hasChildren: true }],
      virtualized,
      loadChildren,
    } as DropdownTreeSelectProps,
  })
  const lazy = () => result.current.tree[0]
  t.false(lazy().isLeaf)
  t.false(lazy().loading)
  t.is(result.current.getToggleProps(lazy()).style, undefined)

  act(() => result.current.toggleNode(lazy().id))
  t.true(lazy().loading)
  const nodeProps = result.current.getNodeProps(lazy())
  t.regex(nodeProps.className, /\bloading\b/)
  t.is(nodeProps['aria-busy'], true)

  loads[0].reject(new Error('nope'))
  await flush()
  t.false(lazy().loading)
  t.true(lazy().loadError)
  t.regex(result.current.getNodeProps(lazy()).className, /\bload-error\b/)

  act(() => result.current.toggleNode(lazy().id))
  loads[1].resolve([{ label: 'child', value: 'child' }])
  await flush()
  t.deepEqual(
    result.current.tree.map(n => n.label),
    ['Lazy', 'child']
  )
  t.true(result.current.tree[1].isLeaf)
})
