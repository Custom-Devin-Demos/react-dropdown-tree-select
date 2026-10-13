import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { NodeAction } from '../types'

export interface ActionProps {
  title?: string
  text?: string
  className?: string
  actionData: { nodeId: string; action: NodeAction }
  onAction?: (nodeId: string, action: NodeAction) => void
  readOnly?: boolean
  [property: string]: any
}

const noop = () => {}

const Action = ({ title, className, text, readOnly, onAction = noop, actionData }: ActionProps) => {
  const handleClick = () => {
    if (onAction) {
      onAction(actionData.nodeId, actionData.action)
    }
  }

  return (
    <i title={title} className={className} onClick={!readOnly ? handleClick : undefined}>
      {text}
    </i>
  )
}

Action.propTypes = {
  title: PropTypes.string,
  text: PropTypes.string,
  className: PropTypes.string,
  actionData: PropTypes.object,
  onAction: PropTypes.func,
  readOnly: PropTypes.bool,
}

export default memo(Action)
