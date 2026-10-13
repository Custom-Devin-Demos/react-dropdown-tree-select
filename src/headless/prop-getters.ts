import React from 'react'

import { getAriaLabel } from '../a11y'
import { getDataset } from '../utils'
import { getAriaAttributes as getNodeAriaAttributes, getNodeCx, isLeafNode } from '../tree-node'
import { InternalTreeNode, Mode, TextProps } from '../types'

/**
 * Pure builders for the attributes/handlers of every element rendered by the dropdown.
 * They are shared by the styled components and the public `useDropdownTreeSelect` prop getters,
 * so the markup, a11y attributes and keyboard handling have a single source of truth.
 */

type ClassName = string | false | null | undefined

export const cx = (...names: ClassName[]) => names.filter(Boolean).join(' ')

export const getTagId = (id: string) => `${id}_tag`

const isSingleSelect = (mode?: Mode) => mode === 'simpleSelect' || mode === 'radioSelect'

const stopEvent = (e: React.SyntheticEvent) => {
  e.stopPropagation()
  e.nativeEvent.stopImmediatePropagation()
}

export interface RootPropsOptions {
  clientId: string
  className?: string
  extraClassName?: string
  rootRef?: React.Ref<HTMLDivElement>
}

export const buildRootProps = ({ clientId, className, extraClassName, rootRef }: RootPropsOptions) => ({
  id: clientId,
  className: cx(className, 'react-dropdown-tree-select', extraClassName),
  ref: rootRef,
})

export const buildDropdownProps = ({ mode, className }: { mode?: Mode; className?: string }) => ({
  className: cx(
    'dropdown',
    mode === 'simpleSelect' && 'simple-select',
    mode === 'radioSelect' && 'radio-select',
    className
  ),
})

export interface TriggerPropsOptions {
  onTrigger: (e: React.MouseEvent | React.KeyboardEvent) => void
  triggerRef: React.MutableRefObject<HTMLAnchorElement | null>
  disabled?: boolean
  readOnly?: boolean
  showDropdown?: boolean
  mode?: Mode
  texts?: TextProps
  clientId?: string
  /** ids of the selected tags */
  tagIds?: string[]
  tabIndex?: number
  className?: string
}

export const buildTriggerProps = ({
  onTrigger,
  triggerRef,
  disabled,
  readOnly,
  showDropdown,
  mode,
  texts = {},
  clientId,
  tagIds,
  tabIndex,
  className,
}: TriggerPropsOptions) => {
  const triggerId = `${clientId}_trigger`
  const labelledBy: string[] = []
  let labelAttributes = getAriaLabel(texts.label)
  if (tagIds && tagIds.length) {
    if (labelAttributes['aria-label']) {
      // Adds reference to self when having aria-label
      labelledBy.push(triggerId)
    }
    tagIds.forEach(id => {
      labelledBy.push(getTagId(id))
    })
    labelAttributes = getAriaLabel(texts.label, labelledBy.join(' '))
  }

  const handleTrigger = (event: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => {
    const e = event as React.KeyboardEvent<HTMLElement>
    // Just return if triggered from keyDown and the key isn't enter, space or arrow down
    if (e.key && e.keyCode !== 13 && e.keyCode !== 32 && e.keyCode !== 40) {
      return
    } else if (e.key && triggerRef.current && triggerRef.current !== document.activeElement) {
      // Do not trigger if not activeElement
      return
    } else if (!showDropdown && e.keyCode === 32) {
      // Avoid adding space to input on open
      e.preventDefault()
    }

    // Else this is a key press that should trigger the dropdown
    onTrigger(e)
  }

  return {
    ref: triggerRef,
    className: cx(
      'dropdown-trigger',
      'arrow',
      disabled && 'disabled',
      readOnly && 'readOnly',
      showDropdown && 'top',
      !showDropdown && 'bottom',
      className
    ),
    onClick: !disabled ? handleTrigger : undefined,
    onKeyDown: !disabled ? handleTrigger : undefined,
    id: triggerId,
    role: 'button',
    tabIndex,
    'aria-haspopup': (mode === 'simpleSelect' ? 'listbox' : 'tree') as 'listbox' | 'tree',
    'aria-expanded': (showDropdown ? 'true' : 'false') as 'true' | 'false',
    ...labelAttributes,
  }
}

export interface InputPropsOptions {
  inputRef?: React.Ref<HTMLInputElement>
  texts?: TextProps
  onChange: React.ChangeEventHandler<HTMLInputElement>
  onFocus?: React.FocusEventHandler<HTMLInputElement>
  onBlur?: React.FocusEventHandler<HTMLInputElement>
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  disabled?: boolean
  readOnly?: boolean
  activeDescendant?: string
  inlineSearchInput?: boolean
  className?: string
}

export const buildInputProps = ({
  inputRef,
  texts = {},
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  disabled,
  readOnly,
  activeDescendant,
  inlineSearchInput,
  className,
}: InputPropsOptions) => ({
  type: 'text',
  disabled,
  ref: inputRef,
  className: cx('search', className),
  placeholder: inlineSearchInput ? texts.inlineSearchPlaceholder || 'Search...' : texts.placeholder || 'Choose...',
  onKeyDown,
  onChange,
  onFocus,
  onBlur,
  readOnly,
  'aria-activedescendant': activeDescendant,
  'aria-autocomplete': (onKeyDown ? 'list' : undefined) as 'list' | undefined,
  ...getAriaLabel(texts.label),
})

export const buildContentProps = ({
  mode,
  texts = {},
  className,
}: {
  mode?: Mode
  texts?: TextProps
  className?: string
}) => ({
  className: cx('dropdown-content', className),
  ...(mode === 'radioSelect' ? { role: 'radiogroup', ...getAriaLabel(texts.label) } : {}),
})

export const buildTagProps = ({ id, label, className }: { id: string; label: string; className?: string }) => ({
  className: cx('tag', className),
  id: getTagId(id),
  'aria-label': label,
})

export interface TagRemovePropsOptions {
  id: string
  onDelete: (id: string, isKeyboardEvent: boolean) => void
  labelRemove?: string
  readOnly?: boolean
  disabled?: boolean
}

type TagEvent = React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>

export const buildTagRemoveProps = ({
  id,
  onDelete,
  labelRemove = 'Remove',
  readOnly,
  disabled,
}: TagRemovePropsOptions) => {
  const handleClick = (e: TagEvent) => {
    stopEvent(e)
    onDelete(id, ((e as React.KeyboardEvent).key || (e as React.KeyboardEvent).keyCode) !== undefined)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Backspace') {
      handleClick(e)
      e.preventDefault()
    }
  }

  const onKeyUp = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.keyCode === 32 || ['Delete', 'Enter'].indexOf(e.key) > -1) {
      handleClick(e)
      e.preventDefault()
    }
  }

  const tagId = getTagId(id)
  const buttonId = `${id}_button`
  const isDisabled = readOnly || disabled

  return {
    id: buttonId,
    onClick: !isDisabled ? handleClick : undefined,
    onKeyDown: !isDisabled ? onKeyDown : undefined,
    onKeyUp: !isDisabled ? onKeyUp : undefined,
    className: cx('tag-remove', readOnly && 'readOnly', disabled && 'disabled'),
    type: 'button' as const,
    'aria-label': labelRemove,
    'aria-labelledby': `${buttonId} ${tagId}`,
    'aria-disabled': isDisabled,
  }
}

