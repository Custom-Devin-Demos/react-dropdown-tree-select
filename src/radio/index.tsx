import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

export interface RadioButtonProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  name: string
  checked?: boolean
}

export const refUpdater =
  ({ checked }: { checked?: boolean }) =>
  (input: HTMLInputElement | null) => {
    if (input) {
      input.checked = checked as boolean
    }
  }

class RadioButton extends PureComponent<RadioButtonProps> {
  static propTypes = {
    name: PropTypes.string.isRequired,
    checked: PropTypes.bool,
    onChange: PropTypes.func,
    disabled: PropTypes.bool,
    readOnly: PropTypes.bool,
  }

  render() {
    const { name, checked, onChange, disabled, readOnly, ...rest } = this.props

    const isDisabled = disabled || readOnly

    return (
      <input
        type="radio"
        name={name}
        ref={refUpdater({ checked })}
        onChange={onChange}
        disabled={isDisabled}
        {...rest}
      />
    )
  }
}

export default RadioButton
