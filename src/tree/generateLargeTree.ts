/**
 * Generates a synthetic tree with `roots × children × leaves` nodes (+ the intermediate levels),
 * e.g. the default 100 × 10 × 100 yields 101,100 nodes.
 */
export interface GeneratedNode {
  label: string
  value: string
  expanded?: boolean
  children?: GeneratedNode[]
}

export default function generateLargeTree({ roots = 100, children = 10, leaves = 100, expanded = false } = {}) {
  const tree: GeneratedNode[] = new Array(roots)
  for (let r = 0; r < roots; r++) {
    const level1: GeneratedNode[] = new Array(children)
    for (let c = 0; c < children; c++) {
      const level2: GeneratedNode[] = new Array(leaves)
      for (let l = 0; l < leaves; l++) {
        level2[l] = { label: `Leaf ${r}-${c}-${l}`, value: `leaf-${r}-${c}-${l}` }
      }
      level1[c] = { label: `Node ${r}-${c}`, value: `node-${r}-${c}`, expanded, children: level2 }
    }
    tree[r] = { label: `Root ${r}`, value: `root-${r}`, expanded, children: level1 }
  }
  return tree
}

export const countNodes = (nodes: GeneratedNode[]): number =>
  nodes.reduce((count, node) => count + 1 + (node.children ? countNodes(node.children) : 0), 0)
