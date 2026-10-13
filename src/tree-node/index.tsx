import PropTypes from 'prop-types'
import React, { memo } from 'react'

import { getDataset, isEmpty } from '../utils'
import Actions from './actions'
import NodeLabel from './node-label'
import Toggle from './toggle'

import { InternalTreeNode, Mode, NodeAction } from '../types'

import './index.css'

export interface TreeNodeComponentProps extends InternalTreeNode {
  keepTreeOnSearch?: boolean
  keepChildrenOnSearch?: boolean
  searchModeOn?: boolean
  onNodeToggle: (id: string) => void
  onAction?: (nodeId: string, action: NodeAction) => void
  onCheckboxChange: (id: string, checked: boolean) => void
  onChange?: (...args: any[]) => void
  mode?: Mode
  showPartiallySelected?: boolean
  readOnly?: boolean
  clientId?: string
  activeDescendant?: string
}

const isLeaf = (children?: string[]) => isEmpty(children)

const getNodeCx = (props: TreeNodeComponentProps) => {
  const {
    keepTreeOnSearch,
    keepChildrenOnSearch,
    _children,
    matchInChildren,
    matchInParent,
    disabled,
    partial,
    hide,
    className,
    showPartiallySelected,
    readOnly,
    checked,
    _focused: focused,
  } = props

  return [
    'node',
    isLeaf(_children) && 'leaf',
    !isLeaf(_children) && 'tree',
    disabled && 'disabled',
    hide && 'hide',
    keepTreeOnSearch && matchInChildren && 'match-in-children',
    keepTreeOnSearch && keepChildrenOnSearch && matchInParent && 'match-in-parent',
    showPartiallySelected && partial && 'partial',
    readOnly && 'readOnly',
    checked && 'checked',
    focused && 'focused',
    className,
  ]
    .filter(Boolean)
    .join(' ')
}

const getAriaAttributes = ({
  _children,
  _depth,
  checked,
  disabled,
  expanded,
  readOnly,
  mode,
  partial,
}: TreeNodeComponentProps) => {
  const attributes: Record<string, any> = {}

  attributes.role = mode === 'simpleSelect' ? 'option' : 'treeitem'
  attributes['aria-disabled'] = disabled || readOnly
  attributes['aria-selected'] = checked
  if (mode !== 'simpleSelect') {
    attributes['aria-checked'] = partial ? 'mixed' : checked
    attributes['aria-level'] = (_depth || 0) + 1
    attributes['aria-expanded'] = _children && (expanded ? 'true' : 'false')
  }
  return attributes
}

const TreeNode = (props: TreeNodeComponentProps) => {
  const {
    mode,
    keepTreeOnSearch,
    _id,
    _children,
    dataset,
    _depth,
    expanded,
    title,
    label,
    partial,
    checked,
    value,
    disabled,
    actions,
    onAction,
    searchModeOn,
    onNodeToggle,
    onCheckboxChange,
    showPartiallySelected,
    readOnly,
    clientId,
  } = props
  const liCx = getNodeCx(props)
  const style = keepTreeOnSearch || !searchModeOn ? { paddingLeft: `${(_depth || 0) * 20}px` } : {}

  const liId = `${_id}_li`

  return (
    <li className={liCx} style={style} id={liId} {...getDataset(dataset)} {...getAriaAttributes(props)}>
      <Toggle isLeaf={isLeaf(_children)} expanded={expanded} id={_id} onNodeToggle={onNodeToggle} />
      <NodeLabel
        title={title}
        label={label}
        id={_id}
        partial={partial}
        checked={checked}
        value={value}
        disabled={disabled}
        mode={mode}
        onCheckboxChange={onCheckboxChange}
        showPartiallySelected={showPartiallySelected}
        readOnly={readOnly}
        clientId={clientId}
      />
      <Actions actions={actions} onAction={onAction} id={_id} readOnly={readOnly} />
    </li>
  )
}

TreeNode.propTypes = {
  _id: PropTypes.string.isRequired,
  _depth: PropTypes.number,
  _children: PropTypes.array,
  actions: PropTypes.array,
  className: PropTypes.string,
  title: PropTypes.string,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  checked: PropTypes.bool,
  expanded: PropTypes.bool,
  disabled: PropTypes.bool,
  partial: PropTypes.bool,
  dataset: PropTypes.object,
  keepTreeOnSearch: PropTypes.bool,
  keepChildrenOnSearch: PropTypes.bool,
  searchModeOn: PropTypes.bool,
  onNodeToggle: PropTypes.func,
  onAction: PropTypes.func,
  onCheckboxChange: PropTypes.func,
  mode: PropTypes.oneOf(['multiSelect', 'simpleSelect', 'radioSelect', 'hierarchical']),
  showPartiallySelected: PropTypes.bool,
  readOnly: PropTypes.bool,
  clientId: PropTypes.string,
}

export default memo(TreeNode)
