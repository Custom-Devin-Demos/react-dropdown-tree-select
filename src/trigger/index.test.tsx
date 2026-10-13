import { render } from '@testing-library/react'
import React from 'react'
import test from 'ava'

import Trigger from './index'

test('Trigger component', t => {
  const { container } = render(<Trigger clientId={'rtds'} onTrigger={() => {}} />)
  const a = container.querySelector('a') as HTMLElement
  t.is(a.id, 'rtds_trigger')
  t.is(a.className, 'dropdown-trigger arrow bottom')
  t.is(a.getAttribute('aria-expanded'), 'false')
  t.snapshot(container.innerHTML)
})
