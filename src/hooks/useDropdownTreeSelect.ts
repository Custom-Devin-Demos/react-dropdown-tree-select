import React, { useEffect, useMemo, useRef, useState } from 'react'

import { isOutsideClick, useIsomorphicLayoutEffect } from '../utils'
import TreeManager from '../tree-manager'
import keyboardNavigation from '../tree-manager/keyboardNavigation'
import useClientId from './useClientId'
import { DropdownTreeSelectProps, InternalTreeNode, NodeAction, ShowDropdownState, TreeNodeMap } from '../types'

const noop = () => {}

export type UseDropdownTreeSelectOptions = DropdownTreeSelectProps

export interface DropdownTreeSelectHookState {
  showDropdown: boolean
  searchModeOn: boolean
  currentFocus?: string | null
  allNodesHidden: boolean
  tree: TreeNodeMap
  tags: InternalTreeNode[]
  /** Incremented whenever the (mutable) tree is changed, so memoized consumers can recompute */
  treeVersion: number
}

interface TreeManagerInputs {
  data: DropdownTreeSelectProps['data']
  mode: DropdownTreeSelectProps['mode']
  showPartiallySelected: DropdownTreeSelectProps['showPartiallySelected']
  searchPredicate: DropdownTreeSelectProps['searchPredicate']
  clientId: string
}

interface InternalState extends DropdownTreeSelectHookState {
  treeManager: TreeManager
  inputs: TreeManagerInputs
  showDropdownProp: ShowDropdownState
}

type StatePatch = Partial<InternalState>

const shouldShowDropdown = (showDropdown: ShowDropdownState) => /initial|always/.test(showDropdown)

const inputsChanged = (a: TreeManagerInputs, b: TreeManagerInputs) =>
  a.data !== b.data ||
  a.mode !== b.mode ||
  a.showPartiallySelected !== b.showPartiallySelected ||
  a.searchPredicate !== b.searchPredicate ||
  a.clientId !== b.clientId

const createTreeManager = (inputs: TreeManagerInputs, currentFocus?: string | null) => {
  const { data, mode, showPartiallySelected, searchPredicate, clientId } = inputs
  const treeManager = new TreeManager({ data, mode, showPartiallySelected, rootPrefixId: clientId, searchPredicate })
  // carry the keyboard focus over to the freshly created tree (only touches the new, not yet shared, instance)
  const currentFocusNode = currentFocus ? treeManager.getNodeById(currentFocus) : undefined
  if (currentFocusNode) {
    currentFocusNode._focused = true
  }
  return treeManager
}

/**
 * Internal state machine behind `DropdownTreeSelect`. Holds no JSX: it returns state, refs and stable handlers
 * so the markup can be rendered by any component.
 *
 * The mutable `TreeManager` is (re)created only when `data`, `mode`, `showPartiallySelected`, `searchPredicate`
 * or the client id change. It is only mutated inside event handlers, never during render.
 */
