/*!
 * React Dropdown Tree Select
 * A lightweight, fast and highly customizable tree select component.
 * Hrusikesh Panda <hrusikesh.panda@dowjones.com>
 * Copyright (c) 2017 Dow Jones, Inc. <support@dowjones.com> (http://dowjones.com)
 * license MIT
 * see https://github.com/dowjones/react-dropdown-tree-select
 */
import PropTypes from 'prop-types'
import React, { forwardRef, useImperativeHandle } from 'react'

import Input from './input'
import Tags from './tags'
import Trigger from './trigger'
import Tree from './tree'
import useDropdownTreeSelect from './hooks/useDropdownTreeSelect'

import './index.css'
import { getAriaLabel } from './a11y'
import { DropdownTreeSelectProps, TextProps } from './types'

export * from './types'

/** Instance members exposed through `ref` (kept for backwards compatibility with the former class component) */
export interface DropdownTreeSelectHandle {
  readonly node: HTMLDivElement
  readonly searchInput: HTMLInputElement
  keepDropdownActive: boolean
  handleClick: (e?: unknown, callback?: () => void) => void
}

const EMPTY_TEXTS: TextProps = {}

const DropdownTreeSelect = forwardRef<DropdownTreeSelectHandle, DropdownTreeSelectProps>(function DropdownTreeSelect(
  props,
  ref
) {
  const {
    disabled,
    readOnly,
    mode,
    texts = EMPTY_TEXTS,
    inlineSearchInput = false,
    tabIndex = 0,
    className,
    keepTreeOnSearch,
    keepChildrenOnSearch,
    showPartiallySelected,
    virtualized,
  } = props

  const {
    clientId,
    showDropdown,
    searchModeOn,
    activeDescendant,
    allNodesHidden,
    tree,
    tags,
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
    onAction,
    onCheckboxChange,
    onNodeToggle,
  } = useDropdownTreeSelect(props)

  useImperativeHandle(
    ref,
    () => ({
      get node() {
        return nodeRef.current as HTMLDivElement
      },
      get searchInput() {
        return searchInputRef.current as HTMLInputElement
      },
      get keepDropdownActive() {
        return keepDropdownActiveRef.current
      },
      set keepDropdownActive(value: boolean) {
        keepDropdownActiveRef.current = value
      },
      handleClick,
    }),
    [nodeRef, searchInputRef, keepDropdownActiveRef, handleClick]
  )

  const commonProps = { disabled, readOnly, activeDescendant, texts, mode, clientId }

  const searchInput = (
    <Input
      inputRef={searchInputRef}
      onInputChange={onInputChange}
      onFocus={onInputFocus}
      onBlur={onInputBlur}
      onKeyDown={onKeyboardKeyDown}
      {...commonProps}
      inlineSearchInput={inlineSearchInput}
    />
  )

  const ariaAttributes = mode === 'radioSelect' ? { role: 'radiogroup', ...getAriaLabel(texts.label) } : {}

  return (
    <div
      id={clientId}
      className={[className && className, 'react-dropdown-tree-select'].filter(Boolean).join(' ')}
      ref={nodeRef}
    >
      <div
        className={['dropdown', mode === 'simpleSelect' && 'simple-select', mode === 'radioSelect' && 'radio-select']
          .filter(Boolean)
          .join(' ')}
      >
        <Trigger onTrigger={onTrigger} showDropdown={showDropdown} {...commonProps} tags={tags} tabIndex={tabIndex}>
          <Tags tags={tags} onTagRemove={onTagRemove} {...commonProps}>
            {!inlineSearchInput && searchInput}
          </Tags>
        </Trigger>
        {showDropdown && (
          <div className="dropdown-content" {...ariaAttributes}>
            {inlineSearchInput && searchInput}
            {allNodesHidden ? (
              <span className="no-matches">{texts.noMatches || 'No matches found'}</span>
            ) : (
              <Tree
                data={tree}
                treeVersion={treeVersion}
                keepTreeOnSearch={keepTreeOnSearch}
                keepChildrenOnSearch={keepChildrenOnSearch}
                searchModeOn={searchModeOn}
                onAction={onAction}
                onCheckboxChange={onCheckboxChange}
                onNodeToggle={onNodeToggle}
                showPartiallySelected={showPartiallySelected}
                virtualized={virtualized}
                {...commonProps}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
})

const propTypes = {
  data: PropTypes.oneOfType([PropTypes.object, PropTypes.array]).isRequired,
  clearSearchOnChange: PropTypes.bool,
  keepTreeOnSearch: PropTypes.bool,
  keepChildrenOnSearch: PropTypes.bool,
  keepOpenOnSelect: PropTypes.bool,
  texts: PropTypes.shape({
    placeholder: PropTypes.string,
    inlineSearchPlaceholder: PropTypes.string,
    noMatches: PropTypes.string,
    label: PropTypes.string,
    labelRemove: PropTypes.string,
  }),
  showDropdown: PropTypes.oneOf(['default', 'initial', 'always']),
  className: PropTypes.string,
  onChange: PropTypes.func,
  onAction: PropTypes.func,
  onNodeToggle: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  mode: PropTypes.oneOf(['multiSelect', 'simpleSelect', 'radioSelect', 'hierarchical']),
  showPartiallySelected: PropTypes.bool,
  disabled: PropTypes.bool,
  readOnly: PropTypes.bool,
  id: PropTypes.string,
  searchPredicate: PropTypes.func,
  inlineSearchInput: PropTypes.bool,
  tabIndex: PropTypes.number,
  disablePoppingOnBackspace: PropTypes.bool,
  virtualized: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.shape({ itemHeight: PropTypes.number, overscan: PropTypes.number, height: PropTypes.number }),
  ]),
}

DropdownTreeSelect.propTypes = propTypes as React.WeakValidationMap<
  DropdownTreeSelectProps & React.RefAttributes<DropdownTreeSelectHandle>
>

/** Type of the component instance exposed through `ref`, e.g. `useRef<DropdownTreeSelect>(null)` */
// eslint-disable-next-line @typescript-eslint/no-redeclare
type DropdownTreeSelect = DropdownTreeSelectHandle

export default DropdownTreeSelect
