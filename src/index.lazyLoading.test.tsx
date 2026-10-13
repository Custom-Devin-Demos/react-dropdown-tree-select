import test from 'ava'
import React, { StrictMode } from 'react'
import { spy, stub } from 'sinon'

import { act, cleanup, fireEvent, renderDropdown } from './test-utils'
import { DropdownTreeSelectProps, TreeNode, TreeNodeProps } from './types'

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

const data = (): TreeNodeProps[] => [
  { label: 'lazy', value: 'lazy', hasChildren: true },
  { label: 'other', value: 'other' },
]

const children: TreeNodeProps[] = [
  { label: 'child 1', value: 'child1' },
  { label: 'child 2', value: 'child2' },
]

const flush = () => act(() => new Promise<void>(resolve => setTimeout(resolve, 0)))

const setup = (props: Partial<DropdownTreeSelectProps> = {}, options?: Parameters<typeof renderDropdown>[1]) => {
  const loads: Deferred[] = []
  const loadChildren = spy((node: TreeNode) => {
    void node
    const d = deferred()
    loads.push(d)
    return d.promise
  })
  const r = renderDropdown({ id: 'rdts', data: data(), showDropdown: 'always', loadChildren, ...props }, options)
  const lazyLi = () => r.$('#rdts-0_li') as HTMLLIElement
  const toggle = () => fireEvent.click(lazyLi().querySelector('.toggle') as HTMLElement)
  const labels = () => r.$$('li.node').map(li => (li.querySelector('.node-label') as HTMLElement).textContent)
  return { ...r, loads, loadChildren, lazyLi, toggle, labels }
}

test.afterEach.always(cleanup)

test('renders hasChildren nodes as expandable', t => {
  const r = setup()
  const li = r.lazyLi()
  t.true(li.classList.contains('tree'))
  t.false(li.classList.contains('leaf'))
  t.is(li.getAttribute('aria-expanded'), 'false')
  t.truthy(li.querySelector('.toggle.collapsed'))
  t.false(r.loadChildren.called)
})

test('shows the loading state while pending and inserts the children on resolve', async t => {
  const onNodeToggle = spy()
  const r = setup({ onNodeToggle })
  r.toggle()

  t.true(r.loadChildren.calledOnce)
  t.is(r.loadChildren.firstCall.args[0].value, 'lazy')
  t.true(onNodeToggle.calledOnce)
  const li = r.lazyLi()
  t.true(li.classList.contains('loading'))
  t.is(li.getAttribute('aria-busy'), 'true')
  t.is(li.getAttribute('aria-expanded'), 'true')
  t.truthy(li.querySelector('.toggle.expanded'))
  t.is((li.querySelector('.node-loading') as HTMLElement).textContent, 'Loading...')

  r.loads[0].resolve(children)
  await flush()

  const loaded = r.lazyLi()
  t.false(loaded.classList.contains('loading'))
  t.is(loaded.getAttribute('aria-busy'), null)
  t.is(loaded.querySelector('.node-loading'), null)
  t.deepEqual(r.labels(), ['lazy', 'child 1', 'child 2', 'other'])
  t.is((r.$('#rdts-0-0_li') as HTMLElement).getAttribute('aria-level'), '2')
})

test('uses texts.loadingChildren', t => {
  const r = setup({ texts: { loadingChildren: 'Fetching…' } })
  r.toggle()
  t.is((r.$('.node-loading') as HTMLElement).textContent, 'Fetching…')
})

test('does not load again after collapsing and expanding a loaded node', async t => {
  const r = setup()
  r.toggle()
  r.loads[0].resolve(children)
  await flush()
  r.toggle()
  t.deepEqual(r.labels(), ['lazy', 'other'])
  r.toggle()
  t.deepEqual(r.labels(), ['lazy', 'child 1', 'child 2', 'other'])
  t.true(r.loadChildren.calledOnce)
})

test('dedupes in-flight loads per node', async t => {
  const r = setup()
  r.toggle()
  r.toggle()
  r.toggle()
  t.true(r.loadChildren.calledOnce)
  r.loads[0].resolve(children)
  await flush()
  t.deepEqual(r.labels(), ['lazy', 'child 1', 'child 2', 'other'])
})

test('a node collapsed while loading stays collapsed once loaded', async t => {
  const r = setup()
  r.toggle()
  r.toggle()
  r.loads[0].resolve(children)
  await flush()
  t.deepEqual(r.labels(), ['lazy', 'other'])
  t.is(r.lazyLi().getAttribute('aria-expanded'), 'false')
})

test('collapses, flags the node and reports the error on reject; retries on the next expand', async t => {
  const onLoadChildrenError = spy()
  const r = setup({ onLoadChildrenError })
  r.toggle()
  const error = new Error('boom')
  r.loads[0].reject(error)
  await flush()

  const li = r.lazyLi()
  t.true(li.classList.contains('load-error'))
  t.false(li.classList.contains('loading'))
  t.is(li.getAttribute('aria-expanded'), 'false')
  t.true(onLoadChildrenError.calledOnce)
  t.is(onLoadChildrenError.firstCall.args[0].value, 'lazy')
  t.is(onLoadChildrenError.firstCall.args[1], error)

  r.toggle()
  t.true(r.loadChildren.calledTwice)
  t.false(r.lazyLi().classList.contains('load-error'))
  r.loads[1].resolve(children)
  await flush()
  t.deepEqual(r.labels(), ['lazy', 'child 1', 'child 2', 'other'])
})

