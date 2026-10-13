import nodeVisitor from './nodeVisitor'
import { getTagId } from '../tag'
import { findIndex } from '../utils'
import { InternalTreeNode, TreeNodeMap } from '../types'
import { GetNodeById } from './nodeVisitor'

type FocusNode = InternalTreeNode | undefined | null

const Keys = {
  Up: 'ArrowUp',
  Down: 'ArrowDown',
  Left: 'ArrowLeft',
  Right: 'ArrowRight',
  Enter: 'Enter',
  Home: 'Home',
  PageUp: 'PageUp',
  End: 'End',
  PageDown: 'PageDown',
} as const

export const NavActions = {
  None: 'None',
  FocusPrevious: 'FocusPrevious',
  FocusNext: 'FocusNext',
  FocusParent: 'FocusParent',
  FocusFirst: 'FocusFirst',
  FocusLast: 'FocusLast',
  ToggleExpanded: 'ToggleExpanded',
  ToggleChecked: 'ToggleChecked',
} as const

export type NavAction = (typeof NavActions)[keyof typeof NavActions]

export const FocusActionNames = new Set<string>([
  NavActions.FocusPrevious,
  NavActions.FocusNext,
  NavActions.FocusParent,
  NavActions.FocusFirst,
  NavActions.FocusLast,
])

const validTriggerOpenKeys: string[] = [Keys.Up, Keys.Down, Keys.Home, Keys.PageUp, Keys.End, Keys.PageDown]
const validKeys = validTriggerOpenKeys.concat([Keys.Left, Keys.Right, Keys.Enter])

const isValidKey = (key: string, isOpen: boolean) => {
  const keysToCheck = isOpen ? validKeys : validTriggerOpenKeys
  return keysToCheck.indexOf(key) > -1
}

const isMatchingEvent = (key: string, keys: string[], currentFocus: unknown, nonFocusKey?: string) =>
  keys.indexOf(key) > -1 || (!currentFocus && key === nonFocusKey)

const isFocusFirstEvent = (key: string, currentFocus: FocusNode) =>
  isMatchingEvent(key, [Keys.Home, Keys.PageUp], currentFocus, Keys.Down)

const isFocusLastEvent = (key: string, currentFocus: FocusNode) =>
  isMatchingEvent(key, [Keys.End, Keys.PageDown], currentFocus, Keys.Up)

const isReverseTraverseAction = (action: string) =>
  isMatchingEvent(action, [NavActions.FocusPrevious, NavActions.FocusLast], true)

const isEdgeTraverseAction = (action: string) =>
  isMatchingEvent(action, [NavActions.FocusFirst, NavActions.FocusLast], true)

const getLeftNavAction = (currentFocus: FocusNode, key: string): NavAction => {
  if (!currentFocus || key !== Keys.Left) return NavActions.None

  if (currentFocus.expanded === true) {
    return NavActions.ToggleExpanded
  }
  if (currentFocus._parent) {
    return NavActions.FocusParent
  }

  return NavActions.None
}

const getRightNavAction = (currentFocus: FocusNode, key: string): NavAction => {
  if (!currentFocus || !currentFocus._children || key !== Keys.Right) {
    return NavActions.None
  }

  return currentFocus.expanded !== true ? NavActions.ToggleExpanded : NavActions.FocusNext
}

const getRelativeAction = (currentFocus: FocusNode, key: string): NavAction => {
  if (!currentFocus) return NavActions.None
  switch (key) {
    case Keys.Up:
      return NavActions.FocusPrevious
    case Keys.Down:
      return NavActions.FocusNext
    case Keys.Enter:
      return NavActions.ToggleChecked
    default:
      return NavActions.None
  }
}

const getAction = (currentFocus: FocusNode, key: string): NavAction => {
  let action: NavAction
  if (key === Keys.Left) {
    action = getLeftNavAction(currentFocus, key)
  } else if (key === Keys.Right) {
    action = getRightNavAction(currentFocus, key)
  } else if (isFocusFirstEvent(key, currentFocus)) {
    action = NavActions.FocusFirst
  } else if (isFocusLastEvent(key, currentFocus)) {
    action = NavActions.FocusLast
  } else {
    action = getRelativeAction(currentFocus, key)
  }
  return action
}

