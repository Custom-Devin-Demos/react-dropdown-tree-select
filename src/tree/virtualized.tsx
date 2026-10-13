import React, { useCallback, useMemo, useRef } from 'react'
import {
  defaultRangeExtractor,
  measureElement as defaultMeasureElement,
  Range,
  useVirtualizer,
  Virtualizer,
} from '@tanstack/react-virtual'

import TreeNode from '../tree-node'
import { useIsomorphicLayoutEffect } from '../utils'
import { InternalTreeNode, Mode, TreeNodeMap, VirtualizationOptions } from '../types'
import type { TreeProps } from './index'

export const DEFAULT_ITEM_HEIGHT = 32
export const DEFAULT_OVERSCAN = 10
export const DEFAULT_HEIGHT = 300

export const getVirtualizationOptions = (virtualized: TreeProps['virtualized']): Required<VirtualizationOptions> => {
  const options = typeof virtualized === 'object' && virtualized ? virtualized : {}
  return {
    itemHeight: options.itemHeight || DEFAULT_ITEM_HEIGHT,
    overscan: options.overscan === undefined ? DEFAULT_OVERSCAN : options.overscan,
    height: options.height || DEFAULT_HEIGHT,
  }
}

interface VisibleRows {
  nodes: InternalTreeNode[]
  indexById: Map<string, number>
  /** 1-based position of each row among its (visible) siblings */
  posInSet: Int32Array
  /** number of visible siblings of each row */
  setSize: Int32Array
}

/**
 * Flattens the visible part of the tree (expanded branches / search results) into the list of rows to virtualize.
 * Rows hidden by CSS (`.hide:not(.match-in-children)`) are skipped, as they would take no space.
 */
export const getVisibleRows = (
  data: TreeNodeMap,
  searchModeOn?: boolean,
  keepTreeOnSearch?: boolean,
  mode?: Mode
): VisibleRows => {
  const nodes: InternalTreeNode[] = []
  const indexById = new Map<string, number>()
  // a flat list (listbox, flattened search results) is a single set; otherwise siblings share a parent
  const isFlat = mode === 'simpleSelect' || (searchModeOn && !keepTreeOnSearch)
  const groups: string[] = []
  const groupSizes = new Map<string, number>()
  const posInSetList: number[] = []

  data.forEach(node => {
    const { expanded, _parent, hide, matchInChildren } = node
    if (hide && !(keepTreeOnSearch && matchInChildren)) return
    if (!searchModeOn && !expanded && _parent) {
      const parent = data.get(_parent)
      if (parent && !parent.expanded) return
    }

    const group = isFlat ? '' : _parent || ''
    const pos = (groupSizes.get(group) || 0) + 1
    groupSizes.set(group, pos)
    indexById.set(node._id, nodes.length)
    nodes.push(node)
    groups.push(group)
    posInSetList.push(pos)
  })

  const posInSet = Int32Array.from(posInSetList)
  const setSize = new Int32Array(nodes.length)
  for (let i = 0; i < nodes.length; i++) {
    setSize[i] = groupSizes.get(groups[i]) as number
  }

  return { nodes, indexById, posInSet, setSize }
}

const withIndex = (indexes: number[], index: number) => {
  if (index < 0 || indexes.indexOf(index) > -1) return indexes
  return index < indexes[0] ? [index, ...indexes] : [...indexes, index]
}

