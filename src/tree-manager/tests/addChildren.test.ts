import test from 'ava'
import TreeManager from '..'
import { isLazyNode } from '../addChildren'
import { Mode, TreeNodeProps } from '../../types'

const lazyData = (): TreeNodeProps[] => [
  { label: 'a', value: 'a', hasChildren: true },
  { label: 'b', value: 'b', children: [{ label: 'b1', value: 'b1' }] },
]

const kids = (...labels: string[]): TreeNodeProps[] => labels.map(label => ({ label, value: label }))

const create = (mode?: Mode, showPartiallySelected?: boolean, data = lazyData()) =>
  new TreeManager({ data, mode, showPartiallySelected, rootPrefixId: 'r' })

test('adds children with flattenTree ids, depth, links and render order', t => {
  const tm = create()
  t.true(isLazyNode(tm.getNodeById('r-0')))

  const added = tm.addChildren('r-0', [
    { label: 'a1', value: 'a1', children: [{ label: 'a11', value: 'a11' }] },
    { label: 'a2', value: 'a2', id: 'custom' },
  ])

  t.deepEqual(
    added.map(n => n._id),
    ['r-0-0', 'r-0-0-0', 'custom']
  )
  t.deepEqual(Array.from(tm.tree.keys()), ['r-0', 'r-0-0', 'r-0-0-0', 'custom', 'r-1', 'r-1-0'])
  t.deepEqual(tm.getNodeById('r-0')._children, ['r-0-0', 'custom'])
  t.is(tm.getNodeById('r-0-0')._parent, 'r-0')
  t.is(tm.getNodeById('r-0-0-0')._parent, 'r-0-0')
  t.is(tm.getNodeById('r-0-0')._depth, 1)
  t.is(tm.getNodeById('r-0-0-0')._depth, 2)
  t.is(tm.getNodeById('r-0-0').children, undefined)
  t.false(isLazyNode(tm.getNodeById('r-0')))
})

test('appends after existing descendants with unique ids', t => {
  const tm = create()
  tm.addChildren('r-1', kids('b2'))
  t.deepEqual(tm.getNodeById('r-1')._children, ['r-1-0', 'r-1-1'])
  t.deepEqual(Array.from(tm.tree.keys()), ['r-0', 'r-1', 'r-1-0', 'r-1-1'])
})

test('does not mutate the loaded objects', t => {
  const tm = create()
  const children = [{ label: 'a1', value: 'a1', children: [{ label: 'a11', value: 'a11' }] }]
  tm.addChildren('r-0', children)
  t.deepEqual(children, [{ label: 'a1', value: 'a1', children: [{ label: 'a11', value: 'a11' }] }])
})

test('empty result marks the node as loaded', t => {
  const tm = create()
  t.deepEqual(tm.addChildren('r-0', []), [])
  t.false(isLazyNode(tm.getNodeById('r-0')))
  t.is(tm.tree.size, 3)
})

test('throws for unknown parents', t => {
  const tm = create()
  t.throws(() => tm.addChildren('nope', kids('x')), { message: /nope/ })
})

test('multiSelect: children of a checked parent are checked and the parent stays the only tag', t => {
  const data = lazyData()
  data[0].checked = true
  const tm = create('multiSelect', false, data)
  tm.addChildren('r-0', kids('a1', 'a2'))
  t.true(tm.getNodeById('r-0-0').checked)
  t.true(tm.getNodeById('r-0-1').checked)
  t.deepEqual(
    tm.tags.map(n => n._id),
    ['r-0']
  )
})

test('multiSelect: disabled is inherited', t => {
  const data = lazyData()
  data[0].disabled = true
  const tm = create('multiSelect', false, data)
  tm.addChildren('r-0', kids('a1'))
  t.true(tm.getNodeById('r-0-0').disabled)
})

test('multiSelect: an explicitly unchecked child unchecks the checked ancestors', t => {
  const data: TreeNodeProps[] = [
    { label: 'g', value: 'g', checked: true, children: [{ label: 'p', value: 'p', hasChildren: true }] },
  ]
  const tm = create('multiSelect', false, data)
  tm.addChildren('r-0-0', [
    { label: 'c1', value: 'c1' },
    { label: 'c2', value: 'c2', checked: false },
  ])
  t.false(tm.getNodeById('r-0-0').checked)
  t.false(tm.getNodeById('r-0').checked)
  t.deepEqual(
    tm.tags.map(n => n._id),
    ['r-0-0-0']
  )
})

