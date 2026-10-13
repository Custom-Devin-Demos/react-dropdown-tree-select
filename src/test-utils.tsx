import React from 'react'
import { act, cleanup, fireEvent, render, RenderOptions } from '@testing-library/react'

import DropdownTreeSelect, { DropdownTreeSelectHandle, DropdownTreeSelectProps } from './index'

export { act, cleanup, fireEvent }

export const renderDropdown = (props: DropdownTreeSelectProps, options?: RenderOptions) => {
  const ref = React.createRef<DropdownTreeSelectHandle>()
  const result = render(<DropdownTreeSelect ref={ref} {...props} />, options)
  const { container } = result
  const $ = <E extends Element = HTMLElement>(selector: string) => container.querySelector<E>(selector)
  const $$ = <E extends Element = HTMLElement>(selector: string) => Array.from(container.querySelectorAll<E>(selector))
  const searchInput = () => $<HTMLInputElement>('.search') as HTMLInputElement

  return {
    ...result,
    ref,
    $,
    $$,
    searchInput,
    get instance() {
      return ref.current as DropdownTreeSelectHandle
    },
    isOpen: () => !!$('.dropdown-content'),
    isSearchModeOn: () => !!$('.root.searchModeOn'),
    tags: () => $$('.tag-list .tag'),
    focused: () => $('li.focused'),
    handleClick: () => act(() => (ref.current as DropdownTreeSelectHandle).handleClick()),
    keyDown: (keys: string | string[]) => {
      ;([] as string[]).concat(keys).forEach(key => fireEvent.keyDown(searchInput(), { key }))
    },
    search: (value: string) => fireEvent.change(searchInput(), { target: { value } }),
    setProps: (nextProps: DropdownTreeSelectProps) => result.rerender(<DropdownTreeSelect ref={ref} {...nextProps} />),
  }
}
