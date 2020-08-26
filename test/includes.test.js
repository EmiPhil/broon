const Broon = require('../src/broon')

describe('includes', () => {
  test('direct compares strings', () => {
    expect(Broon._includes('string', 'string')).toBeTruthy()
    expect(Broon._includes('substring', 'string')).toBeFalsy()
    expect(Broon._includes('stringsub', 'string')).toBeFalsy()
  })

  test('uses default array function by default', () => {
    expect(Broon._includes(['five'], 'five')).toBeTruthy()
  })

  test('polyfills array function if not present', () => {
    let fakeArray = { length: 2, 0: 'one', 1: 'two' }
    expect(Broon._includes(fakeArray, 'five')).toBeFalsy()
    expect(Broon._includes(fakeArray, 'two')).toBeTruthy()
  })
})
