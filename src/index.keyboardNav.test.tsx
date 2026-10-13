import test from 'ava'
import { spy, stub, assert } from 'sinon'
import { cleanup, fireEvent, renderDropdown } from './test-utils'

const node = (id: string, label: string) => ({ id, label, value: label })

const tree = {
  ...node('c1', 'ccc 1'),
  children: [
    {
      ...node('c2', 'ccc 2'),
      children: [node('a1', 'aaa 1'), node('a2', 'aaa 2')],
    },
    {
      ...node('c3', 'ccc 3'),
      children: [node('a3', 'aaa 3'), node('b1', 'bbb 1'), node('b2', 'bbb 2')],
    },
  ],
}

const focusedText = (r: ReturnType<typeof renderDropdown>) => (r.focused() as HTMLElement).textContent

test.afterEach.always(cleanup)

test('some key presses opens dropdown on keyboardNavigation', t => {
  ;['ArrowUp', 'ArrowDown', 'Home', 'PageUp', 'End', 'PageDown', 'a', 'B'].forEach(key => {
    const r = renderDropdown({ data: tree })
    r.keyDown(key)
    t.true(r.isOpen(), key)
    r.unmount()
  })
})

test('esc closes dropdown on keyboardNavigation', t => {
  const r = renderDropdown({ data: tree })
  r.keyDown(['ArrowDown', 'Escape'])
  t.false(r.isOpen())
})

test('other key presses does not open dropdown on keyboardNavigation', t => {
  ;['Enter', 'ArrowLeft', 'ArrowRight'].forEach(key => {
    const r = renderDropdown({ data: tree })
    r.keyDown(key)
    t.false(r.isOpen(), key)
    r.unmount()
  })
})

test('can navigate and focus child on keyboardNavigation', t => {
  const r = renderDropdown({ data: tree })
  r.keyDown(['ArrowDown', 'ArrowRight', 'ArrowRight', 'ArrowDown', 'ArrowRight', 'ArrowRight', 'ArrowDown'])
  t.deepEqual(focusedText(r), 'bbb 1')
  t.is(r.searchInput().getAttribute('aria-activedescendant'), 'b1_li')
})

test('can navigate circular on keyboardNavigation', t => {
  const r = renderDropdown({ data: tree })
  r.keyDown(['ArrowDown', 'ArrowRight', 'ArrowRight', 'ArrowDown', 'ArrowDown'])
  t.deepEqual(focusedText(r), 'ccc 1')
  r.keyDown('ArrowUp')
  t.deepEqual(focusedText(r), 'ccc 3')
})

test('can navigate to edge on keyboardNavigation', t => {
  const r = renderDropdown({ data: tree })
  r.keyDown(['ArrowDown', 'ArrowRight', 'ArrowRight', 'ArrowRight'])
  ;['PageDown', 'PageUp', 'End', 'Home'].forEach((key, index) => {
    const expected = index % 2 === 0 ? 'ccc 3' : 'ccc 1'
    r.keyDown(key)
    t.deepEqual(focusedText(r), expected)
  })
})

test('can collapse on keyboardNavigation', t => {
  const r = renderDropdown({ data: tree })
  r.keyDown(['ArrowDown', 'ArrowRight', 'ArrowRight', 'ArrowDown'])
  t.deepEqual(focusedText(r), 'ccc 3')

  r.keyDown('ArrowLeft')
  t.deepEqual(focusedText(r), 'ccc 1')
  t.truthy(r.$('#c3'))

  r.keyDown('ArrowLeft')
  t.falsy(r.$('#c3'))
})

test('can navigate searchresult on keyboardNavigation', t => {
  const r = renderDropdown({ data: tree, showDropdown: 'initial' })
  r.search('bb')
  r.keyDown(['b', 'ArrowDown', 'ArrowDown', 'ArrowDown'])
  t.deepEqual(focusedText(r), 'bbb 1')
})

test('can navigate with keepTreOnSearch on keyboardNavigation', t => {
  const r = renderDropdown({ data: tree, keepTreeOnSearch: true })
  r.search('bb')
  r.keyDown(['b', 'ArrowDown', 'ArrowDown', 'ArrowDown'])
  t.deepEqual(focusedText(r), 'bbb 1')
  t.truthy(r.$('#c1'))
})

test('can delete tags on empty search input with backspace on keyboardNavigation', t => {
  const data = [
    { ...node('a', 'a'), checked: true },
    { ...node('b', 'b'), checked: true },
  ]
  const r = renderDropdown({ data })
  r.searchInput().value = 'x'
  r.keyDown('Backspace')
  t.deepEqual(r.tags().length, 2)

  r.searchInput().value = ''
  r.keyDown('Backspace')
  t.deepEqual(r.tags().length, 1)
  r.keyDown('Backspace')
  t.deepEqual(r.tags().length, 0)
})

test('can select with enter on keyboardNavigation', t => {
  const r = renderDropdown({ data: tree })
  r.keyDown(['ArrowDown', 'ArrowDown', 'Enter'])
  t.deepEqual(r.tags().length, 1)
})

