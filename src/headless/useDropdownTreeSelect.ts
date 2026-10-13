import React, { useCallback, useMemo, useRef, useState } from 'react'

import useDropdownTreeSelectState from '../hooks/useDropdownTreeSelect'
import { debounce } from '../utils'
import useIsomorphicLayoutEffect from '../utils/useIsomorphicLayoutEffect'
import { DropdownTreeSelectClassNames, InternalTreeNode, TextProps, TreeNodeMap } from '../types'
import { EMPTY_CLASS_NAMES } from './ClassNamesContext'
import {
  buildCheckboxProps,
  buildContentProps,
  buildInputProps,
  buildListProps,
  buildNodeProps,
  buildRootProps,
  buildTagProps,
  buildTagRemoveProps,
  buildToggleProps,
  buildTriggerProps,
  cx,
} from './prop-getters'
import {
  DropdownTreeSelectNode,
  DropdownTreeSelectTag,
  UseDropdownTreeSelectOptions,
  UseDropdownTreeSelectResult,
  UserProps,
} from './types'

const EMPTY_TEXTS: TextProps = {}
const EMPTY_NODES: DropdownTreeSelectNode[] = []

const setRef = <T>(ref: React.Ref<T> | undefined, value: T | null) => {
  if (typeof ref === 'function') ref(value)
  else if (ref) (ref as React.MutableRefObject<T | null>).current = value
}

/** Merges user props into the props computed by a getter */
export const mergeProps = (ours: Record<string, any>, user?: UserProps<any>): Record<string, any> => {
  if (!user) return ours
  const merged: Record<string, any> = { ...ours }
  Object.keys(user).forEach(key => {
    const theirs = user[key]
    const own = ours[key]
    if (key === 'className') {
      merged.className = cx(own, theirs)
    } else if (key === 'style') {
      merged.style = { ...own, ...theirs }
    } else if (key === 'ref') {
      merged.ref = (el: unknown) => {
        setRef(own, el)
        setRef(theirs, el)
      }
    } else if (/^on[A-Z]/.test(key) && typeof theirs === 'function' && typeof own === 'function') {
      merged[key] = (...args: unknown[]) => {
        theirs(...args)
        own(...args)
      }
    } else {
      merged[key] = theirs
    }
  })
  return merged
}

const shouldRenderNode = (node: InternalTreeNode, tree: TreeNodeMap, searchModeOn: boolean) => {
  if (searchModeOn || node.expanded) return true
  const parent = node._parent && tree.get(node._parent)
  // root nodes are always rendered, others only when their parent is expanded
  return !parent || !!parent.expanded
}

const toNode = (node: InternalTreeNode, showPartiallySelected?: boolean): DropdownTreeSelectNode => ({
  id: node._id,
  parentId: node._parent,
  label: node.label,
  value: node.value,
  depth: node._depth || 0,
  isLeaf: !node._children || node._children.length === 0,
  expanded: !!node.expanded,
  checked: !!node.checked,
  partial: !!(showPartiallySelected && node.partial),
  focused: !!node._focused,
  disabled: !!node.disabled,
  node,
})

const toTag = (node: InternalTreeNode): DropdownTreeSelectTag => ({
  id: node._id,
  label: node.tagLabel || node.label,
  disabled: !!node.disabled,
  node,
})

const useStableClassNames = (classNames: DropdownTreeSelectClassNames = EMPTY_CLASS_NAMES) => {
  const { root, dropdown, trigger, tags, tag, input, content, tree, node, toggle, checkbox, label } = classNames
  return useMemo(
    () => ({ root, dropdown, trigger, tags, tag, input, content, tree, node, toggle, checkbox, label }),
    [root, dropdown, trigger, tags, tag, input, content, tree, node, toggle, checkbox, label]
  )
}

/**
 * Backs both `useDropdownTreeSelect` and `DropdownTreeSelectUnstyled`. `withVisibleNodes` controls whether the
 * flat list of visible nodes is computed (the components render the tree from the internal map instead).
 * @internal
 */
