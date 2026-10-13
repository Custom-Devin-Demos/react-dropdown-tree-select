import React from 'react'
import { fn } from '@storybook/test'

import DropdownTreeSelect from '../src'
import { actionArgs, hiddenArgTypes } from './actions'

const regions = ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania']

const data = regions.map(region => ({ label: region, value: region.toLowerCase(), hasChildren: true }))

// Every loaded node is lazy again, up to three levels deep
const makeChildren = node => {
  const depth = node.value.split('/').length
  return Array.from({ length: 4 }, (_, i) => ({
    label: `${node.label} ${i + 1}`,
    value: `${node.value}/${i + 1}`,
    hasChildren: depth < 3,
  }))
}

const createLoader =
  ({ latency, failureRate }) =>
  node =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < failureRate) reject(new Error(`Could not load the children of ${node.label}`))
        else resolve(makeChildren(node))
      }, latency)
    })

const meta = {
  title: 'Features/Lazy Loading',
  component: DropdownTreeSelect,
  argTypes: {
    ...hiddenArgTypes,
    loadChildren: { control: false },
    onLoadChildrenError: { table: { category: 'Events' } },
    latency: { control: { type: 'range', min: 0, max: 5000, step: 100 }, description: 'Simulated latency (ms)' },
    randomFailures: { control: 'boolean', description: 'Make half of the loads fail at random' },
  },
  args: {
    ...actionArgs(),
    onLoadChildrenError: fn().mockName('onLoadChildrenError'),
    showDropdown: 'initial',
    showPartiallySelected: true,
    latency: 1000,
    randomFailures: false,
    texts: { placeholder: 'Choose...', loadingChildren: 'Loading...' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Nodes flagged with `hasChildren` fetch their children with `loadChildren` the first time they are expanded. ' +
          'Failed loads collapse the node again, add the `load-error` class and are retried on the next expand. ' +
          'Search only covers nodes that have been loaded.',
      },
    },
  },
}

export default meta

const LazyLoadingExample = ({ latency, randomFailures, ...args }) => {
  const loadChildren = React.useMemo(
    () => createLoader({ latency, failureRate: randomFailures ? 0.5 : 0 }),
    [latency, randomFailures]
  )
  return <DropdownTreeSelect data={data} {...args} loadChildren={loadChildren} />
}

export const LazyLoading = {
  name: 'Lazy Loading',
  render: args => <LazyLoadingExample {...args} />,
}

export const WithRandomFailures = {
  name: 'With Random Failures',
  args: { randomFailures: true, latency: 600 },
  render: args => <LazyLoadingExample {...args} />,
}