const getParentFocus = (prevFocus: FocusNode, getNodeById: GetNodeById) =>
  prevFocus && prevFocus._parent ? getNodeById(prevFocus._parent) : prevFocus

const getRelativeNeighborsFocus = (sortedNodes: InternalTreeNode[], prevFocus: FocusNode) => {
  const nextIndex = sortedNodes.indexOf(prevFocus as InternalTreeNode) + 1
  if (nextIndex % sortedNodes.length === 0) {
    return sortedNodes[0]
  }
  return sortedNodes[nextIndex]
}

const getRelativeFocus = (sortedNodes: InternalTreeNode[], prevFocus: FocusNode, action: string): FocusNode => {
  if (!sortedNodes || sortedNodes.length === 0) {
    return prevFocus
  }

  let focus = prevFocus
  if (isEdgeTraverseAction(action)) {
    ;[focus] = sortedNodes
  } else if (([NavActions.FocusPrevious, NavActions.FocusNext] as string[]).indexOf(action) > -1) {
    focus = getRelativeNeighborsFocus(sortedNodes, prevFocus)
  }
  return focus
}

const getNextFocus = (
  tree: TreeNodeMap,
  prevFocus: FocusNode,
  action: string,
  getNodeById: GetNodeById,
  markSubTreeOnNonExpanded?: boolean
): FocusNode => {
  if (action === NavActions.FocusParent) {
    return getParentFocus(prevFocus, getNodeById)
  }
  if (!FocusActionNames.has(action)) {
    return prevFocus
  }

  let nodes = nodeVisitor.getVisibleNodes(tree, getNodeById, markSubTreeOnNonExpanded)
  if (isReverseTraverseAction(action)) {
    nodes = nodes.reverse()
  }

  return getRelativeFocus(nodes, prevFocus, action)
}

const getNextFocusAfterTagDelete = <F extends HTMLElement | null | undefined>(
  deletedId: string,
  prevTags: InternalTreeNode[] | undefined,
  tags: InternalTreeNode[],
  fallback: F
): HTMLElement | F => {
  // Sets new focus to next tag or returns fallback
  let index = prevTags ? findIndex(prevTags, t => t._id === deletedId) : -1
  if (index < 0 || !tags.length) return fallback

  index = tags.length > index ? index : tags.length - 1
  const newFocusId = tags[index]._id
  const focusNode = document.getElementById(getTagId(newFocusId))
  if (focusNode) {
    return (focusNode.firstElementChild as HTMLElement | null) || fallback
  }
  return fallback
}

const handleFocusNavigationkey = (
  tree: TreeNodeMap,
  action: string,
  prevFocus: FocusNode,
  getNodeById: GetNodeById,
  markSubTreeOnNonExpanded?: boolean
): string | null | undefined => {
  const newFocus = keyboardNavigation.getNextFocus(tree, prevFocus, action, getNodeById, markSubTreeOnNonExpanded)
  keyboardNavigation.adjustFocusedProps(prevFocus, newFocus)
  if (newFocus) {
    return newFocus._id
  }
  return prevFocus && prevFocus._id
}

const adjustFocusedProps = (prevFocus: FocusNode, newFocus: FocusNode): void => {
  if (prevFocus && newFocus && prevFocus._id !== newFocus._id) {
    prevFocus._focused = false
  }
  if (newFocus) {
    newFocus._focused = true
  }
}

const handleToggleNavigationkey = (
  action: string,
  prevFocus: InternalTreeNode,
  readOnly: boolean | undefined,
  onToggleChecked: (id: string, checked: boolean) => void,
  onToggleExpanded: (id: string) => void
): string => {
  if (action === NavActions.ToggleChecked && !readOnly && !(prevFocus.readOnly || prevFocus.disabled)) {
    onToggleChecked(prevFocus._id, prevFocus.checked !== true)
  } else if (action === NavActions.ToggleExpanded) {
    onToggleExpanded(prevFocus._id)
  }
  return prevFocus && prevFocus._id
}

const keyboardNavigation = {
  isValidKey,
  getAction,
  getNextFocus,
  getNextFocusAfterTagDelete,
  handleFocusNavigationkey,
  handleToggleNavigationkey,
  adjustFocusedProps,
}

export default keyboardNavigation
