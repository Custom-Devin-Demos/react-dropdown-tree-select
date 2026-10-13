import anyTest, { TestInterface } from 'ava'
import { spy } from 'sinon'
import { act, cleanup, fireEvent, renderDropdown } from './test-utils'
import { TreeNodeProps } from './types'

const test = anyTest as TestInterface<{ tree: TreeNodeProps[] }>

const dropdownId = 'rdts'

const action = {
  id: 'NOT',
  title: 'NOT',
  className: 'fa fa-ban',
}

const node0 = {
  _id: `${dropdownId}-0`,
  _children: [`${dropdownId}-0-0`, `${dropdownId}-0-1`],
  _depth: 0,
  label: 'item1',
  value: 'value1',
  children: undefined,
  actions: [action],
}

test.beforeEach(t => {
  t.context.tree = [
    {
      label: 'item1',
      value: 'value1',
      children: [
        {
          label: 'item1-1',
          value: 'value1-1',
          children: [
            { label: 'item1-1-1', value: 'value1-1-1' },
            { label: 'item1-1-2', value: 'value1-1-2' },
          ],
        },
        { label: 'item1-2', value: 'value1-2' },
      ],
      actions: [action],
    },
    {
      label: 'item2',
      value: 'value2',
      children: [
        {
          label: 'item2-1',
          value: 'value2-1',
          children: [
            { label: 'item2-1-1', value: 'value2-1-1' },
            { label: 'item2-1-2', value: 'value2-1-2' },
            {
              label: 'item2-1-3',
              value: 'value2-1-3',
              children: [{ label: 'item2-1-3-1', value: 'value2-1-3-1' }],
            },
          ],
        },
        { label: 'item2-2', value: 'value2-2' },
      ],
    },
  ]
})

test.afterEach.always(cleanup)

test('renders default state', t => {
  const { tree } = t.context
  const { container } = renderDropdown({ id: dropdownId, data: tree })
  t.snapshot(container.innerHTML)
})

test('renders default radio select state', t => {
  const { tree } = t.context
  const { container } = renderDropdown({ id: dropdownId, data: tree, mode: 'radioSelect' })
  t.snapshot(container.innerHTML)
})

test('shows dropdown', t => {
  const { tree } = t.context
  const { container, isOpen } = renderDropdown({ id: dropdownId, data: tree, showDropdown: 'initial' })
  t.true(isOpen())
  t.snapshot(container.innerHTML)
})

test('always shows dropdown', t => {
  const { tree } = t.context
  const { container, isOpen } = renderDropdown({ id: dropdownId, data: tree, showDropdown: 'always' })
  t.true(isOpen())
  t.snapshot(container.innerHTML)
})

test('always shows dropdown with inline search Input', t => {
  const { tree } = t.context
  const { container, $ } = renderDropdown({
    id: dropdownId,
    data: tree,
    inlineSearchInput: true,
    showDropdown: 'always',
  })
  t.truthy($('.dropdown-content > .search'))
  t.snapshot(container.innerHTML)
})

test('keeps dropdown open for showDropdown: always', t => {
  const { tree } = t.context
  const { handleClick, isOpen } = renderDropdown({ id: dropdownId, data: tree, showDropdown: 'always' })
  handleClick()
  t.true(isOpen())
})

test('notifies on action', t => {
  const handler = spy()
  const { tree } = t.context
  const { $ } = renderDropdown({ id: dropdownId, data: tree, onAction: handler, showDropdown: 'initial' })
  fireEvent.click($('i.fa-ban') as HTMLElement)
  t.true(handler.calledWithExactly(node0, action))
})

test('notifies on action without onAction handler', t => {
  const handler = spy(console, 'error')
  const { tree } = t.context
  const { $ } = renderDropdown({ id: dropdownId, data: tree, showDropdown: 'initial' })
  fireEvent.click($('i.fa-ban') as HTMLElement)
  t.true(handler.notCalled)
  handler.restore()
})

