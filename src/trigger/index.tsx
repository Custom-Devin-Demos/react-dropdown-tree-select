import React, { memo, useRef } from 'react'
import PropTypes from 'prop-types'

import { getAriaLabel } from '../a11y'
import { getTagId } from '../tag'
import { InternalTreeNode, Mode, TextProps } from '../types'

export interface TriggerProps {
  onTrigger: (e: React.MouseEvent | React.KeyboardEvent) => void
  disabled?: boolean
  readOnly?: boolean
  showDropdown?: boolean
  mode?: Mode
  texts?: TextProps
  clientId?: string
  tags?: InternalTreeNode[]
  tabIndex?: number
  activeDescendant?: string
  children?: React.ReactNode
}

const Trigger = ({
  onTrigger,
  disabled,
  readOnly,
  showDropdown,
  mode,
  texts = {},
  clientId,
  tags,
  tabIndex,
  children,
}: TriggerProps) => {
  const triggerNode = useRef<HTMLAnchorElement | null>(null)

  const getAriaAttributes = () => {
    const triggerId = `${clientId}_trigger`
    const labelledBy: string[] = []
    let labelAttributes = getAriaLabel(texts.label)
    if (tags && tags.length) {
      if (labelAttributes['aria-label']) {
        // Adds reference to self when having aria-label
        labelledBy.push(triggerId)
      }
      tags.forEach(t => {
        labelledBy.push(getTagId(t._id))
      })
      labelAttributes = getAriaLabel(texts.label, labelledBy.join(' '))
    }

    const attributes: React.HTMLAttributes<HTMLAnchorElement> = {
      id: triggerId,
      role: 'button',
      tabIndex,
      'aria-haspopup': mode === 'simpleSelect' ? 'listbox' : 'tree',
      'aria-expanded': showDropdown ? 'true' : 'false',
      ...labelAttributes,
    }

    return attributes
  }

  const handleTrigger = (event: React.MouseEvent<HTMLAnchorElement> | React.KeyboardEvent<HTMLAnchorElement>) => {
    const e = event as React.KeyboardEvent<HTMLAnchorElement>
    // Just return if triggered from keyDown and the key isn't enter, space or arrow down
    if (e.key && e.keyCode !== 13 && e.keyCode !== 32 && e.keyCode !== 40) {
      return
    } else if (e.key && triggerNode.current && triggerNode.current !== document.activeElement) {
      // Do not trigger if not activeElement
      return
    } else if (!showDropdown && e.keyCode === 32) {
      // Avoid adding space to input on open
      e.preventDefault()
    }

    // Else this is a key press that should trigger the dropdown
    onTrigger(e)
  }

  const dropdownTriggerClassname = [
    'dropdown-trigger',
    'arrow',
    disabled && 'disabled',
    readOnly && 'readOnly',
    showDropdown && 'top',
    !showDropdown && 'bottom',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <a
      ref={triggerNode}
      className={dropdownTriggerClassname}
      onClick={!disabled ? handleTrigger : undefined}
      onKeyDown={!disabled ? handleTrigger : undefined}
      {...getAriaAttributes()}
    >
      {children}
    </a>
  )
}

Trigger.propTypes = {
  onTrigger: PropTypes.func,
  disabled: PropTypes.bool,
  readOnly: PropTypes.bool,
  showDropdown: PropTypes.bool,
  mode: PropTypes.oneOf(['multiSelect', 'simpleSelect', 'radioSelect', 'hierarchical']),
  texts: PropTypes.object,
  clientId: PropTypes.string,
  tags: PropTypes.array,
  tabIndex: PropTypes.number,
}

export default memo(Trigger)
