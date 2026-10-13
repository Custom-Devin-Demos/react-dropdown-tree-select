import React, { PureComponent } from 'react'
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

class Action extends PureComponent<ActionProps> {
  static propTypes = {
    title: PropTypes.string,
    text: PropTypes.string,
    className: PropTypes.string,
    actionData: PropTypes.object,
    onAction: PropTypes.func,
    readOnly: PropTypes.bool,
  }

  static defaultProps = {
    onAction: () => {},
  }

  handleClick = () => {
    const { onAction, actionData } = this.props
    if (onAction) {
      onAction(actionData.nodeId, actionData.action)
    }
  }

  render() {
    const { title, className, text, readOnly } = this.props

    return (
      <i title={title} className={className} onClick={!readOnly ? this.handleClick : undefined}>
        {text}
      </i>
    )
  }
}

export default Action