test('can delete tags with backspace/delete on keyboardNavigation', t => {
  const data = [
    { ...node('a', 'a'), checked: true },
    { ...node('b', 'b'), checked: true },
  ]
  const r = renderDropdown({ data })
  fireEvent.keyDown(r.$('#a_tag > .tag-remove') as HTMLElement, { key: 'Backspace' })
  t.deepEqual(r.tags().length, 1)
  // focus moves to the next tag after a keyboard delete
  t.is(document.activeElement, r.$('#b_button'))
  fireEvent.keyUp(r.$('#b_tag > .tag-remove') as HTMLElement, { key: 'Delete' })
  t.deepEqual(r.tags().length, 0)
  t.is(document.activeElement, r.searchInput())
})

test('cannot delete tags on empty search input with backspace on keyboardNavigation when disablePoppingOnBackspace is true', t => {
  const data = [
    { ...node('a', 'a'), checked: true },
    { ...node('b', 'b'), checked: true },
  ]
  const r = renderDropdown({ data, disablePoppingOnBackspace: true })
  r.searchInput().value = 'x'
  r.keyDown('Backspace')
  t.deepEqual(r.tags().length, 2)

  r.searchInput().value = ''
  r.keyDown('Backspace')
  t.deepEqual(r.tags().length, 2)
})

test('remembers current focus between prop updates', t => {
  const r = renderDropdown({ data: tree, showDropdown: 'initial' })
  t.falsy(r.focused())
  r.keyDown(['ArrowDown'])
  t.deepEqual(focusedText(r), 'ccc 1')
  r.setProps({ data: tree, showDropdown: 'initial' })
  t.deepEqual(focusedText(r), 'ccc 1')
  r.setProps({ data: { ...tree }, showDropdown: 'initial' })
  t.deepEqual(focusedText(r), 'ccc 1')
})

test('should set current focus as selected on tab out for simpleSelect', t => {
  const r = renderDropdown({ data: tree, mode: 'simpleSelect' })
  r.keyDown(['ArrowDown', 'ArrowRight', 'ArrowRight', 'Tab'])
  t.deepEqual(r.tags()[0].getAttribute('aria-label'), 'ccc 1')
})

test('should scroll on keyboard navigation', t => {
  const largeTree = [...Array(150).keys()].map(i => node(`id${i}`, `label${i}`))
  const scrollIntoView = (Element.prototype.scrollIntoView = spy())
  const r = renderDropdown({ data: largeTree, showDropdown: 'initial' })
  const getElementById = stub(document, 'getElementById')
  const contentNode = r.$('.dropdown-content') as HTMLElement

  t.deepEqual(contentNode.scrollTop, 0)

  r.keyDown(['ArrowUp'])
  largeTree.forEach((n, index) => {
    getElementById.withArgs(`${n.id}_li`).returns({ offsetTop: index, clientHeight: 1, scrollIntoView } as any)
  })

  r.keyDown(['ArrowUp'])
  t.deepEqual(focusedText(r), 'label148')
  assert.calledOnce(scrollIntoView)

  getElementById.restore()
})

test('should only scroll on keyboard navigation', t => {
  const largeTree = [...Array(150).keys()].map(i => node(`id${i}`, `label${i}`))
  const getElementById = stub(document, 'getElementById')
  const scrollIntoView = (Element.prototype.scrollIntoView = spy())
  const r = renderDropdown({ data: largeTree, showDropdown: 'initial' })

  r.keyDown(['ArrowUp'])
  largeTree.forEach((n, index) => {
    getElementById.withArgs(`${n.id}_li`).returns({ offsetTop: index, clientHeight: 1, scrollIntoView } as any)
  })

  r.keyDown(['ArrowUp'])

  // setting new props must not scroll
  const newTree = largeTree.map(n => ({ checked: true, ...n }))
  r.setProps({ data: newTree, showDropdown: 'initial' })
  assert.calledOnce(scrollIntoView)

  // keyboard nav scrolls again, called once for each navigation
  r.keyDown(['ArrowUp', 'ArrowDown'])
  assert.calledThrice(scrollIntoView)
  t.deepEqual(focusedText(r), 'label148')

  getElementById.restore()
})

test('jumps to the page containing the active descendant', t => {
  const largeTree = [...Array(250).keys()].map(i => node(`id${i}`, `label${i}`))
  Element.prototype.scrollIntoView = spy()
  const r = renderDropdown({ data: largeTree, showDropdown: 'initial' })
  t.is(r.$$('li.node').length, 100)
  r.keyDown(['ArrowUp'])
  t.deepEqual(focusedText(r), 'label249')
  t.is(r.$$('li.node').length, 250)
})

const keyDownTests = [
  { keyCode: 13, expected: true }, // Enter
  { keyCode: 32, expected: true }, // Space
  { keyCode: 40, expected: true }, // Arrow down
  { keyCode: 9, expected: false }, // Tab
  { keyCode: 38, expected: false }, // Up arrow
]

keyDownTests.forEach(testArgs => {
  test(`Key code ${testArgs.keyCode} ${testArgs.expected ? 'can' : "can't"} open dropdown on keyDown`, t => {
    const r = renderDropdown({ data: tree })
    const trigger = r.$('.dropdown-trigger') as HTMLElement
    trigger.focus()
    fireEvent.keyDown(trigger, { key: 'mock', keyCode: testArgs.keyCode })
    t.is(r.isOpen(), testArgs.expected)
  })
})

test(`Key event should not trigger if not focused/active element`, t => {
  const r = renderDropdown({ data: tree })
  const trigger = r.$('.dropdown-trigger') as HTMLElement
  r.searchInput().focus()
  fireEvent.keyDown(trigger, { key: 'mock', keyCode: 13 })
  t.is(r.isOpen(), false)
})
