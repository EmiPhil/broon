const Broon = require('../src/broon')

describe('deepEqual', () => {
  test('basic', () => {
    var o1 = {
      a: 'test'
    }

    var o2 = {
      a: 'test'
    }

    expect(Boolean(o1 === o2)).toBeFalsy()
    expect(Broon._isEqual(o1, o2)).toBeTruthy()
  })

  test('array', () => {
    var o1 = {
      a: ['test']
    }

    var o2 = {
      a: ['test']
    }

    expect(Boolean(o1 === o2)).toBeFalsy()
    expect(Broon._isEqual(o1, o2)).toBeTruthy()
  })

  test('nested', () => {
    var o1 = {
      a: { a: 'test' }
    }

    var o2 = {
      a: { a: 'test' }
    }

    expect(Boolean(o1 === o2)).toBeFalsy()
    expect(Broon._isEqual(o1, o2)).toBeTruthy()
  })

  test('different length objects', () => {
    var o1 = {
      a: 'test'
    }

    var o2 = {
      a: 'test',
      b: 'test'
    }

    expect(Broon._isEqual(o1, o2)).toBeFalsy()
  })

  test('different length arrays', () => {
    var o1 = {
      a: ['test']
    }

    var o2 = {
      a: ['test', 'test']
    }

    expect(Broon._isEqual(o1, o2)).toBeFalsy()
  })

  test('different nested object in array', () => {
    var o1 = {
      a: [{ a: 'test' }]
    }

    var o2 = {
      a: [{ a: 'test 2' }]
    }

    expect(Broon._isEqual(o1, o2)).toBeFalsy()
  })

  test('undefined', () => {
    var o1 = {
      a: undefined
    }

    var o2 = {
      a: undefined
    }

    expect(Broon._isEqual(o1, o2)).toBeTruthy()
  })

  test('NaN', () => {
    var o1 = {
      a: NaN
    }

    var o2 = {
      a: NaN
    }

    expect(Broon._isEqual(o1, o2)).toBeTruthy()
  })
})
