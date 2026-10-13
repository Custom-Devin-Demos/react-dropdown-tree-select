import flattenTree from './flatten-tree'
import getPartialState from './getPartialState'
import { isEmpty } from '../utils'
import { InternalTreeNode, TreeNodeMap, TreeNodeProps } from '../types'
import type TreeManager from './index'

/** True when the node declares `hasChildren` but its children have not been loaded yet */
export const isLazyNode = (node: InternalTreeNode | undefined | null): boolean =>
  !!node && node.hasChildren === true && !node._childrenLoaded && isEmpty(node._children)

// copies the incoming nodes so flattening (which mutates in place) never touches the caller's objects
const cloneNodes = (nodes: TreeNodeProps[]): TreeNodeProps[] =>
  nodes.map(node => (node.children ? { ...node, children: cloneNodes(node.children) } : { ...node }))

// mirrors `setInitialStateProps` in flatten-tree for the first level of loaded nodes
const inheritFromParent = (node: Record<string, any>, parent: InternalTreeNode, inheritChecked: boolean) => {
  const props = inheritChecked ? ['checked', 'disabled'] : ['disabled']
  props.forEach(prop => {
    const parentValue = (parent as Record<string, any>)[prop]
    if (node[prop] === undefined && parentValue !== undefined) {
      node[prop] = parentValue
    }
  })
}

const getLastDescendantId = (treeManager: TreeManager, id: string): string => {
  const { _children } = treeManager.getNodeById(id)
  return isEmpty(_children) ? id : getLastDescendantId(treeManager, _children![_children!.length - 1])
}

// Maps keep insertion order, which is the render order: re-insert so the new nodes follow `afterId`
const insertAfter = (tree: TreeNodeMap, afterId: string, nodes: TreeNodeMap) => {
  const entries = Array.from(tree)
  tree.clear()
  entries.forEach(([id, node]) => {
    tree.set(id, node)
    if (id === afterId) nodes.forEach((n, nId) => tree.set(nId, n))
  })
}

const reconcileAncestors = (treeManager: TreeManager, parent: InternalTreeNode) => {
  const { hierarchical, radioSelect, simpleSelect, showPartialState } = treeManager
  if (hierarchical || simpleSelect) return

  const getNodeById = (id: string) => treeManager.getNodeById(id)
  let current: InternalTreeNode | undefined = parent
  while (current) {
    if (!isEmpty(current._children)) {
      if (!radioSelect) {
        const allChecked = current._children!.every(c => getNodeById(c).checked)
        if (showPartialState) current.checked = allChecked
        else if (current.checked && !allChecked) current.checked = false
      }
      if (showPartialState) current.partial = getPartialState(current, '_children', getNodeById)
    }
    current = current._parent ? getNodeById(current._parent) : undefined
  }
}

/**
 * Inserts lazily loaded `children` under `parentId`, using the same id scheme, depth and parent/child links as
 * `flattenTree`, and applies the selection semantics of the current mode:
 * - multiSelect: children inherit `checked`/`disabled` from the parent; ancestors are re-evaluated
 *   (and partial state recomputed when `showPartiallySelected`)
 * - hierarchical: nothing is inherited
 * - radioSelect: only `disabled` is inherited; a loaded `checked`/`isDefaultValue` node is selected only when
 *   nothing else is selected yet
 * - simpleSelect: only top level nodes are supported, so children are ignored
 *
 * Returns the newly added (flattened) nodes in render order.
 */
export default function addChildren(
  treeManager: TreeManager,
  parentId: string,
  children: TreeNodeProps[] = []
): InternalTreeNode[] {
  const parent = treeManager.getNodeById(parentId)
  if (!parent) {
    throw new Error(`Cannot add children: node "${parentId}" does not exist`)
  }
  parent._childrenLoaded = true
  if (treeManager.simpleSelect || !children.length) return []

  const { hierarchical, radioSelect, showPartialState } = treeManager
  const nodes = cloneNodes(children)
  if (!hierarchical) nodes.forEach(node => inheritFromParent(node, parent, !radioSelect))

  // keep generated ids unique when appending to a node that already has children
  const offset = (parent._children || []).length
  if (offset) nodes.forEach((node, i) => (node.id = node.id || `${parentId}-${offset + i}`))

  const { list, defaultValues, singleSelectedNode } = flattenTree({
    tree: nodes,
    radio: radioSelect,
    showPartialState,
    hierarchical,
    rootPrefixId: parentId,
  })

  const baseDepth = (parent._depth || 0) + 1
  const childIds: string[] = []
  list.forEach(node => {
    node._depth = (node._depth || 0) + baseDepth
    if (node._parent === undefined) {
      // flattenTree treats the loaded nodes as roots: attach them to the parent
      node._parent = parentId
      childIds.push(node._id)
    }
  })

  insertAfter(treeManager.tree, getLastDescendantId(treeManager, parentId), list)
  parent._children = (parent._children || []).concat(childIds)

  if (radioSelect) {
    if (singleSelectedNode && !treeManager.currentChecked) {
      treeManager.currentChecked = singleSelectedNode._id
      if (singleSelectedNode.isDefaultValue && !treeManager.defaultValues.length) {
        treeManager.defaultValues.push(singleSelectedNode._id)
      }
    } else if (singleSelectedNode) {
      // keep the existing selection
      singleSelectedNode.checked = false
    }
  } else {
    treeManager.defaultValues.push(...defaultValues)
  }

  reconcileAncestors(treeManager, parent)

  // cached search results do not know about the new nodes
  treeManager.searchMaps.clear()

  return Array.from(list.values())
}
