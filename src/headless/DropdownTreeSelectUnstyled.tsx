import React, { forwardRef, useImperativeHandle } from 'react'

import Input from '../input'
import Tags from '../tags'
import Trigger from '../trigger'
import Tree from '../tree'
import { DropdownTreeSelectProps, TextProps } from '../types'
import ClassNamesContext from './ClassNamesContext'
import dropdownTreeSelectPropTypes from './propTypes'
import { buildContentProps, buildDropdownProps, buildRootProps } from './prop-getters'
import { useDropdownTreeSelectController } from './useDropdownTreeSelect'

/** Instance members exposed through `ref` (kept for backwards compatibility with the former class component) */
export interface DropdownTreeSelectHandle {
  readonly node: HTMLDivElement
  readonly searchInput: HTMLInputElement
  keepDropdownActive: boolean
  handleClick: (e?: unknown, callback?: () => void) => void
}

const EMPTY_TEXTS: TextProps = {}

/**
 * `DropdownTreeSelect` without any CSS: renders the same markup and class names, so you can bring your own styles
 * (optionally adding classes through `classNames`).
 */
const DropdownTreeSelectUnstyled = forwardRef<DropdownTreeSelectHandle, DropdownTreeSelectProps>(
  function DropdownTreeSelectUnstyled(props, ref) {
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

    const { internal, classNames, applySearch } = useDropdownTreeSelectController(props, false)
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
      onInputFocus,
      onInputBlur,
      onKeyboardKeyDown,
      onTrigger,
      onTagRemove,
      onAction,
      onCheckboxChange,
      onNodeToggle,
    } = internal

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
        onInputChange={applySearch}
        onFocus={onInputFocus}
        onBlur={onInputBlur}
        onKeyDown={onKeyboardKeyDown}
        {...commonProps}
        inlineSearchInput={inlineSearchInput}
      />
    )

    return (
      <ClassNamesContext.Provider value={classNames}>
        <div {...buildRootProps({ clientId, className, extraClassName: classNames.root, rootRef: nodeRef })}>
          <div {...buildDropdownProps({ mode, className: classNames.dropdown })}>
            <Trigger onTrigger={onTrigger} showDropdown={showDropdown} {...commonProps} tags={tags} tabIndex={tabIndex}>
              <Tags tags={tags} onTagRemove={onTagRemove} {...commonProps}>
                {!inlineSearchInput && searchInput}
              </Tags>
            </Trigger>
            {showDropdown && (
              <div {...buildContentProps({ mode, texts, className: classNames.content })}>
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
      </ClassNamesContext.Provider>
    )
  }
)

DropdownTreeSelectUnstyled.propTypes = dropdownTreeSelectPropTypes as React.WeakValidationMap<
  DropdownTreeSelectProps & React.RefAttributes<DropdownTreeSelectHandle>
>

export default DropdownTreeSelectUnstyled