export const buildListProps = ({
  mode,
  searchModeOn,
  className,
}: {
  mode?: Mode
  searchModeOn?: boolean
  className?: string
}) => ({
  className: cx('root', searchModeOn && 'searchModeOn', className),
  /* https://www.w3.org/TR/wai-aria-1.1/#select
   * https://www.w3.org/TR/wai-aria-1.1/#tree */
  role: mode === 'simpleSelect' ? 'listbox' : 'tree',
  'aria-multiselectable': /multiSelect|hierarchical/.test(mode as string),
})

export interface NodePropsOptions {
  mode?: Mode
  keepTreeOnSearch?: boolean
  keepChildrenOnSearch?: boolean
  searchModeOn?: boolean
  showPartiallySelected?: boolean
  readOnly?: boolean
  className?: string
}

export const buildNodeProps = (node: InternalTreeNode, options: NodePropsOptions) => {
  const { keepTreeOnSearch, searchModeOn, className } = options
  const props = { ...node, ...options, className: node.className } as Parameters<typeof getNodeCx>[0]
  return {
    className: cx(getNodeCx(props), className),
    style: keepTreeOnSearch || !searchModeOn ? { paddingLeft: `${(node._depth || 0) * 20}px` } : {},
    id: `${node._id}_li`,
    ...getDataset(node.dataset),
    ...getNodeAriaAttributes(props),
  }
}

export interface ToggleOptions {
  onNodeToggle: (id: string) => void
  mode?: Mode
  className?: string
}

export const buildToggleProps = (node: InternalTreeNode, { onNodeToggle, mode, className }: ToggleOptions) => {
  const { _id: id, expanded } = node
  const toggleCx = cx('toggle', expanded && 'expanded', !expanded && 'collapsed', className)
  const isLeaf = isLeafNode({ ...node, mode } as Parameters<typeof isLeafNode>[0])

  if (isLeaf) {
    return {
      role: 'button',
      tabIndex: -1,
      className: toggleCx,
      style: { visibility: 'hidden' } as React.CSSProperties,
      'aria-hidden': true,
    }
  }

  return {
    role: 'button',
    tabIndex: -1,
    className: toggleCx,
    onClick: (e: React.MouseEvent<HTMLElement>) => {
      stopEvent(e)
      onNodeToggle(id)
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key === 'Enter' || e.keyCode === 32) {
        onNodeToggle(id)
        e.preventDefault()
      }
    },
    'aria-hidden': true,
  }
}

export interface CheckboxOptions {
  mode?: Mode
  clientId?: string
  showPartiallySelected?: boolean
  readOnly?: boolean
  onCheckboxChange: (id: string, checked: boolean) => void
  className?: string
}

export const buildCheckboxProps = (
  node: InternalTreeNode,
  { mode, clientId, showPartiallySelected, readOnly, onCheckboxChange, className }: CheckboxOptions
) => {
  const { _id: id, value, checked, disabled, partial } = node
  const isRadio = mode === 'radioSelect'
  const indeterminate = !!(showPartiallySelected && partial)

  return {
    type: isRadio ? 'radio' : 'checkbox',
    name: isRadio ? clientId : id,
    className: cx(isRadio ? 'radio-item' : 'checkbox-item', mode === 'simpleSelect' && 'simple-select', className),
    id,
    value,
    checked: !!checked,
    disabled: disabled || readOnly,
    readOnly,
    tabIndex: -1,
    ref: (input: HTMLInputElement | null) => {
      if (input) input.indeterminate = indeterminate
    },
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckboxChange(id, isSingleSelect(mode) ? true : e.target.checked)
      stopEvent(e)
    },
  }
}
