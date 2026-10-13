import test from 'ava'
import fs from 'fs'
import path from 'path'
import React from 'react'
import { cleanup, fireEvent, render } from '@testing-library/react'

import DropdownTreeSelect, {
  DropdownTreeSelectUnstyled as MainUnstyled,
  useDropdownTreeSelect as mainHook,
} from '../index'
import { DropdownTreeSelectHandle, DropdownTreeSelectUnstyled, useDropdownTreeSelect } from './index'
import { DropdownTreeSelectProps, TreeNodeProps } from '../types'

const data: TreeNodeProps[] = [
  {
    label: 'parent',
    value: 'parent',
    expanded: true,
    children: [
      { label: 'child 1', value: 'child1', checked: true },
      { label: 'child 2', value: 'child2' },
    ],
  },
  { label: 'other', value: 'other' },
]

test.afterEach.always(cleanup)

test('main entry re-exports the headless API', t => {
  t.is(MainUnstyled, DropdownTreeSelectUnstyled)
  t.is(mainHook, useDropdownTreeSelect)
})

const variants: Partial<DropdownTreeSelectProps>[] = [
  {},
  { mode: 'radioSelect', texts: { label: 'Pick' } },
  { mode: 'simpleSelect', inlineSearchInput: true },
  { mode: 'hierarchical', showPartiallySelected: true, className: 'mine', readOnly: true },
]

variants.forEach((variant, i) => {
  test(`renders the same markup as the styled component (${i})`, t => {
    const props = { id: 'rdts', data, showDropdown: 'always', ...variant } as DropdownTreeSelectProps
    const styled = render(<DropdownTreeSelect {...props} />).container.innerHTML
    cleanup()
    const unstyled = render(<DropdownTreeSelectUnstyled {...props} />).container.innerHTML
    t.is(unstyled, styled)
  })
})

test('adds the classNames to the rendered elements', t => {
  const classNames = {
    root: 'c-root',
    dropdown: 'c-dropdown',
    trigger: 'c-trigger',
    tags: 'c-tags',
    tag: 'c-tag',
    input: 'c-input',
    content: 'c-content',
    tree: 'c-tree',
    node: 'c-node',
    toggle: 'c-toggle',
    checkbox: 'c-checkbox',
    label: 'c-label',
  }
  const { container } = render(
    <DropdownTreeSelectUnstyled id="rdts" data={data} showDropdown="always" classNames={classNames} />
  )
  const expected: Record<string, [string, number]> = {
    root: ['div.react-dropdown-tree-select', 1],
    dropdown: ['div.dropdown', 1],
    trigger: ['.dropdown-trigger', 1],
    tags: ['ul.tag-list', 1],
    tag: ['span.tag', 1],
    input: ['input.search', 1],
    content: ['div.dropdown-content', 1],
    tree: ['ul.root', 1],
    node: ['li.node', 4],
    toggle: ['.toggle', 4],
    checkbox: ['input.checkbox-item', 4],
    label: ['li.node > label', 4],
  }
  Object.entries(expected).forEach(([key, [selector, count]]) => {
    const className = classNames[key as keyof typeof classNames]
    t.is(container.querySelectorAll(`${selector}.${className}`).length, count, key)
  })
  t.is(container.querySelectorAll('.c-checkbox').length, 4)
})

test('radio inputs get the checkbox class name', t => {
  const { container } = render(
    <DropdownTreeSelectUnstyled
      data={data}
      mode="radioSelect"
      showDropdown="always"
      classNames={{ checkbox: 'c-radio' }}
    />
  )
  t.is(container.querySelectorAll('input.radio-item.c-radio').length, 4)
})

test('forwards the legacy ref handle', t => {
  const ref = React.createRef<DropdownTreeSelectHandle>()
  const { container } = render(<DropdownTreeSelectUnstyled ref={ref} data={data} />)
  const handle = ref.current as DropdownTreeSelectHandle
  t.is(handle.node, container.querySelector('.react-dropdown-tree-select'))
  t.is(handle.searchInput, container.querySelector('input.search'))
  t.is(container.querySelector('.dropdown-content'), null)
  fireEvent.click(container.querySelector('.dropdown-trigger') as HTMLElement)
  t.truthy(container.querySelector('.dropdown-content'))
})

const resolveModule = (from: string, request: string) => {
  const base = path.resolve(path.dirname(from), request)
  const candidates = [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')]
  return candidates.find(file => fs.existsSync(file) && fs.statSync(file).isFile()) as string
}

test('the headless entry does not import any CSS', t => {
  const visited = new Set<string>()
  const css: string[] = []
  const walk = (file: string) => {
    if (visited.has(file)) return
    visited.add(file)
    const source = fs.readFileSync(file, 'utf8')
    const requests = Array.from(source.matchAll(/(?:from|import)\s+'(\.[^']+)'/g), m => m[1])
    requests.forEach(request => {
      if (/\.css$/.test(request)) css.push(`${path.relative(__dirname, file)} -> ${request}`)
      else walk(resolveModule(file, request))
    })
  }
  walk(resolveModule(__filename, './index'))
  t.true(visited.size > 10)
  t.deepEqual(css, [])
})