const useDropdownTreeSelect = (options: UseDropdownTreeSelectOptions) => {
  const {
    data,
    mode,
    showPartiallySelected,
    searchPredicate,
    id,
    showDropdown: showDropdownProp = 'default',
    onChange = noop,
    onAction = noop,
    onFocus = noop,
    onBlur = noop,
    onNodeToggle,
    keepTreeOnSearch,
    keepChildrenOnSearch,
    keepOpenOnSelect,
    clearSearchOnChange,
    readOnly,
    disablePoppingOnBackspace = false,
  } = options

  const generatedId = useClientId()
  const clientId = id || generatedId
  const inputs: TreeManagerInputs = { data, mode, showPartiallySelected, searchPredicate, clientId }

  const [committedState, setState] = useState<InternalState>(() => {
    const treeManager = createTreeManager(inputs)
    return {
      treeManager,
      inputs,
      showDropdownProp,
      showDropdown: shouldShowDropdown(showDropdownProp),
      searchModeOn: false,
      currentFocus: undefined,
      allNodesHidden: false,
      treeVersion: 0,
      ...treeManager.getTreeAndTags(),
    }
  })

  // Derive state from changed props during render (https://react.dev/reference/react/useState#storing-information-from-previous-renders)
  let state = committedState
  if (inputsChanged(state.inputs, inputs)) {
    const treeManager = createTreeManager(inputs, state.currentFocus)
    state = {
      ...state,
      ...treeManager.getTreeAndTags(),
      treeManager,
      inputs,
      showDropdownProp,
      showDropdown: shouldShowDropdown(showDropdownProp) || state.showDropdown,
      treeVersion: state.treeVersion + 1,
    }
    setState(state)
  } else if (state.showDropdownProp !== showDropdownProp) {
    state = { ...state, showDropdownProp, showDropdown: shouldShowDropdown(showDropdownProp) || state.showDropdown }
    setState(state)
  }

  const nodeRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const keepDropdownActiveRef = useRef(false)
  const stateRef = useRef(state)
  const treeManagerRef = useRef(state.treeManager)
  const pendingCallbacksRef = useRef<Array<() => void>>([])
  const optionsRef = useRef({
    showDropdown: showDropdownProp,
    onChange,
    onAction,
    onFocus,
    onBlur,
    onNodeToggle,
    keepTreeOnSearch,
    keepChildrenOnSearch,
    keepOpenOnSelect,
    clearSearchOnChange,
    mode,
    readOnly,
    disablePoppingOnBackspace,
  })

  useIsomorphicLayoutEffect(() => {
    stateRef.current = state
    treeManagerRef.current = state.treeManager
    optionsRef.current = {
      showDropdown: showDropdownProp,
      onChange,
      onAction,
      onFocus,
      onBlur,
      onNodeToggle,
      keepTreeOnSearch,
      keepChildrenOnSearch,
      keepOpenOnSelect,
      clearSearchOnChange,
      mode,
      readOnly,
      disablePoppingOnBackspace,
    }
  })

  // Equivalent of the class `setState(state, callback)` callback: runs after the update has been committed
  useIsomorphicLayoutEffect(() => {
    if (!pendingCallbacksRef.current.length) return
    const callbacks = pendingCallbacksRef.current
    pendingCallbacksRef.current = []
    callbacks.forEach(cb => cb())
  })

  const handlers = useMemo(() => {
    const update = (patch: StatePatch, afterCommit?: () => void) => {
      // stateRef is updated eagerly so consecutive handlers in the same event see the latest values
      const next = { ...stateRef.current, ...patch }
      stateRef.current = next
      if (afterCommit) pendingCallbacksRef.current.push(afterCommit)
      setState(next)
    }

    const resetSearchState = (): StatePatch => {
      // clear the search criteria and avoid react controlled/uncontrolled warning
      if (searchInputRef.current) {
        searchInputRef.current.value = ''
      }

      return {
        tree: treeManagerRef.current.restoreNodes(), // restore the tree to its pre-search state
        searchModeOn: false,
        allNodesHidden: false,
        treeVersion: stateRef.current.treeVersion + 1,
      }
    }

    const handleClick = (e?: unknown, callback?: () => void) => {
      const { showDropdown: showDropdownOption, onFocus, onBlur } = optionsRef.current
      // keep dropdown active when typing in search box
      const showDropdown =
        showDropdownOption === 'always' || keepDropdownActiveRef.current || !stateRef.current.showDropdown

      if (showDropdown) onFocus()
      else onBlur()

      update(!showDropdown ? { showDropdown, ...resetSearchState() } : { showDropdown }, callback)
    }

    const handleOutsideClick = (e: Event) => {
      if (optionsRef.current.showDropdown === 'always' || !isOutsideClick(e, nodeRef.current)) {
        return
      }

      handleClick()
    }

    const onInputChange = (value: string) => {
      const searchModeOn = value.length > 0
      if (!searchModeOn) {
        update(resetSearchState())
      } else {
        const { keepTreeOnSearch, keepChildrenOnSearch } = optionsRef.current
        const { allNodesHidden, tree } = treeManagerRef.current.filterTree(
          value,
          keepTreeOnSearch,
          keepChildrenOnSearch
        )
        update({ tree, searchModeOn, allNodesHidden, treeVersion: stateRef.current.treeVersion + 1 })
      }
    }

    const onNodeToggle = (id: string) => {
      const treeManager = treeManagerRef.current
      treeManager.toggleNodeExpandState(id)
      const tree = (stateRef.current.searchModeOn ? treeManager.matchTree : treeManager.tree) as TreeNodeMap
      update({ tree, treeVersion: stateRef.current.treeVersion + 1 })
      const { onNodeToggle: onNodeToggleOption } = optionsRef.current
      typeof onNodeToggleOption === 'function' && onNodeToggleOption(treeManager.getNodeById(id))
    }

    const onCheckboxChange = (id: string, checked: boolean, callback?: (tags: InternalTreeNode[]) => void) => {
      const { mode, keepOpenOnSelect, clearSearchOnChange, onChange } = optionsRef.current
      const { currentFocus, searchModeOn, treeVersion } = stateRef.current
      const treeManager = treeManagerRef.current
      treeManager.setNodeCheckedState(id, checked)
      let tags = treeManager.tags
      const isSingleSelect = ['simpleSelect', 'radioSelect'].indexOf(mode as string) > -1
      const showDropdown = isSingleSelect && !keepOpenOnSelect ? false : stateRef.current.showDropdown
      const currentFocusNode = currentFocus ? treeManager.getNodeById(currentFocus) : undefined
      const node = treeManager.getNodeById(id)

      if (!tags.length) {
        treeManager.restoreDefaultValues()
        tags = treeManager.tags
      }

      const tree = (searchModeOn ? treeManager.matchTree : treeManager.tree) as TreeNodeMap
      let nextState: StatePatch = {
        tree,
        tags,
        showDropdown,
        currentFocus: id,
        treeVersion: treeVersion + 1,
      }

      if ((isSingleSelect && !showDropdown) || clearSearchOnChange) {
        nextState = { ...nextState, ...resetSearchState() }
      }

      keyboardNavigation.adjustFocusedProps(currentFocusNode, node)
      update(nextState, callback && (() => callback(tags)))
      onChange(node, tags)
    }

    const onTagRemove = (id: string, isKeyboardEvent?: boolean) => {
      const { tags: prevTags } = stateRef.current
      onCheckboxChange(id, false, tags => {
        if (!isKeyboardEvent) return

        const next = keyboardNavigation.getNextFocusAfterTagDelete(id, prevTags, tags, searchInputRef.current)
        next && next.focus()
      })
    }

    const onAction = (nodeId: string, action: NodeAction) => {
      optionsRef.current.onAction(treeManagerRef.current.getNodeById(nodeId), action)
    }

    const onInputFocus = () => {
      keepDropdownActiveRef.current = true
    }

    const onInputBlur = () => {
      keepDropdownActiveRef.current = false
    }

    const onTrigger = (e?: React.MouseEvent | React.KeyboardEvent) => {
      handleClick(e, () => {
        // If the dropdown is shown after key press, focus the input
        if (stateRef.current.showDropdown && searchInputRef.current) {
          searchInputRef.current.focus()
        }
      })
    }

    const onKeyboardKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
      const { readOnly, mode, disablePoppingOnBackspace } = optionsRef.current
      const { showDropdown, tags, searchModeOn, currentFocus } = stateRef.current
      const treeManager = treeManagerRef.current
      const tree = (searchModeOn ? treeManager.matchTree : treeManager.tree) as TreeNodeMap

      if (!showDropdown && (keyboardNavigation.isValidKey(e.key, false) || /^\w$/i.test(e.key))) {
        // Triggers open of dropdown and retriggers event
        handleClick(null, () => onKeyboardKeyDown(e))
        if (/\w/i.test(e.key)) return
      } else if (showDropdown && keyboardNavigation.isValidKey(e.key, true)) {
        const newFocus = treeManager.handleNavigationKey(
          currentFocus,
          tree,
          e.key,
          readOnly,
          !searchModeOn,
          onCheckboxChange,
          onNodeToggle
        )
        if (newFocus !== currentFocus) {
          update({ currentFocus: newFocus, treeVersion: stateRef.current.treeVersion + 1 }, () => {
            const ele = document && document.getElementById(`${newFocus}_li`)
            ele && ele.scrollIntoView()
          })
        }
      } else if (showDropdown && ['Escape', 'Tab'].indexOf(e.key) > -1) {
        if (mode === 'simpleSelect' && tree.has(currentFocus as string)) {
          onCheckboxChange(currentFocus as string, true)
        } else {
          // Triggers close
          keepDropdownActiveRef.current = false
          handleClick()
        }
        return
      } else if (
        !disablePoppingOnBackspace &&
        e.key === 'Backspace' &&
        tags.length &&
        searchInputRef.current &&
        searchInputRef.current.value.length === 0
      ) {
        const lastTag = tags[tags.length - 1]
        onCheckboxChange(lastTag._id, false)
      } else {
        return
      }
      e.preventDefault()
    }

    return {
      handleClick,
      handleOutsideClick,
      onInputChange,
      onNodeToggle,
      onCheckboxChange,
      onTagRemove,
      onAction,
      onInputFocus,
      onInputBlur,
      onTrigger,
      onKeyboardKeyDown,
    }
  }, [])

  // Outside clicks only matter while the dropdown is open; the listener is owned by this effect
  const { showDropdown } = state
  const { handleOutsideClick } = handlers
  useEffect(() => {
    if (!showDropdown) return undefined
    document.addEventListener('click', handleOutsideClick, false)
    return () => document.removeEventListener('click', handleOutsideClick, false)
  }, [showDropdown, handleOutsideClick])

  const { searchModeOn, currentFocus, allNodesHidden, tree, tags, treeVersion } = state

  return {
    clientId,
    showDropdown,
    searchModeOn,
    currentFocus,
    activeDescendant: currentFocus ? `${currentFocus}_li` : undefined,
    allNodesHidden,
    tree,
    tags,
    treeVersion,
    nodeRef,
    searchInputRef,
    keepDropdownActiveRef,
    ...handlers,
  }
}

export type UseDropdownTreeSelectResult = ReturnType<typeof useDropdownTreeSelect>

export default useDropdownTreeSelect
