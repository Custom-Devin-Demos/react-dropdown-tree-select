import PropTypes from 'prop-types'
import React, { memo } from 'react'

export interface ToggleProps {
  expanded?: boolean
  isLeaf?: boolean
  onNodeToggle: (id: string) => void
  id: string
}

const Toggle = ({ expanded, isLeaf, onNodeToggle, id }: ToggleProps) => {
  const toggleCx = ['toggle', expanded && 'expanded', !expanded && 'collapsed'].filter(Boolean).join(' ')

  if (isLeaf) {
    return <i role="button" tabIndex={-1} className={toggleCx} style={{ visibility: 'hidden' }} aria-hidden />
  }

  const onToggle = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()
    onNodeToggle(id)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.keyCode === 32) {
      onNodeToggle(id)
      e.preventDefault()
    }
  }

  return <i role="button" tabIndex={-1} className={toggleCx} onClick={onToggle} onKeyDown={onKeyDown} aria-hidden />
}

Toggle.propTypes = {
  expanded: PropTypes.bool,
  isLeaf: PropTypes.bool,
  onNodeToggle: PropTypes.func,
  id: PropTypes.string,
}

export default memo(Toggle)
