import PropTypes from 'prop-types'
import React, { memo } from 'react'

import './index.css'

export const getTagId = (id: string) => `${id}_tag`

export interface TagProps {
  id: string
  label: string
  onDelete: (id: string, isKeyboardEvent: boolean) => void
  readOnly?: boolean
  disabled?: boolean
  labelRemove?: string
}

type TagEvent = React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>

const Tag = ({ id, label, labelRemove = 'Remove', readOnly, disabled, onDelete }: TagProps) => {
  const handleClick = (e: TagEvent) => {
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()
    onDelete(id, ((e as React.KeyboardEvent).key || (e as React.KeyboardEvent).keyCode) !== undefined)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Backspace') {
      handleClick(e)
      e.preventDefault()
    }
  }

  const onKeyUp = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.keyCode === 32 || ['Delete', 'Enter'].indexOf(e.key) > -1) {
      handleClick(e)
      e.preventDefault()
    }
  }

  const tagId = getTagId(id)
  const buttonId = `${id}_button`
  const className = ['tag-remove', readOnly && 'readOnly', disabled && 'disabled'].filter(Boolean).join(' ')
  const isDisabled = readOnly || disabled

  return (
    <span className="tag" id={tagId} aria-label={label}>
      {label}
      <button
        id={buttonId}
        onClick={!isDisabled ? handleClick : undefined}
        onKeyDown={!isDisabled ? onKeyDown : undefined}
        onKeyUp={!isDisabled ? onKeyUp : undefined}
        className={className}
        type="button"
        aria-label={labelRemove}
        aria-labelledby={`${buttonId} ${tagId}`}
        aria-disabled={isDisabled}
      >
        x
      </button>
    </span>
  )
}

Tag.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  onDelete: PropTypes.func,
  readOnly: PropTypes.bool,
  disabled: PropTypes.bool,
  labelRemove: PropTypes.string,
}

export default memo(Tag)