const VirtualizedTree = ({
  data,
  treeVersion,
  keepTreeOnSearch,
  keepChildrenOnSearch,
  searchModeOn,
  mode,
  showPartiallySelected,
  readOnly,
  onAction,
  onChange,
  onCheckboxChange,
  onNodeToggle,
  activeDescendant,
  clientId,
  virtualized,
}: TreeProps) => {
  const { itemHeight, overscan, height } = getVirtualizationOptions(virtualized)
  const node = useRef<HTMLDivElement | null>(null)

  const rows = useMemo(
    () => getVisibleRows(data, searchModeOn, keepTreeOnSearch, mode),
    // treeVersion signals in-place mutations of the nodes in `data`
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, treeVersion, searchModeOn, keepTreeOnSearch, mode]
  )

  const activeId = activeDescendant ? activeDescendant.replace(/_li$/, '') : undefined
  const activeIndex =
    activeId !== undefined && rows.indexById.has(activeId) ? (rows.indexById.get(activeId) as number) : -1

  // always render the keyboard-focused row so that `aria-activedescendant` points to an element in the DOM
  const rangeExtractor = useCallback(
    (range: Range) => withIndex(defaultRangeExtractor(range), activeIndex),
    [activeIndex]
  )
  const getItemKey = useCallback((index: number) => rows.nodes[index]._id, [rows])
  const estimateSize = useCallback(() => itemHeight, [itemHeight])
  const measureElement = useCallback(
    (
      element: HTMLLIElement,
      entry: ResizeObserverEntry | undefined,
      instance: Virtualizer<HTMLDivElement, HTMLLIElement>
    ) =>
      // rows that are not laid out (e.g. no layout engine) fall back to the estimate
      defaultMeasureElement(element, entry, instance) || itemHeight,
    [itemHeight]
  )

  const virtualizer = useVirtualizer<HTMLDivElement, HTMLLIElement>({
    count: rows.nodes.length,
    getScrollElement: () => node.current,
    estimateSize,
    overscan,
    getItemKey,
    rangeExtractor,
    measureElement,
    initialRect: { width: 0, height },
  })

  // scroll the keyboard-focused row into view whenever the focus moves (replaces `scrollIntoView`)
  const scrolledTo = useRef<string | undefined>(undefined)
  useIsomorphicLayoutEffect(() => {
    if (activeDescendant === scrolledTo.current) return
    scrolledTo.current = activeDescendant
    if (activeIndex > -1) virtualizer.scrollToIndex(activeIndex)
  }, [activeDescendant, activeIndex, virtualizer])

  // a new search result set (or leaving search) starts at the top; expanding/collapsing keeps the position
  const previousData = useRef(data)
  useIsomorphicLayoutEffect(() => {
    if (previousData.current === data) return
    previousData.current = data
    if (activeIndex < 0) virtualizer.scrollToOffset(0)
  }, [data, activeIndex, virtualizer])

  const items = virtualizer.getVirtualItems()
  // the focused row may be kept outside of the visible range: position it absolutely so it does not shift the others
  const isDetached = (index: number) =>
    index === activeIndex &&
    items.length > 1 &&
    !items.some(item => item.index === activeIndex - 1 || item.index === activeIndex + 1)
  const flowItems = items.filter(item => !isDetached(item.index))
  const first = flowItems[0]
  const last = flowItems[flowItems.length - 1]
  const totalSize = virtualizer.getTotalSize()

  const ariaAttributes = {
    /* https://www.w3.org/TR/wai-aria-1.1/#select
     * https://www.w3.org/TR/wai-aria-1.1/#tree */
    role: mode === 'simpleSelect' ? 'listbox' : 'tree',
    'aria-multiselectable': /multiSelect|hierarchical/.test(mode as string),
  }

  // the list itself takes the full virtual height (padding stands in for the rows that are not rendered);
  // the wrapper is the scroll container
  const listStyle: React.CSSProperties = {
    position: 'relative',
    marginTop: 0,
    marginBottom: 0,
    paddingTop: first ? first.start : 0,
    paddingBottom: last ? totalSize - last.end : totalSize,
  }

  return (
    <div className="virtualized-viewport" ref={node} style={{ maxHeight: height, overflowY: 'auto' }}>
      <ul className={`root ${searchModeOn ? 'searchModeOn' : ''} virtualized`} style={listStyle} {...ariaAttributes}>
        {items.map(item => {
          const treeNode = rows.nodes[item.index]
          const liProps = {
            ref: virtualizer.measureElement,
            'data-index': item.index,
            'aria-setsize': rows.setSize[item.index],
            'aria-posinset': rows.posInSet[item.index],
            style: isDetached(item.index)
              ? ({ position: 'absolute', top: item.start, left: 0, right: 0 } as React.CSSProperties)
              : undefined,
          }
          return (
            <TreeNode
              keepTreeOnSearch={keepTreeOnSearch}
              keepChildrenOnSearch={keepChildrenOnSearch}
              key={treeNode._id}
              {...treeNode}
              searchModeOn={searchModeOn}
              onChange={onChange}
              onCheckboxChange={onCheckboxChange}
              onNodeToggle={onNodeToggle}
              onAction={onAction}
              mode={mode}
              showPartiallySelected={showPartiallySelected}
              readOnly={readOnly}
              clientId={clientId}
              activeDescendant={activeDescendant}
              liProps={liProps}
            />
          )
        })}
      </ul>
    </div>
  )
}

export default VirtualizedTree
