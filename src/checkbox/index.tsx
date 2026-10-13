import React, { memo } from 'react'
import PropTypes from 'prop-types'

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean
  indeterminate?: boolean
}

export const refUpdater =
  ({ checked, indeterminate }: { checked?: boolean; indeterminate?: boolean }) =>
  (input: HTMLInputElement | null) => {
    if (input) {
      input.checked = checked as boolean
      input.indeterminate = indeterminate as boolean
    }
  }

const Checkbox = ({ checked, indeterminate = false, onChange, disabled, readOnly, ...rest }: CheckboxProps) => {
  const isDisabled = disabled || readOnly

  return (
    <input
      type="checkbox"
      ref={refUpdater({ checked, indeterminate })}
      onChange={onChange}
      disabled={isDisabled}
      {...rest}
    />
  )
}

Checkbox.propTypes = {
  checked: PropTypes.bool,
  indeterminate: PropTypes.bool,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  readOnly: PropTypes.bool,
}

export default memo(Checkbox)