test('notifies on node toggle', t => {
  const handler = spy()
  const { tree } = t.context
  const { $ } = renderDropdown({ id: dropdownId, data: tree, onNodeToggle: handler, showDropdown: 'initial' })
  fireEvent.click($(`#${node0._id}_li .toggle`) as HTMLElement)
  t.true(handler.calledWithExactly({ ...node0, expanded: true }))
})

test('notifies on checkbox change', t => {
  const handler = spy()
  const { tree } = t.context
  const { $ } = renderDropdown({ id: dropdownId, data: tree, onChange: handler, showDropdown: 'initial' })
  fireEvent.click($(`#${node0._id}`) as HTMLElement)
  t.true(
    handler.calledWithExactly({ ...node0, _focused: true, checked: true }, [
      { ...node0, _focused: true, checked: true },
    ])
  )
})

test('notifies on tag removal', t => {
  const handler = spy()
  const { tree } = t.context
  tree[0].checked = true
  const { $, tags } = renderDropdown({ id: dropdownId, data: tree, onChange: handler })
  t.is(tags().length, 1)
  fireEvent.click($(`#${node0._id}_tag .tag-remove`) as HTMLElement)
  t.true(handler.calledWithExactly({ ...node0, _focused: true, checked: false }, []))
  t.is(tags().length, 0)
})

test('sets search mode on input change', t => {
  const { tree } = t.context
  const { search, isSearchModeOn } = renderDropdown({ data: tree, showDropdown: 'initial' })
  t.false(isSearchModeOn())
  search('it')
  t.true(isSearchModeOn())
})

test('shows no matches text when nothing matches the search', t => {
  const { tree } = t.context
  const { search, $ } = renderDropdown({ data: tree, showDropdown: 'initial', texts: { noMatches: 'Nope' } })
  search('zzz')
  t.is(($('.no-matches') as HTMLElement).textContent, 'Nope')
  t.falsy($('.root'))
})

test('hides dropdown onChange for simpleSelect', t => {
  const { tree } = t.context
  const { $, isOpen, search, tags } = renderDropdown({
    id: dropdownId,
    showDropdown: 'initial',
    data: tree,
    mode: 'simpleSelect',
  })
  search('item1')
  fireEvent.click($(`#${node0._id}_li .node-label`) as HTMLElement)
  t.false(isOpen())
  t.is(tags().length, 1)
  t.is((document.querySelector('.search') as HTMLInputElement).value, '')
})

test('keeps dropdown open onChange for simpleSelect and keepOpenOnSelect', t => {
  const { tree } = t.context
  const { $, isOpen } = renderDropdown({
    id: dropdownId,
    data: tree,
    showDropdown: 'initial',
    mode: 'simpleSelect',
    keepOpenOnSelect: true,
  })
  fireEvent.click($(`#${node0._id}_li .node-label`) as HTMLElement)
  t.true(isOpen())
})

test('clears input onChange for clearSearchOnChange', t => {
  const { tree } = t.context
  const { $, search, isSearchModeOn, searchInput } = renderDropdown({
    id: dropdownId,
    data: tree,
    clearSearchOnChange: true,
    showDropdown: 'initial',
  })
  search('item1')
  t.true(isSearchModeOn())
  fireEvent.click($(`#${node0._id}`) as HTMLElement)
  t.false(isSearchModeOn())
  t.falsy($('.no-matches'))
  t.is(searchInput().value, '')
})

test('toggles dropdown', t => {
  const { tree } = t.context
  const { handleClick, isOpen } = renderDropdown({ data: tree })
  handleClick()
  t.true(isOpen())
  handleClick()
  t.false(isOpen())
})

test('toggles dropdown when clicking the trigger', t => {
  const { tree } = t.context
  const onFocus = spy()
  const onBlur = spy()
  const { $, isOpen, searchInput } = renderDropdown({ data: tree, onFocus, onBlur })
  fireEvent.click($('.dropdown-trigger') as HTMLElement)
  t.true(isOpen())
  t.true(onFocus.calledOnce)
  t.is(document.activeElement, searchInput())
  // a real click on the trigger blurs the search input first
  fireEvent.blur(searchInput())
  fireEvent.click($('.dropdown-trigger') as HTMLElement)
  t.false(isOpen())
  t.true(onBlur.calledOnce)
})

