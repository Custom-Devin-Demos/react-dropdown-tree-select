import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'

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

class Tag extends PureComponent<TagProps> {
  static propTypes = {
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    onDelete: PropTypes.func,
    readOnly: PropTypes.bool,
    disabled: PropTypes.bool,
    labelRemove: PropTypes.string,
  }

  handleClick = (e: TagEvent) => {
    const { id, onDelete } = this.props
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()
    onDelete(id, ((e as React.KeyboardEvent).key || (e as React.KeyboardEvent).keyCode) !== undefined)
  }

  onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Backspace') {
      this.handleClick(e)
      e.preventDefault()
    }
  }

  onKeyUp = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.keyCode === 32 || ['Delete', 'Enter'].indexOf(e.key) > -1) {
      this.handleClick(e)
      e.preventDefault()
    }
  }

  render() {
    const { id, label, labelRemove = 'Remove', readOnly, disabled } = this.props

    const tagId = getTagId(id)
    const buttonId = `${id}_button`
    const className = ['tag-remove', readOnly && 'readOnly', disabled && 'disabled'].filter(Boolean).join(' ')
    const isDisabled = readOnly || disabled

    return (
      <span className="tag" id={tagId} aria-label={label}>
        {label}
        <button
          id={buttonId}
          onClick={!isDisabled ? this.handleClick : undefined}
          onKeyDown={!isDisabled ? this.onKeyDown : undefined}
          onKeyUp={!isDisabled ? this.onKeyUp : undefined}
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
}

export default Tag
