// Tell React this is a test environment so act() warnings are reported correctly
global.IS_REACT_ACT_ENVIRONMENT = true

// jsdom does not implement layout APIs used by keyboard navigation
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}