test('keeps dropdown open on props update', t => {
  const { tree } = t.context
  const { handleClick, isOpen, setProps } = renderDropdown({ data: tree })
  handleClick()
  t.true(isOpen())
  setProps({ data: tree })
  t.true(isOpen())
  setProps({ data: [...tree] })
  t.true(isOpen())
})

test('opens dropdown on props update with show intention', t => {
  const { tree } = t.context
  const { handleClick, isOpen, setProps } = renderDropdown({ data: tree })
  t.false(isOpen())
  setProps({ data: tree, showDropdown: 'initial' })
  t.true(isOpen())
  handleClick()
  t.false(isOpen())
  setProps({ data: tree, showDropdown: 'always' })
  t.true(isOpen())
  handleClick()
  t.true(isOpen())
})

test('sets unique ids on dropdowns', t => {
  const { tree } = t.context
  const { container: c1 } = renderDropdown({ data: tree })
  const { container: c2 } = renderDropdown({ data: tree })

  const id1 = (c1.firstChild as HTMLElement).id
  const id2 = (c2.firstChild as HTMLElement).id
  t.regex(id1, /^rdts[\w-]+$/)
  t.regex(id2, /^rdts[\w-]+$/)
  t.notDeepEqual(id1, id2)
})

test('id prop wins over the generated id', t => {
  const { tree } = t.context
  const { container, $ } = renderDropdown({ id: 'custom', data: tree, showDropdown: 'initial' })
  t.is((container.firstChild as HTMLElement).id, 'custom')
  t.truthy($('#custom-0_li'))
})

test("doesn't toggle dropdown if it's disabled", t => {
  const { tree } = t.context
  const { $, isOpen, container } = renderDropdown({ id: dropdownId, data: tree, disabled: true })
  fireEvent.click($('.dropdown-trigger') as HTMLElement)
  t.false(isOpen())
  t.true(($('.search') as HTMLInputElement).disabled)
  t.snapshot(container.innerHTML)
})

test('keeps dropdown active on focus', t => {
  const { tree } = t.context
  const { searchInput, instance } = renderDropdown({ data: tree })
  fireEvent.focus(searchInput())
  t.true(instance.keepDropdownActive)
})

test('deactivates dropdown active on blur', t => {
  const { tree } = t.context
  const { searchInput, instance } = renderDropdown({ data: tree })
  fireEvent.focus(searchInput())
  fireEvent.blur(searchInput())
  t.false(instance.keepDropdownActive)
})

test('exposes the root node and search input through ref', t => {
  const { tree } = t.context
  const { instance, container, searchInput } = renderDropdown({ data: tree })
  t.is(instance.node, container.firstChild)
  t.is(instance.searchInput, searchInput())
})

test('detects click outside', t => {
  const { tree } = t.context
  const { handleClick, isOpen } = renderDropdown({ data: tree })

  handleClick()
  t.true(isOpen())

  act(() => {
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  })

  t.false(isOpen())
})

test('detects click inside', t => {
  const { tree } = t.context
  const { handleClick, isOpen, $ } = renderDropdown({ data: tree })

  handleClick()
  t.true(isOpen())

  act(() => {
    ;($('.dropdown-content') as HTMLElement).dispatchEvent(
      new MouseEvent('click', { view: window, bubbles: true, cancelable: true })
    )
  })

  t.true(isOpen())
})

test('detects click outside when other dropdown instance', t => {
  const { tree } = t.context
  const first = renderDropdown({ data: tree })
  const second = renderDropdown({ data: tree })

  first.handleClick()
  t.true(first.isOpen())

  act(() => {
    second.searchInput().dispatchEvent(new MouseEvent('click', { view: window, bubbles: true, cancelable: true }))
  })

  t.false(first.isOpen())
})

