import PropTypes from 'prop-types'
import React, { memo } from 'react'
import Checkbox from '../checkbox'
import RadioButton from '../radio'

import { Mode, NodeAction, NodeDataSet } from '../types'

export interface NodeLabelProps {
  id: string
  actions?: NodeAction[]
  title?: string
  label: string
  value: string
  checked?: boolean
  partial?: boolean
  disabled?: boolean
  dataset?: NodeDataSet
  mode?: Mode
  showPartiallySelected?: boolean
  onCheckboxChange: (id: string, checked: boolean) => void
  readOnly?: boolean
  clientId?: string
}

const NodeLabel = ({
  mode,
  title,
  label,
  id,
  partial,
  checked,
  value,
  disabled,
  showPartiallySelected,
  readOnly,
  clientId,
  onCheckboxChange,
}: NodeLabelProps) => {
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement> | React.MouseEvent<HTMLSpanElement>) => {
    if (mode === 'simpleSelect' || mode === 'radioSelect') {
      onCheckboxChange(id, true)
    } else {
      const {
        target: { checked: isChecked },
      } = e as React.ChangeEvent<HTMLInputElement>
      onCheckboxChange(id, isChecked)
    }
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()
  }

  const nodeLabelProps: React.HTMLAttributes<HTMLSpanElement> = { className: 'node-label' }

  // in case of simple select mode, there is no checkbox, so we need to handle the click via the node label
  // but not if the control is in readOnly or disabled state
  const shouldRegisterClickHandler = mode === 'simpleSelect' && !readOnly && !disabled

  if (shouldRegisterClickHandler) {
    nodeLabelProps.onClick = handleCheckboxChange
  }

  const sharedProps = { id, value, checked, disabled, readOnly, tabIndex: -1 }
  const className = ['checkbox-item', mode === 'simpleSelect' && 'simple-select'].filter(Boolean).join(' ')

  return (
    <label title={title || label} htmlFor={id}>
      {mode === 'radioSelect' ? (
        <RadioButton
          name={clientId as string}
          className="radio-item"
          onChange={handleCheckboxChange}
          {...sharedProps}
        />
      ) : (
        <Checkbox
          name={id}
          className={className}
          indeterminate={showPartiallySelected && partial}
          onChange={handleCheckboxChange}
          {...sharedProps}
        />
      )}
      <span {...nodeLabelProps}>{label}</span>
    </label>
  )
}

NodeLabel.propTypes = {
  id: PropTypes.string.isRequired,
  actions: PropTypes.array,
  title: PropTypes.string,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  checked: PropTypes.bool,
  partial: PropTypes.bool,
  disabled: PropTypes.bool,
  dataset: PropTypes.object,
  mode: PropTypes.oneOf(['multiSelect', 'simpleSelect', 'radioSelect', 'hierarchical']),
  showPartiallySelected: PropTypes.bool,
  onCheckboxChange: PropTypes.func,
  readOnly: PropTypes.bool,
  clientId: PropTypes.string,
}

export default memo(NodeLabel)
