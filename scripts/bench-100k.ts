/* eslint-disable no-console */
/**
 * Benchmarks the TreeManager and the initial dropdown render on a generated 100k-node tree
 * (100 roots × 10 children × 100 leaves = 101,100 nodes).
 *
 *   yarn bench
 *
 * Render timings run in jsdom: they show relative cost (React work, DOM node count), not real browser paint times.
 */
import 'jsdom-global/register'
import 'ignore-styles'
import { performance } from 'perf_hooks'
import React from 'react'
import { act } from 'react-dom/test-utils'
import { createRoot } from 'react-dom/client'

import TreeManager from '../src/tree-manager'
import DropdownTreeSelect from '../src'
import generateLargeTree, { countNodes } from '../src/tree/generateLargeTree'
;(global as any).IS_REACT_ACT_ENVIRONMENT = true
// silence act() warnings about the async virtualizer measurements
console.error = () => {}

const RUNS = Number(process.env.BENCH_RUNS || 5)

// jsdom has no layout: give the scroll container (`.virtualized-viewport`) a 300px viewport and rows 32px so the virtualizer windows like a browser
Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
  configurable: true,
  get() {
    if (this.classList.contains('virtualized-viewport')) return 300
    if (this.tagName === 'LI') return 32
    return 0
  },
})

const time = (fn: () => void) => {
  const start = performance.now()
  fn()
  return performance.now() - start
}

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

const results: Array<{ scenario: string; 'median (ms)': string; 'min (ms)': string; info?: string }> = []

const bench = (scenario: string, setup: () => any, run: (ctx: any) => string | void) => {
  const timings: number[] = []
  let info: string | void = undefined
  for (let i = 0; i < RUNS; i++) {
    const ctx = setup()
    const start = performance.now()
    info = run(ctx)
    timings.push(performance.now() - start)
  }
  results.push({
    scenario,
    'median (ms)': median(timings).toFixed(1),
    'min (ms)': Math.min(...timings).toFixed(1),
    info: info || '',
  })
}

const data = generateLargeTree()
const expandedData = generateLargeTree({ expanded: true })
console.log(`nodes: ${countNodes(data).toLocaleString()}, runs per scenario: ${RUNS}`)

const createManager = (d = data, options = {}) => new TreeManager({ data: d, rootPrefixId: 'rdts', ...options })

bench(
  'TreeManager: construct (multiSelect)',
  () => null,
  () => {
    createManager()
  }
)
bench(
  'TreeManager: construct (showPartiallySelected)',
  () => null,
  () => {
    createManager(data, { showPartiallySelected: true })
  }
)
bench(
  'TreeManager: construct (radioSelect)',
  () => null,
  () => {
    createManager(data, { mode: 'radioSelect' })
  }
)
bench('search: "leaf 42-7-9" (cold)', createManager, (tm: TreeManager) => {
  const { tree } = tm.filterTree('leaf 42-7-9')
  return `${tree.size} visible`
})
bench('search: "7" (cold, broad)', createManager, (tm: TreeManager) => {
  const { tree } = tm.filterTree('7')
  return `${tree.size} visible`
})
bench('search: "7" keepTreeOnSearch + keepChildrenOnSearch', createManager, (tm: TreeManager) => {
  const { tree } = tm.filterTree('7', true, true)
  return `${tree.size} visible`
})
bench(
  'search: "leaf 4" -> "leaf 42" (incremental)',
  () => {
    const tm = createManager()
    tm.filterTree('leaf 4')
    return tm
  },
  (tm: TreeManager) => {
    const { tree } = tm.filterTree('leaf 42')
    return `${tree.size} visible`
  }
)
bench('toggle: expand root', createManager, (tm: TreeManager) => {
  tm.toggleNodeExpandState('rdts-0')
})
bench(
  'toggle: collapse fully expanded tree roots (×100)',
  () => createManager(expandedData),
  (tm: TreeManager) => {
    for (let r = 0; r < 100; r++) tm.toggleNodeExpandState(`rdts-${r}`)
  }
)
bench('check: root (1,011 nodes) + tags', createManager, (tm: TreeManager) => {
  tm.setNodeCheckedState('rdts-0', true)
  return `${tm.tags.length} tags`
})
bench('check: every root + tags', createManager, (tm: TreeManager) => {
  for (let r = 0; r < 100; r++) tm.setNodeCheckedState(`rdts-${r}`, true)
  return `${tm.tags.length} tags`
})

const renderOpen = (props: Record<string, unknown>) => {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  let count = 0
  const elapsed = time(() => {
    act(() => {
      root.render(React.createElement(DropdownTreeSelect, { showDropdown: 'always', ...props } as any))
    })
    count = container.querySelectorAll('li.node').length
  })
  act(() => root.unmount())
  container.remove()
  return { elapsed, count }
}

const benchRender = (scenario: string, props: Record<string, unknown>) => {
  const timings: number[] = []
  let count = 0
  for (let i = 0; i < RUNS; i++) {
    const r = renderOpen(props)
    timings.push(r.elapsed)
    count = r.count
  }
  results.push({
    scenario,
    'median (ms)': median(timings).toFixed(1),
    'min (ms)': Math.min(...timings).toFixed(1),
    info: `${count} <li> rendered`,
  })
}

benchRender('render open: collapsed (default)', { data })
benchRender('render open: collapsed (virtualized)', { data, virtualized: true })
benchRender('render open: all expanded (default, paged)', { data: expandedData })
benchRender('render open: all expanded (virtualized)', { data: expandedData, virtualized: true })

console.table(results)
