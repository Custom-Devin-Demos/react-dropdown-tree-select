import React, { memo, useMemo, useRef } from 'react'
import PropTypes from 'prop-types'
import { debounce, useIsomorphicLayoutEffect } from '../utils'
import { getAriaLabel } from '../a11y'
import { InternalTreeNode, Mode, TextProps } from '../types'

export interface InputProps {
  tags?: InternalTreeNode[]
  texts?: TextProps
  onInputChange: (value: string) => void
  onFocus?: React.FocusEventHandler<HTMLInputElement>
  onBlur?: React.FocusEventHandler<HTMLInputElement>
  onTagRemove?: (id: string, isKeyboardEvent: boolean) => void
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  inputRef?: React.Ref<HTMLInputElement>
  disabled?: boolean
  readOnly?: boolean
  activeDescendant?: string
  inlineSearchInput?: boolean
  mode?: Mode
  clientId?: string
}

const Input = ({
  inputRef,
  texts = {},
  onInputChange,
  onFocus,
  onBlur,
  disabled,
  readOnly,
  onKeyDown,
  activeDescendant,
  inlineSearchInput,
}: InputProps) => {
  const onInputChangeRef = useRef(onInputChange)
  useIsomorphicLayoutEffect(() => {
    onInputChangeRef.current = onInputChange
  })

  const delayedCallback = useMemo(() => debounce((value: string) => onInputChangeRef.current(value), 300), [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    delayedCallback(e.target.value)
  }

  return (
    <input
      type="text"
      disabled={disabled}
      ref={inputRef}
      className="search"
      placeholder={inlineSearchInput ? texts.inlineSearchPlaceholder || 'Search...' : texts.placeholder || 'Choose...'}
      onKeyDown={onKeyDown}
      onChange={handleInputChange}
      onFocus={onFocus}
      onBlur={onBlur}
      readOnly={readOnly}
      aria-activedescendant={activeDescendant}
      aria-autocomplete={onKeyDown ? 'list' : undefined}
      {...getAriaLabel(texts.label)}
    />
  )
}

Input.propTypes = {
  tags: PropTypes.array,
  texts: PropTypes.object,
  onInputChange: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  onTagRemove: PropTypes.func,
  onKeyDown: PropTypes.func,
  inputRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  disabled: PropTypes.bool,
  readOnly: PropTypes.bool,
  activeDescendant: PropTypes.string,
  inlineSearchInput: PropTypes.bool,
}

export default memo(Input)
