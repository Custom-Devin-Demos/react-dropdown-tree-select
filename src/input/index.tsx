import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { debounce } from '../utils'
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

class Input extends PureComponent<InputProps> {
  static propTypes = {
    tags: PropTypes.array,
    texts: PropTypes.object,
    onInputChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onTagRemove: PropTypes.func,
    onKeyDown: PropTypes.func,
    inputRef: PropTypes.func,
    disabled: PropTypes.bool,
    readOnly: PropTypes.bool,
    activeDescendant: PropTypes.string,
    inlineSearchInput: PropTypes.bool,
  }

  delayedCallback: (e: React.ChangeEvent<HTMLInputElement>) => void

  constructor(props: InputProps) {
    super(props)
    this.delayedCallback = debounce(
      (e: React.ChangeEvent<HTMLInputElement>) => this.props.onInputChange(e.target.value),
      300
    )
  }

  handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.persist()
    this.delayedCallback(e)
  }

  render() {
    const {
      inputRef,
      texts = {},
      onFocus,
      onBlur,
      disabled,
      readOnly,
      onKeyDown,
      activeDescendant,
      inlineSearchInput,
    } = this.props

    return (
      <input
        type="text"
        disabled={disabled}
        ref={inputRef}
        className="search"
        placeholder={
          inlineSearchInput ? texts.inlineSearchPlaceholder || 'Search...' : texts.placeholder || 'Choose...'
        }
        onKeyDown={onKeyDown}
        onChange={this.handleInputChange}
        onFocus={onFocus}
        onBlur={onBlur}
        readOnly={readOnly}
        aria-activedescendant={activeDescendant}
        aria-autocomplete={onKeyDown ? 'list' : undefined}
        {...getAriaLabel(texts.label)}
      />
    )
  }
}

export default Input
