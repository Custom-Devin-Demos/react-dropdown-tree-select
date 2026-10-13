import React from 'react'

import { DropdownTreeSelectProps, TreeNode } from '../types'

export type UseDropdownTreeSelectOptions = DropdownTreeSelectProps

/** A node that is currently visible in the dropdown (collapsed subtrees and search misses are left out) */
export interface DropdownTreeSelectNode {
  /** Internal, unique node id (`<clientId>-0-1`); use it with `toggleNode`, `checkNode` etc. */
  id: string
  /** Id of the parent node (if any) */
  parentId?: string
  label: string
  value: string
  /** 0 for root nodes */
  depth: number
  /** `true` when the node has no children */
  isLeaf: boolean
  expanded: boolean
  checked: boolean
  /** Some, but not all, descendants are checked (only computed with `showPartiallySelected`) */
  partial: boolean
  /** Has the keyboard focus (`aria-activedescendant`) */
  focused: boolean
  disabled: boolean
  /** The underlying node object (with any custom properties from `data`), as passed to `onChange` */
  node: TreeNode
}

/** A selected node, rendered as a tag/pill */
export interface DropdownTreeSelectTag {
  id: string
  /** `tagLabel` if set, `label` otherwise */
  label: string
  disabled: boolean
  node: TreeNode
}

/** Props passed to a prop getter are merged into the returned props: event handlers are chained
 * (yours runs first), class names are concatenated, `style` objects and refs are merged, anything else overrides. */
export type UserProps<E extends HTMLElement = HTMLElement> = React.HTMLAttributes<E> & {
  ref?: React.Ref<E>
  [prop: string]: any
}

export type PropGetter<E extends HTMLElement = HTMLElement> = (userProps?: UserProps<E>) => Record<string, any>

export type ItemPropGetter<T, E extends HTMLElement = HTMLElement> = (
  item: T,
  userProps?: UserProps<E>
) => Record<string, any>

export interface UseDropdownTreeSelectResult {
  /** The id of the dropdown (the `id` prop, or a generated one) used as prefix for every rendered id */
  clientId: string
  /** Visible nodes, in render order */
  tree: DropdownTreeSelectNode[]
  /** Selected nodes */
  tags: DropdownTreeSelectTag[]
  isOpen: boolean
  /** The search term currently applied to the tree (`''` when not searching) */
  searchTerm: string
  searchModeOn: boolean
  /** `true` when searching and nothing matched */
  allNodesHidden: boolean
  /** Id of the element (`<nodeId>_li`) that has the keyboard focus */
  activeDescendant?: string

  open: () => void
  close: () => void
  toggle: () => void
  /** Applies a search term immediately (the input returned by `getInputProps` debounces typing) */
  setSearch: (searchTerm: string) => void
  /** Expands/collapses a node */
  toggleNode: (id: string) => void
  /** Checks/unchecks a node; in `simpleSelect` / `radioSelect` mode this selects the node */
  checkNode: (id: string, checked: boolean) => void
  /** Unchecks the node of a tag */
  removeTag: (id: string) => void
  /** Keyboard handler for the search input (arrow/page/home/end navigation, enter, escape, tab, backspace) */
  handleKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void

  /** Root element (`div.react-dropdown-tree-select`); its ref is used for outside click detection */
  getRootProps: PropGetter<HTMLDivElement>
  /** Element that toggles the dropdown (`a.dropdown-trigger`) */
  getTriggerProps: PropGetter<HTMLElement>
  /** Search input (`input.search`) */
  getInputProps: PropGetter<HTMLInputElement>
  /** Container of the dropdown content (`div.dropdown-content`) */
  getContentProps: PropGetter<HTMLDivElement>
  /** List that contains the nodes (`ul.root`) */
  getListProps: PropGetter<HTMLUListElement>
  /** A node (`li.node`) */
  getNodeProps: ItemPropGetter<DropdownTreeSelectNode, HTMLLIElement>
  /** The checkbox/radio input of a node */
  getCheckboxProps: ItemPropGetter<DropdownTreeSelectNode, HTMLInputElement>
  /** Expand/collapse toggle of a node */
  getToggleProps: ItemPropGetter<DropdownTreeSelectNode, HTMLElement>
  /** A tag (`span.tag`) */
  getTagProps: ItemPropGetter<DropdownTreeSelectTag, HTMLElement>
  /** The remove button of a tag (`button.tag-remove`) */
  getTagRemoveProps: ItemPropGetter<DropdownTreeSelectTag, HTMLButtonElement>
}
