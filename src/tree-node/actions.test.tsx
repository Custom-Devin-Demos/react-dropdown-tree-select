import { render } from '@testing-library/react'
import React from 'react'
import test from 'ava'

import Actions from './actions'

test('renders actions', t => {
  const actions = [
    {
      title: 'action',
      className: 'cn0-0-0',
      text: 'hello',
      junk: '1',
    },
  ]

  const { container } = render(<Actions actions={actions} id="snapshot" />)
  t.is(container.querySelectorAll('i.cn0-0-0').length, 1)
  t.snapshot(container.innerHTML)
})

test('returns null if actions are empty', t => {
  t.is(render(<Actions actions={undefined} id="snapshot1" />).container.innerHTML, '')
  t.is(render(<Actions actions={[]} id="snapshot2" />).container.innerHTML, '')
})