export const useDropdownTreeSelectController = (options: UseDropdownTreeSelectOptions, withVisibleNodes: boolean) => {
  const internal = useDropdownTreeSelectState(options)
  const {
    texts = EMPTY_TEXTS,
    mode,
    disabled,
    readOnly,
    tabIndex = 0,
    inlineSearchInput = false,
    className,
    keepTreeOnSearch,
    keepChildrenOnSearch,
    showPartiallySelected,
  } = options
  const classNames = useStableClassNames(options.classNames)
  const {
    clientId,
    showDropdown,
    searchModeOn,
    activeDescendant,
    allNodesHidden,
    tree: treeMap,
    tags: internalTags,
    treeVersion,
    nodeRef,
    searchInputRef,
    keepDropdownActiveRef,
    handleClick,
    onInputChange,
    onInputFocus,
    onInputBlur,
    onKeyboardKeyDown,
    onTrigger,
    onTagRemove,
    onCheckboxChange,
    onNodeToggle,
  } = internal

  const triggerRef = useRef<HTMLAnchorElement | null>(null)
  const isOpenRef = useRef(showDropdown)
  useIsomorphicLayoutEffect(() => {
    isOpenRef.current = showDropdown
  })

  const [appliedSearch, setAppliedSearch] = useState('')
  const applySearch = useCallback(
    (value: string) => {
      setAppliedSearch(value)
      onInputChange(value)
    },
    [onInputChange]
  )
  const debouncedSearch = useMemo(() => debounce(applySearch, 300), [applySearch])

  const actions = useMemo(() => {
    const open = () => {
      if (!isOpenRef.current) handleClick()
    }
    const close = () => {
      if (!isOpenRef.current) return
      keepDropdownActiveRef.current = false
      handleClick()
    }
    return {
      open,
      close,
      toggle: () => (isOpenRef.current ? close() : open()),
      setSearch: (value: string) => {
        if (searchInputRef.current && searchInputRef.current.value !== value) {
          searchInputRef.current.value = value
        }
        applySearch(value)
      },
      toggleNode: (id: string) => onNodeToggle(id),
      checkNode: (id: string, checked: boolean) => onCheckboxChange(id, checked),
      removeTag: (id: string) => onTagRemove(id, false),
      handleKeyDown: (e: React.KeyboardEvent<HTMLElement>) =>
        onKeyboardKeyDown(e as React.KeyboardEvent<HTMLInputElement>),
    }
  }, [
    handleClick,
    keepDropdownActiveRef,
    searchInputRef,
    applySearch,
    onNodeToggle,
    onCheckboxChange,
    onTagRemove,
    onKeyboardKeyDown,
  ])

  const tags = useMemo(() => internalTags.map(toTag), [internalTags])

  const tree = useMemo(() => {
    if (!withVisibleNodes) return EMPTY_NODES
    const nodes: DropdownTreeSelectNode[] = []
    treeMap.forEach(node => {
      // mirrors the `.hide:not(.match-in-children)` rule of the default styles
      const hidden = node.hide && !(keepTreeOnSearch && node.matchInChildren)
      if (!hidden && shouldRenderNode(node, treeMap, searchModeOn)) {
        nodes.push(toNode(node, showPartiallySelected))
      }
    })
    return nodes
    // treeVersion signals in-place mutations of the nodes in `treeMap`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withVisibleNodes, treeMap, treeVersion, searchModeOn, keepTreeOnSearch, showPartiallySelected])

  const nodeOptions = {
    mode,
    keepTreeOnSearch,
    keepChildrenOnSearch,
    searchModeOn,
    showPartiallySelected,
    readOnly,
    className: classNames.node,
  }

  const getters = {
    getRootProps: (userProps?: UserProps<HTMLDivElement>) =>
      mergeProps(buildRootProps({ clientId, className, extraClassName: classNames.root, rootRef: nodeRef }), userProps),
    getTriggerProps: (userProps?: UserProps<HTMLElement>) =>
      mergeProps(
        buildTriggerProps({
          onTrigger,
          triggerRef,
          disabled,
          readOnly,
          showDropdown,
          mode,
          texts,
          clientId,
          tagIds: internalTags.map(t => t._id),
          tabIndex,
          className: classNames.trigger,
        }),
        userProps
      ),
    getInputProps: (userProps?: UserProps<HTMLInputElement>) =>
      mergeProps(
        buildInputProps({
          inputRef: searchInputRef,
          texts,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => debouncedSearch(e.target.value),
          onFocus: onInputFocus,
          onBlur: onInputBlur,
          onKeyDown: onKeyboardKeyDown,
          disabled,
          readOnly,
          activeDescendant,
          inlineSearchInput,
          className: classNames.input,
        }),
        userProps
      ),
    getContentProps: (userProps?: UserProps<HTMLDivElement>) =>
      mergeProps(buildContentProps({ mode, texts, className: classNames.content }), userProps),
    getListProps: (userProps?: UserProps<HTMLUListElement>) =>
      mergeProps(buildListProps({ mode, searchModeOn, className: classNames.tree }), userProps),
    getNodeProps: (node: DropdownTreeSelectNode, userProps?: UserProps<HTMLLIElement>) =>
      mergeProps(buildNodeProps(node.node as InternalTreeNode, nodeOptions), userProps),
    getCheckboxProps: (node: DropdownTreeSelectNode, userProps?: UserProps<HTMLInputElement>) =>
      mergeProps(
        buildCheckboxProps(node.node as InternalTreeNode, {
          mode,
          clientId,
          showPartiallySelected,
          readOnly,
          onCheckboxChange,
          className: classNames.checkbox,
        }),
        userProps
      ),
    getToggleProps: (node: DropdownTreeSelectNode, userProps?: UserProps<HTMLElement>) =>
      mergeProps(
        buildToggleProps(node.node as InternalTreeNode, { onNodeToggle, className: classNames.toggle }),
        userProps
      ),
    getTagProps: (tag: DropdownTreeSelectTag, userProps?: UserProps<HTMLElement>) =>
      mergeProps(buildTagProps({ id: tag.id, label: tag.label, className: classNames.tag }), userProps),
    getTagRemoveProps: (tag: DropdownTreeSelectTag, userProps?: UserProps<HTMLButtonElement>) =>
      mergeProps(
        buildTagRemoveProps({
          id: tag.id,
          onDelete: onTagRemove,
          labelRemove: texts.labelRemove,
          readOnly,
          disabled: disabled || tag.disabled,
        }),
        userProps
      ),
  }

  const api: UseDropdownTreeSelectResult = {
    clientId,
    tree,
    tags,
    isOpen: showDropdown,
    searchTerm: searchModeOn ? appliedSearch : '',
    searchModeOn,
    allNodesHidden,
    activeDescendant,
    ...actions,
    ...getters,
  }

  return { api, internal, classNames, applySearch }
}

/**
 * Headless dropdown tree select: returns the state, actions and prop getters behind `DropdownTreeSelect`
 * so you can render your own markup. Accepts the same options as the component props.
 */
const useDropdownTreeSelect = (options: UseDropdownTreeSelectOptions): UseDropdownTreeSelectResult =>
  useDropdownTreeSelectController(options, true).api

export default useDropdownTreeSelect
