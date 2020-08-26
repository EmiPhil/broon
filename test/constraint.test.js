const { Constraint } = require('../src/broon')

function getRandomInt (max) {
  return Math.floor(Math.random() * Math.floor(max))
}

describe('constraint tests', () => {
  test('whitespace doesnt matter', () => {
    let m = function makeWhiteSpace () {
      return Array.from({ length: getRandomInt(20) }, () => ' ').join('')
    }

    let constraintA = new Constraint('c', 'is(true,true)')
    let constraintB = new Constraint('c', `${m()}is${m()}(${m()}true${m()},${m()}true${m()})${m()}`)

    expect(constraintA.syntaxTree).toEqual(constraintB.syntaxTree)
  })

  test('commas are optional if there is at least one space', () => {
    let constraintA = new Constraint('c', 'is(true, true)')
    let constraintB = new Constraint('c', 'is(true true)')

    expect(constraintA.syntaxTree).toEqual(constraintB.syntaxTree)
  })

  test('throws syntax error is the program does not start with a valid operator', () => {
    expect(() => new Constraint('c', 'hello')).toThrow(SyntaxError)
    expect(() => new Constraint('c', 'myOp()')).toThrow(SyntaxError)
  })

  test('throws a syntax error if the operator is unrecognized', () => {
    expect(() => new Constraint('c', 'is(myOp() true)')).toThrow(SyntaxError)
  })

  test('throws a syntax error if the program is unparseable', () => {
    expect(() => new Constraint('c', 'is(')).toThrow(SyntaxError)
  })

  test('throws a syntax error if the program uses non standard accessors', () => {
    expect(() => new Constraint('c', 'is(unknown.accessor, accessor)')).toThrow(SyntaxError)
  })

  test('is does strict equality checks', () => {
    expect(new Constraint('c', 'is(true true)').evaluate()).toBeTruthy()
    expect(new Constraint('c', 'is(true false)').evaluate()).toBeFalsy()
    expect(new Constraint('c', 'is({} {})').evaluate()).toBeTruthy()
  })

  test('and does boolean and checks', () => {
    expect(new Constraint('c', 'and(is(true true) is(true true))').evaluate()).toBeTruthy()
    expect(new Constraint('c', 'and(is(true false) is(true true))').evaluate()).toBeFalsy()
    expect(new Constraint('c', 'and(is(true true) is(true false))').evaluate()).toBeFalsy()
    expect(new Constraint('c', 'and(is(true false) is(true false))').evaluate()).toBeFalsy()
  })

  test('or does boolean or checks', () => {
    expect(new Constraint('c', 'or(is(true true) is(true true))').evaluate()).toBeTruthy()
    expect(new Constraint('c', 'or(is(true false) is(true true))').evaluate()).toBeTruthy()
    expect(new Constraint('c', 'or(is(true true) is(true false))').evaluate()).toBeTruthy()
    expect(new Constraint('c', 'or(is(true false) is(true false))').evaluate()).toBeFalsy()
  })

  test('not inverses the boolean', () => {
    expect(new Constraint('c', 'not(is(true true))').evaluate()).toBeFalsy()
    expect(new Constraint('c', 'not(is(true false))').evaluate()).toBeTruthy()
    expect(new Constraint('c', 'not(not(is(true true)))')).toBeTruthy()
  })

  test('in returns true if val is in the list', () => {
    let values = ['value', 'test', 'thing']
    expect(new Constraint('c', 'in(value, persona.values)').evaluate({ values })).toBeTruthy()
    expect(new Constraint('c', 'in(value, persona.values)').evaluate({ values: [] })).toBeFalsy()
    expect(new Constraint('c', 'in(value, persona.values)').evaluate({ values: ['v'] })).toBeFalsy()
  })

  test('context/persona gets passed and evaluated via accessors', () => {
    expect(new Constraint('c', 'is(persona.true true)').evaluate({ true: true })).toBeTruthy()
    expect(new Constraint('c', 'is(persona.true true)').evaluate({ true: false })).toBeFalsy()
    expect(new Constraint('c', 'is(context.true true)').evaluate({ true: true })).toBeTruthy()
  })

  test('resource/data gets passed and evaluated via accessors', () => {
    expect(new Constraint('c', 'is(resource.true true)').evaluate({}, { true: true })).toBeTruthy()
    expect(new Constraint('c', 'is(resource.true true)').evaluate({}, { true: false })).toBeFalsy()
    expect(new Constraint('c', 'is(data.true true)').evaluate({}, { true: true })).toBeTruthy()
  })

  test('accessors can be deeply nested objects', () => {
    function makeNestedObject () {
      let depth = getRandomInt(10)
      let str = '.data'
      let root = { data: true }
      for (let i = 0; i < depth - 1; i++) {
        str += '.data'
        root = { data: root }
      }

      return [str, root]
    }

    var [string, nested] = makeNestedObject()

    expect(new Constraint('c', `is(persona${string} true)`).evaluate(nested)).toBeTruthy()
    expect(new Constraint('c', `is(resource${string} true)`).evaluate({}, nested)).toBeTruthy()
  })

  test('accessors will return undefined if not present on the passed object', () => {
    expect(new Constraint('c', 'is(persona.data undefined)').evaluate()).toBeTruthy()
    expect(new Constraint('c', 'is(resource.data undefined)').evaluate()).toBeTruthy()
    expect(new Constraint('c', 'is(context.data undefined)')
      .evaluate({ dat: 'value' })).toBeTruthy()
    expect(new Constraint('c', 'is(data.data undefined)')
      .evaluate({}, { dat: 'value' })).toBeTruthy()
  })

  test('roleName gets passed', () => {
    expect(new Constraint('c', 'is(role roleName)').evaluate({}, {}, 'roleName')).toBeTruthy()
    expect(new Constraint('c', 'is(role roleName)').evaluate({}, {}, 'nameRole')).toBeFalsy()
  })
})