test('treats a synchronous throw like a rejection', async t => {
  const onLoadChildrenError = spy()
  const error = new Error('sync')
  const r = setup({
    onLoadChildrenError,
    loadChildren: () => {
      throw error
    },
  })
  r.toggle()
  await flush()
  t.true(r.lazyLi().classList.contains('load-error'))
  t.is(onLoadChildrenError.firstCall.args[1], error)
})

test('children of a checked parent are checked in multiSelect', async t => {
  const d = data()
  d[0].checked = true
  const r = setup({ data: d })
  r.toggle()
  r.loads[0].resolve(children)
  await flush()
  t.true((r.$('#rdts-0-0') as HTMLInputElement).checked)
  t.true((r.$('#rdts-0-1') as HTMLInputElement).checked)
  t.is(r.tags().length, 1)
})

test('recomputes partial state with showPartiallySelected', async t => {
  const r = setup({ showPartiallySelected: true })
  r.toggle()
  r.loads[0].resolve([
    { label: 'child 1', value: 'child1', checked: true },
    { label: 'child 2', value: 'child2' },
  ])
  await flush()
  t.true(r.lazyLi().classList.contains('partial'))
  t.is(r.lazyLi().getAttribute('aria-checked'), 'mixed')
  t.is(r.tags().length, 1)
})

test('ArrowRight on a lazy node triggers the load', async t => {
  const r = setup()
  r.keyDown(['ArrowDown', 'ArrowRight'])
  t.true(r.loadChildren.calledOnce)
  t.true(r.lazyLi().classList.contains('loading'))
  r.loads[0].resolve(children)
  await flush()
  r.keyDown('ArrowRight')
  t.is((r.focused() as HTMLElement).id, 'rdts-0-0_li')
})

test('loads nodes that start out expanded', async t => {
  const d = data()
  d[0].expanded = true
  const r = setup({ data: d })
  t.true(r.loadChildren.calledOnce)
  r.loads[0].resolve([{ label: 'child 1', value: 'child1', hasChildren: true, expanded: true }])
  await flush()
  t.true(r.loadChildren.calledTwice)
  t.is(r.loadChildren.secondCall.args[0].value, 'child1')
})

test('ignores results after unmount', async t => {
  const consoleError = stub(console, 'error')
  try {
    const onLoadChildrenError = spy()
    const r = setup({ onLoadChildrenError })
    r.toggle()
    r.unmount()
    r.loads[0].resolve(children)
    await flush()
    const r2 = setup({ onLoadChildrenError })
    r2.toggle()
    r2.unmount()
    r2.loads[0].reject(new Error('late'))
    await flush()
    t.false(onLoadChildrenError.called)
    t.false(consoleError.called)
  } finally {
    consoleError.restore()
  }
})

test('ignores results when data was replaced while loading', async t => {
  const r = setup()
  r.toggle()
  const loadChildren = r.loadChildren
  r.setProps({ id: 'rdts', data: data(), showDropdown: 'always', loadChildren })
  r.loads[0].resolve(children)
  await flush()
  t.deepEqual(r.labels(), ['lazy', 'other'])
  t.false(r.lazyLi().classList.contains('loading'))
  // the new tree loads on its own
  r.toggle()
  t.true(loadChildren.calledTwice)
})

test('loads once and applies the result under StrictMode', async t => {
  const consoleError = stub(console, 'error')
  try {
    const d = data()
    d[0].expanded = true
    const r = setup({ data: d }, { wrapper: StrictMode })
    t.true(r.loadChildren.calledOnce)
    r.loads[0].resolve(children)
    await flush()
    t.deepEqual(r.labels(), ['lazy', 'child 1', 'child 2', 'other'])
    t.false(consoleError.called)
  } finally {
    consoleError.restore()
  }
})

test('without loadChildren hasChildren nodes just toggle', t => {
  const r = renderDropdown({ id: 'rdts', data: data(), showDropdown: 'always' })
  fireEvent.click((r.$('#rdts-0_li') as HTMLElement).querySelector('.toggle') as HTMLElement)
  const li = r.$('#rdts-0_li') as HTMLElement
  t.is(li.getAttribute('aria-expanded'), 'true')
  t.false(li.classList.contains('loading'))
})

test('hasChildren is ignored in simpleSelect', t => {
  const r = setup({ mode: 'simpleSelect' })
  t.true(r.lazyLi().classList.contains('leaf'))
  t.is(r.loadChildren.callCount, 0)
})

test('search only covers loaded nodes', async t => {
  const before = setup()
  before.search('child')
  t.truthy(before.$('.no-matches'))
  before.unmount()

  const r = setup()
  r.toggle()
  r.loads[0].resolve(children)
  await flush()
  r.search('child')
  t.deepEqual(r.labels(), ['child 1', 'child 2'])
})

test('unused props keep markup unchanged', t => {
  const r = renderDropdown({ id: 'rdts', data: [{ label: 'x', value: 'x' }], showDropdown: 'always' })
  const li = r.$('#rdts-0_li') as HTMLElement
  t.is(li.className, 'node leaf')
  t.is(li.getAttribute('aria-busy'), null)
  t.is(r.$('.node-loading'), null)
  void React
})
