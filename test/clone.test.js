const Broon = require('../src/broon')

describe('clone', () => {
  test('prop change', () => {
    var o1 = {
      a: 'test'
    }

    var o2 = Broon._clone(o1)
    var o3 = o1

    expect(o2).toEqual(o1)
    expect(o3).toEqual(o1)

    o3.a = 'test2'

    expect(o2).not.toEqual(o1)
    expect(o3).toEqual(o1)
  })

  test('arr change', () => {
    var o1 = {
      a: ['test']
    }

    var o2 = Broon._clone(o1)
    var o3 = o1

    expect(o2).toEqual(o1)
    expect(o3).toEqual(o1)

    o3.a[0] = 'test 2'

    expect(o2).not.toEqual(o1)
    expect(o3).toEqual(o1)
  })

  test('obj change', () => {
    var o1 = {
      a: { a: 'test' }
    }

    var o2 = Broon._clone(o1)
    var o3 = o1

    expect(o2).toEqual(o1)
    expect(o3).toEqual(o1)

    o3.a.a = 'test 2'

    expect(o2).not.toEqual(o1)
    expect(o3).toEqual(o1)
  })
})
