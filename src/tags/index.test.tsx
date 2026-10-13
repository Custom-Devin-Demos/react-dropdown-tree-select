import { render } from '@testing-library/react'
import React from 'react'
import test from 'ava'

import Tags from './index'
import Input from '../input'
import { InternalTreeNode } from '../types'

const noop = () => {}
const tagsOf = (tags: Partial<InternalTreeNode>[]) => tags as InternalTreeNode[]

test('renders tags', t => {
  const tags = tagsOf([
    { _id: 'i1', label: 'l1' },
    { _id: 'i2', label: 'l2' },
  ])
  const { container } = render(
    <Tags tags={tags} onTagRemove={noop}>
      <Input onInputChange={noop} />
    </Tags>
  )
  t.is(container.querySelectorAll('.tag').length, 2)
  t.truthy(container.querySelector('.tag-list > li:last-child > input.search'))
  t.snapshot(container.innerHTML)
})

test('renders tags when no tags are passed', t => {
  const { container } = render(
    <Tags onTagRemove={noop}>
      <Input onInputChange={noop} />
    </Tags>
  )
  t.is(container.querySelectorAll('.tag').length, 0)
  t.truthy(container.querySelector('input.search'))
})

test('renders tags when no tags are passed nor Input', t => {
  const { container } = render(<Tags onTagRemove={noop} />)
  t.is((container.querySelector('.placeholder') as HTMLElement).textContent, 'Choose...')
})

test('should render data attributes', t => {
  const tags = tagsOf([
    {
      _id: 'i1',
      label: 'l1',
      tagClassName: 'test',
      dataset: {
        first: 'john',
        last: 'smith',
      },
    },
  ])

  const { container } = render(<Tags tags={tags} onTagRemove={noop} />)
  const item = container.querySelector('.tag-item.test') as HTMLElement
  t.is(item.getAttribute('data-first'), 'john')
  t.is(item.getAttribute('data-last'), 'smith')
})

test('should render the tagLabel instead of label when provided', t => {
  const tags = tagsOf([
    { _id: 'i1', label: 'l1', tagLabel: 'custom label' },
    { _id: 'i2', label: 'l2' },
  ])
  const { container } = render(<Tags tags={tags} onTagRemove={noop} />)
  const labels = Array.from(container.querySelectorAll('.tag')).map(n => n.getAttribute('aria-label'))
  t.deepEqual(labels, ['custom label', 'l2'])
})
