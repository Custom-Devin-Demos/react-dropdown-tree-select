import PropTypes from 'prop-types'
import React, { memo, useContext } from 'react'

import ClassNamesContext from '../headless/ClassNamesContext'
import { buildTagProps, buildTagRemoveProps, getTagId } from '../headless/prop-getters'

export { getTagId }

export interface TagProps {
  id: string
  label: string
  onDelete: (id: string, isKeyboardEvent: boolean) => void
  readOnly?: boolean
  disabled?: boolean
  labelRemove?: string
}

const Tag = ({ id, label, labelRemove, readOnly, disabled, onDelete }: TagProps) => {
  const { tag: className } = useContext(ClassNamesContext)
  return (
    <span {...buildTagProps({ id, label, className })}>
      {label}
      <button {...buildTagRemoveProps({ id, onDelete, labelRemove, readOnly, disabled })}>x</button>
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
