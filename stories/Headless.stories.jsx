import React from 'react'

import { DropdownTreeSelectUnstyled, useDropdownTreeSelect } from '../src/headless'
import { actionArgs, hiddenArgTypes } from './actions'
import data from './data/simple.json'
import './headless.css'

const meta = {
  title: 'Headless/Headless API',
  component: DropdownTreeSelectUnstyled,
  argTypes: { ...hiddenArgTypes },
  args: { ...actionArgs(), data },
}

export default meta

export const UnstyledComponent = {
  name: 'Unstyled Component',
  args: {
    texts: { placeholder: 'Search...' },
    classNames: {
      root: 'hl-root',
      trigger: 'hl-trigger',
      tags: 'hl-tags',
      tag: 'hl-tag',
      content: 'hl-content',
      tree: 'hl-tree',
      node: 'hl-node',
      toggle: 'hl-toggle',
      label: 'hl-label',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          '`DropdownTreeSelectUnstyled` (from `react-dropdown-tree-select/headless`) renders the default markup without importing any CSS. ' +
          'This example styles it from scratch using the `classNames` prop.',
      },
    },
  },
}

const ChipsSelect = props => {
  const {
    tree,
    tags,
    isOpen,
    searchTerm,
    allNodesHidden,
    getRootProps,
    getTriggerProps,
    getInputProps,
    getListProps,
    getNodeProps,
    getCheckboxProps,
    getToggleProps,
    getTagProps,
    getTagRemoveProps,
  } = useDropdownTreeSelect(props)

  return (
    <div {...getRootProps({ className: 'chips' })}>
      <div {...getTriggerProps({ className: 'chips-trigger' })}>
        {tags.map(tag => (
          <span key={tag.id} {...getTagProps(tag, { className: 'chip' })}>
            {tag.label}
            <button {...getTagRemoveProps(tag, { className: 'chip-remove' })}>×</button>
          </span>
        ))}
        <input {...getInputProps({ className: 'chips-input', placeholder: tags.length ? '' : 'Pick some fruits' })} />
      </div>
      {isOpen && (
        <ul {...getListProps({ className: 'chips-list' })}>
          {allNodesHidden && <li className="chips-empty">Nothing matches “{searchTerm}”</li>}
          {tree.map(node => (
            <li
              key={node.id}
              {...getNodeProps(node, {
                className: 'chips-node',
                style: { paddingLeft: `${node.depth * 1.25 + 0.5}rem` },
              })}
            >
              {node.isLeaf ? (
                <span className="chips-toggle" />
              ) : (
                <button {...getToggleProps(node, { className: 'chips-toggle' })}>{node.expanded ? '▾' : '▸'}</button>
              )}
              <label>
                <input {...getCheckboxProps(node)} /> {node.label}
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export const CustomUI = {
  name: 'Custom UI with useDropdownTreeSelect',
  render: args => <ChipsSelect {...args} />,
  args: { keepTreeOnSearch: true, showPartiallySelected: true },
  parameters: {
    docs: {
      description: {
        story:
          'A "chips" UI built only with the state, actions and prop getters returned by `useDropdownTreeSelect`. ' +
          'Keyboard navigation, search, outside click and tag removal come from the prop getters.',
      },
    },
  },
}
