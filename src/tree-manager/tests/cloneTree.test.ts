import test from 'ava'
import cloneTree from '../cloneTree'
import generateLargeTree from '../../tree/generateLargeTree'

const jsonClone = (value: unknown) => JSON.parse(JSON.stringify(value))

test('produces the same result as a JSON round trip', t => {
  const date = new Date(Date.UTC(2020, 1, 2))
  const data: any = [
    {
      label: 'a',
      value: 'a',
      checked: true,
      expanded: undefined,
      count: 1,
      nan: NaN,
      infinite: Infinity,
      empty: null,
      fn: () => {},
      sym: Symbol('s'),
      date,
      dataset: { foo: 'bar', nested: { deep: [1, undefined, () => {}] } },
      actions: [{ className: 'fa fa-info', title: 'info', onClick: () => {} }],
      withToJSON: { toJSON: () => 'serialized' },
      dropped: { toJSON: () => undefined },
      children: [
        { label: 'b', value: 'b', children: [{ label: 'c', value: 'c' }, null, undefined, () => {}, 'text', 3] },
        { label: 'd', value: 'd', children: [] },
      ],
    },
    { label: 'e', value: 'e', children: { label: 'not an array', value: 'x' } },
    { toJSON: () => ({ label: 'custom', value: 'custom' }) },
  ]

  t.deepEqual(cloneTree(data), jsonClone(data))
})

test('clones a single root object', t => {
  const data = { label: 'a', value: 'a', children: [{ label: 'b', value: 'b' }] }
  const clone = cloneTree(data)
  t.deepEqual(clone, jsonClone(data))
  t.not(clone, data)
  t.not(clone.children, data.children)
  t.not(clone.children[0], data.children[0])
})

test('does not share nested objects with the source', t => {
  const data = [{ label: 'a', value: 'a', dataset: { x: 1 } }]
  const clone = cloneTree(data)
  clone[0].dataset.x = 2
  t.is(data[0].dataset.x, 1)
})

test('matches a JSON round trip on a large generated tree', t => {
  const data = generateLargeTree({ roots: 5, children: 5, leaves: 5, expanded: true })
  t.deepEqual(cloneTree(data), jsonClone(data))
})
