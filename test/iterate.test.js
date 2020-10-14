const Broon = require('../src/broon')

describe('iterate', () => {
  test('works with arrays', () => {
    var fn = jest.fn()
    var arr = [1, 2, 3]

    Broon._iterate(arr, fn)

    expect(fn.mock.calls).toEqual([[1, 0, arr], [2, 1, arr], [3, 2, arr]])
  })

  test('works with objects', () => {
    var fn = jest.fn()
    var obj = { a: 1, b: 2, c: 3 }

    Broon._iterate(obj, fn)

    expect(fn.mock.calls).toEqual([[1, 'a', obj], [2, 'b', obj], [3, 'c', obj]])
  })
})
