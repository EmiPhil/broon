const Broon = require('../src/broon')

describe('startsWith', () => {
  test('works', () => {
    expect(Broon._startsWith('a string', 'a string')).toBeTruthy()
    expect(Broon._startsWith('a string', 'b string')).toBeFalsy()
    expect(Broon._startsWith('a string', 'a strinb')).toBeFalsy()
  })
})