test('showPartiallySelected: partial state is recomputed on the ancestors', t => {
  const data: TreeNodeProps[] = [
    {
      label: 'g',
      value: 'g',
      children: [
        { label: 'p', value: 'p', hasChildren: true },
        { label: 'q', value: 'q' },
      ],
    },
  ]
  const tm = create('multiSelect', true, data)
  tm.addChildren('r-0-0', [
    { label: 'c1', value: 'c1', checked: true },
    { label: 'c2', value: 'c2' },
  ])
  t.true(tm.getNodeById('r-0-0').partial)
  t.false(tm.getNodeById('r-0-0').checked)
  t.true(tm.getNodeById('r-0').partial)

  tm.setNodeCheckedState('r-0-0-1', true)
  t.true(tm.getNodeById('r-0-0').checked)
  t.false(tm.getNodeById('r-0-0').partial)
})

test('showPartiallySelected: all loaded children checked checks the parent', t => {
  const tm = create('multiSelect', true)
  tm.addChildren('r-0', [{ label: 'a1', value: 'a1', checked: true }])
  t.true(tm.getNodeById('r-0').checked)
  t.false(tm.getNodeById('r-0').partial)
})

test('isDefaultValue on loaded children is honoured', t => {
  const tm = create('multiSelect')
  tm.addChildren('r-0', [
    { label: 'a1', value: 'a1', isDefaultValue: true },
    { label: 'a2', value: 'a2' },
  ])
  t.true(tm.getNodeById('r-0-0').checked)
  t.deepEqual(tm.defaultValues, ['r-0-0'])
  tm.setNodeCheckedState('r-0-0', false)
  tm.restoreDefaultValues()
  t.true(tm.getNodeById('r-0-0').checked)
})

test('hierarchical: nothing is inherited from the parent', t => {
  const data = lazyData()
  data[0].checked = true
  data[0].disabled = true
  const tm = create('hierarchical', true, data)
  tm.addChildren('r-0', kids('a1'))
  const child = tm.getNodeById('r-0-0')
  t.falsy(child.checked)
  t.falsy(child.disabled)
  t.true(tm.getNodeById('r-0').checked)
})

test('radioSelect: checked is not inherited and a loaded selection is taken when nothing is selected', t => {
  const data = lazyData()
  data[0].disabled = true
  const tm = create('radioSelect', false, data)
  tm.addChildren('r-0', [
    { label: 'a1', value: 'a1', checked: true },
    { label: 'a2', value: 'a2', checked: true },
  ])
  t.true(tm.getNodeById('r-0-0').checked)
  t.false(tm.getNodeById('r-0-1').checked)
  t.true(tm.getNodeById('r-0-0').disabled)
  t.is(tm.currentChecked, 'r-0-0')
  t.deepEqual(
    tm.tags.map(n => n._id),
    ['r-0-0']
  )
})

test('radioSelect: an existing selection wins over loaded checked nodes', t => {
  const data = lazyData()
  data[1].checked = true
  const tm = create('radioSelect', true, data)
  tm.addChildren('r-0', [{ label: 'a1', value: 'a1', isDefaultValue: true }])
  t.false(tm.getNodeById('r-0-0').checked)
  t.is(tm.currentChecked, 'r-1')
  t.falsy(tm.getNodeById('r-0').partial)
})

test('radioSelect + showPartiallySelected: partial state is set on the parent of the loaded selection', t => {
  const tm = create('radioSelect', true)
  tm.addChildren('r-0', [
    { label: 'a1', value: 'a1', checked: true },
    { label: 'a2', value: 'a2' },
  ])
  t.true(tm.getNodeById('r-0').partial)
  t.falsy(tm.getNodeById('r-0').checked)
})

test('simpleSelect: children are ignored', t => {
  const tm = create('simpleSelect')
  t.deepEqual(tm.addChildren('r-0', kids('a1')), [])
  t.false(tm.tree.has('r-0-0'))
})

test('loaded nodes become searchable', t => {
  const tm = create()
  t.true(tm.filterTree('a1').allNodesHidden)
  tm.addChildren('r-0', kids('a1'))
  const { allNodesHidden, tree } = tm.filterTree('a1')
  t.false(allNodesHidden)
  t.deepEqual(Array.from(tree.keys()), ['r-0-0'])
})
