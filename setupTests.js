// Tell React this is a test environment so act() warnings are reported correctly
global.IS_REACT_ACT_ENVIRONMENT = true

// jsdom does not implement layout APIs used by keyboard navigation
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}

// jsdom does not implement requestAnimationFrame / element scrolling used by the virtualized tree
if (typeof window !== 'undefined' && !window.requestAnimationFrame) {
  window.requestAnimationFrame = cb => setTimeout(() => cb(Date.now()), 0)
  window.cancelAnimationFrame = id => clearTimeout(id)
}
if (typeof Element !== 'undefined' && !Element.prototype.scrollTo) {
  Element.prototype.scrollTo = function scrollTo(options) {
    if (options && typeof options.top === 'number') this.scrollTop = options.top
  }
}