test('adds aria-labelledby when label contains # to search input', t => {
  const { tree } = t.context
  const { searchInput } = renderDropdown({ data: tree, texts: { label: '#hello #world' } })
  t.deepEqual(searchInput().getAttribute('aria-labelledby'), 'hello world')
  t.deepEqual(searchInput().getAttribute('aria-label'), null)
})

test('adds aria-label when having label on search input', t => {
  const { tree } = t.context
  const { searchInput } = renderDropdown({ data: tree, texts: { label: 'hello world' } })
  t.deepEqual(searchInput().getAttribute('aria-labelledby'), null)
  t.deepEqual(searchInput().getAttribute('aria-label'), 'hello world')
})

test('appends selected tags to aria-labelledby with provided aria-labelledby', t => {
  const { tree } = t.context
  tree[0].checked = true
  const { $ } = renderDropdown({ id: 'rdts', data: tree, texts: { label: '#hello #world' } })
  const trigger = $('.dropdown-trigger') as HTMLElement
  t.deepEqual(trigger.getAttribute('aria-labelledby'), 'hello world rdts-0_tag')
  t.deepEqual(trigger.getAttribute('aria-label'), null)
})

test('appends selected tags to aria-labelledby with text label', t => {
  const { tree } = t.context
  tree[0].checked = true
  const { $ } = renderDropdown({ id: 'rdts', data: tree, texts: { label: 'hello world' } })
  const trigger = $('.dropdown-trigger') as HTMLElement
  t.deepEqual(trigger.getAttribute('aria-labelledby'), 'rdts_trigger rdts-0_tag')
  t.deepEqual(trigger.getAttribute('aria-label'), 'hello world')
})

test('default tabIndex value is 0', t => {
  const { tree } = t.context
  const { $ } = renderDropdown({ id: 'rdts', data: tree })
  t.deepEqual(($('.dropdown-trigger') as HTMLElement).tabIndex, 0)
})

test('set tabIndex value', t => {
  const { tree } = t.context
  const { $ } = renderDropdown({ id: 'rdts', data: tree, tabIndex: 5 })
  t.deepEqual(($('.dropdown-trigger') as HTMLElement).tabIndex, 5)
})

test('select correct focused node when using external state data container', t => {
  const data = [
    { label: 'All data', value: '0', checked: false },
    { label: 'iWay', value: '1', checked: false },
  ]
  const { $, focused, setProps } = renderDropdown({ id: dropdownId, data, showDropdown: 'initial' })
  fireEvent.click($(`#${dropdownId}-0`) as HTMLElement)
  t.is((focused() as HTMLElement).id, `${dropdownId}-0_li`)
  // simulate external change to the data props
  setProps({
    id: dropdownId,
    showDropdown: 'initial',
    data: [
      { label: 'All data', value: '0', checked: true },
      { label: 'iWay', value: '1', checked: false },
    ],
  })
  t.is((focused() as HTMLElement).id, `${dropdownId}-0_li`)
  t.true(($(`#${dropdownId}-0`) as HTMLInputElement).checked)
})

test('re-initializes the tree when data identity changes', t => {
  const { tree } = t.context
  const { $, $$, setProps } = renderDropdown({ id: dropdownId, data: tree, showDropdown: 'initial' })
  fireEvent.click($(`#${node0._id}_li .toggle`) as HTMLElement)
  t.is($$('li.node').length, 4)
  setProps({ id: dropdownId, data: [...tree], showDropdown: 'initial' })
  t.is($$('li.node').length, 2)
})

test('should not scroll on select', t => {
  const node = (id: string, label: string) => ({ id, label, value: label })
  const largeTree = [...Array(150).keys()].map(i => node(`id${i}`, `label${i}`))
  const { $, $$ } = renderDropdown({ data: largeTree, showDropdown: 'initial' })
  const content = $('.dropdown-content') as HTMLElement

  t.deepEqual(content.scrollTop, 0)
  t.is($$('.checkbox-item').length, 100)

  fireEvent.click($$('.checkbox-item')[90])

  t.deepEqual(content.scrollTop, 0)
  t.true(($('#id90') as HTMLInputElement).checked)
})
