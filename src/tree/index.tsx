import InfiniteScroll from 'react-infinite-scroll-component'
import PropTypes from 'prop-types'
import React, { useCallback, useMemo, useRef, useState } from 'react'

import TreeNode from '../tree-node'
import VirtualizedTree from './virtualized'
import { findIndex, useIsomorphicLayoutEffect } from '../utils'
import { InternalTreeNode, Mode, NodeAction, TreeNodeMap, VirtualizationOptions } from '../types'

export interface TreeProps {
  data: TreeNodeMap
  keepTreeOnSearch?: boolean
  keepChildrenOnSearch?: boolean
  searchModeOn?: boolean
  onChange?: (...args: any[]) => void
  onNodeToggle: (id: string) => void
  onAction?: (nodeId: string, action: NodeAction) => void
  onCheckboxChange: (id: string, checked: boolean) => void
  mode?: Mode
  showPartiallySelected?: boolean
  pageSize?: number
  readOnly?: boolean
  disabled?: boolean
  texts?: object
  clientId?: string
  activeDescendant?: string
  /** Bumped by the owner whenever nodes inside `data` were mutated in place */
  treeVersion?: number
  /** Renders only the rows in view (see `DropdownTreeSelectProps#virtualized`) instead of paginating */
  virtualized?: boolean | VirtualizationOptions
}

const shouldRenderNode = (node: InternalTreeNode, data: TreeNodeMap, searchModeOn?: boolean) => {
  const { expanded, _parent } = node
  if (searchModeOn || expanded) return true

  const parent = _parent && data.get(_parent)
  // if it has a parent, then check parent's state.
  // otherwise root nodes are always rendered
  return !parent || parent.expanded
}

const getPageOfActiveDescendant = (nodes: React.ReactElement[], activeDescendant: string, pageSize: number) => {
  const currentId = activeDescendant.replace(/_li$/, '')
  const focusIndex = findIndex(nodes, n => n.key === currentId) + 1
  return focusIndex > 0 ? Math.ceil(focusIndex / pageSize) : 1
}

const PagedTree = ({
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
  pageSize = 100,
}: TreeProps) => {
  const node = useRef<HTMLUListElement | null>(null)
  const [scrollableTarget, setScrollableTarget] = useState<HTMLElement | null>(null)

  useIsomorphicLayoutEffect(() => {
    setScrollableTarget(node.current && (node.current.parentNode as HTMLElement))
  }, [])

  const allVisibleNodes = useMemo(() => {
    const items: React.ReactElement[] = []
    data.forEach(treeNode => {
      if (shouldRenderNode(treeNode, data, searchModeOn)) {
        items.push(
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
          />
        )
      }
    })
    return items
    // treeVersion signals in-place mutations of the nodes in `data`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
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
  ])

  // Jump to the page containing the active descendant whenever it changes
  const [paging, setPaging] = useState(() => ({
    activeDescendant,
    currentPage: activeDescendant ? getPageOfActiveDescendant(allVisibleNodes, activeDescendant, pageSize) : 1,
  }))
  let { currentPage } = paging
  if (paging.activeDescendant !== activeDescendant) {
    if (activeDescendant) currentPage = getPageOfActiveDescendant(allVisibleNodes, activeDescendant, pageSize)
    setPaging({ activeDescendant, currentPage })
  }

  const totalPages = Math.ceil(allVisibleNodes.length / pageSize)
  const items = useMemo(
    () => allVisibleNodes.slice(0, currentPage * pageSize),
    [allVisibleNodes, currentPage, pageSize]
  )

  const loadMore = useCallback(() => setPaging(prev => ({ ...prev, currentPage: prev.currentPage + 1 })), [])

  const ariaAttributes = {
    /* https://www.w3.org/TR/wai-aria-1.1/#select
     * https://www.w3.org/TR/wai-aria-1.1/#tree */
    role: mode === 'simpleSelect' ? 'listbox' : 'tree',
    'aria-multiselectable': /multiSelect|hierarchical/.test(mode as string),
  }

  return (
    <ul className={`root ${searchModeOn ? 'searchModeOn' : ''}`} ref={node} {...ariaAttributes}>
      {scrollableTarget && (
        <InfiniteScroll
          dataLength={items.length}
          next={loadMore}
          hasMore={currentPage < totalPages}
          loader={<span className="searchLoader">Loading...</span>}
          scrollableTarget={scrollableTarget}
        >
          {items}
        </InfiniteScroll>
      )}
    </ul>
  )
}

const Tree = (props: TreeProps) => (props.virtualized ? <VirtualizedTree {...props} /> : <PagedTree {...props} />)

Tree.propTypes = {
  data: PropTypes.object,
  keepTreeOnSearch: PropTypes.bool,
  keepChildrenOnSearch: PropTypes.bool,
  searchModeOn: PropTypes.bool,
  onChange: PropTypes.func,
  onNodeToggle: PropTypes.func,
  onAction: PropTypes.func,
  onCheckboxChange: PropTypes.func,
  mode: PropTypes.oneOf(['multiSelect', 'simpleSelect', 'radioSelect', 'hierarchical']),
  showPartiallySelected: PropTypes.bool,
  pageSize: PropTypes.number,
  readOnly: PropTypes.bool,
  clientId: PropTypes.string,
  activeDescendant: PropTypes.string,
  treeVersion: PropTypes.number,
  virtualized: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
}

export default Tree
