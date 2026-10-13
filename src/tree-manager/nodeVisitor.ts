import { isEmpty } from '../utils'
import { InternalTreeNode, TreeNodeMap } from '../types'

export type Visited = Record<string, boolean>
export type GetNodeById = (id: string) => InternalTreeNode

const markSubTreeVisited = (node: InternalTreeNode, visited: Visited, getItemById: GetNodeById): void => {
  visited[node._id] = true
  if (!isEmpty(node._children)) {
    node._children!.forEach(c => markSubTreeVisited(getItemById(c), visited, getItemById))
  }
}

const getNodesMatching = (
  tree: TreeNodeMap,
  nodePredicate: (node: InternalTreeNode, key: string, visited: Visited) => boolean | undefined
): InternalTreeNode[] => {
  const nodes: InternalTreeNode[] = []
  const visited: Visited = {}

  tree.forEach((node, key) => {
    if (visited[key]) return

    if (nodePredicate(node, key, visited)) {
      nodes.push(node)
    }

    visited[key] = true
  })

  return nodes
}

const getVisibleNodes = (tree: TreeNodeMap, getItemById: GetNodeById, markSubTreeOnNonExpanded?: boolean) =>
  getNodesMatching(tree, (node, key, visited) => {
    if (markSubTreeOnNonExpanded && node._children && node._children.length && node.expanded !== true) {
      markSubTreeVisited(node, visited, getItemById)
    }
    return !node.hide
  })

const nodeVisitor = {
  getNodesMatching,
  getVisibleNodes,
  markSubTreeVisited,
}
export default nodeVisitor
