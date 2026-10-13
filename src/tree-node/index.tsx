import PropTypes from 'prop-types'
import React, { memo, useContext } from 'react'

import { getDataset, isEmpty } from '../utils'
import Actions from './actions'
import NodeLabel from './node-label'
import Toggle from './toggle'
import ClassNamesContext from '../headless/ClassNamesContext'
import { DEFAULT_LOADING_TEXT, LoadingTextContext } from './loading-context'
import { isLazyNode } from '../tree-manager/addChildren'

import { InternalTreeNode, Mode, NodeAction } from '../types'

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
  /** Extra attributes for the rendered `li` (set by the virtualized tree: measuring ref, position, aria-setsize...) */
  liProps?: React.ComponentPropsWithRef<'li'> & { 'data-index'?: number }
}

const isLeaf = (children?: string[]) => isEmpty(children)

// a `hasChildren` node stays expandable until its (lazily loaded) children turn out to be empty
const isLazy = (props: TreeNodeComponentProps) => isLazyNode(props) && props.mode !== 'simpleSelect'

export const isLeafNode = (props: TreeNodeComponentProps) => isLeaf(props._children) && !isLazy(props)

export const getNodeCx = (props: TreeNodeComponentProps) => {
  const {
    keepTreeOnSearch,
    keepChildrenOnSearch,
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
    _loading: loading,
    _loadError: loadError,
  } = props
  const leaf = isLeafNode(props)

  return [
    'node',
    leaf && 'leaf',
    !leaf && 'tree',
    disabled && 'disabled',
    hide && 'hide',
    keepTreeOnSearch && matchInChildren && 'match-in-children',
    keepTreeOnSearch && keepChildrenOnSearch && matchInParent && 'match-in-parent',
    showPartiallySelected && partial && 'partial',
    readOnly && 'readOnly',
    checked && 'checked',
    focused && 'focused',
    loading && 'loading',
    loadError && 'load-error',
    className,
  ]
    .filter(Boolean)
    .join(' ')
}

export const getAriaAttributes = (props: TreeNodeComponentProps) => {
  const { _children, _depth, checked, disabled, expanded, readOnly, mode, partial, _loading } = props
  const attributes: Record<string, any> = {}

  attributes.role = mode === 'simpleSelect' ? 'option' : 'treeitem'
  attributes['aria-disabled'] = disabled || readOnly
  attributes['aria-selected'] = checked
  if (mode !== 'simpleSelect') {
    attributes['aria-checked'] = partial ? 'mixed' : checked
    attributes['aria-level'] = (_depth || 0) + 1
    attributes['aria-expanded'] = (isLazy(props) || _children) && (expanded ? 'true' : 'false')
  }
  if (_loading) attributes['aria-busy'] = true
  return attributes
}

const TreeNode = (props: TreeNodeComponentProps) => {
  const {
    mode,
    keepTreeOnSearch,
    _id,
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
    liProps,
    _loading: loading,
  } = props
  const loadingText = useContext(LoadingTextContext) || DEFAULT_LOADING_TEXT
  const { node: nodeClassName } = useContext(ClassNamesContext)
  const liCx = [getNodeCx(props), nodeClassName].filter(Boolean).join(' ')
  const style = keepTreeOnSearch || !searchModeOn ? { paddingLeft: `${(_depth || 0) * 20}px` } : {}

  const liId = `${_id}_li`
  const { style: extraStyle, ...extraLiProps } = liProps || {}

  return (
    <li
      className={liCx}
      style={extraStyle ? { ...style, ...extraStyle } : style}
      id={liId}
      {...getDataset(dataset)}
      {...getAriaAttributes(props)}
      {...extraLiProps}
    >
      <Toggle isLeaf={isLeafNode(props)} expanded={expanded} id={_id} onNodeToggle={onNodeToggle} />
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
      {loading && (
        <span className="node-loading" role="status">
          {loadingText}
        </span>
      )}
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
  hasChildren: PropTypes.bool,
  liProps: PropTypes.object,
}

export default memo(TreeNode)
