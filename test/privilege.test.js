const { Privilege, Constraint } = require('../src/broon')

describe('privilege tests not covered in the example cases', () => {
  test('pass array/arg list to resgisterConstraint/Constraints', () => {
    var p1 = new Privilege('a', 'r')
    var c1 = new Constraint('c1', 'is(true true)')
    var c2 = new Constraint('c2', 'is(true true)')

    p1.registerConstraint(c1)
    p1.registerConstraint(c2)

    expect(new Privilege('a', 'r').registerConstraint(c1).registerConstraint(c2)).toEqual(p1)
    expect(new Privilege('a', 'r').registerConstraint(c1, c2)).toEqual(p1)
    expect(new Privilege('a', 'r').registerConstraints(c1, c2)).toEqual(p1)
    expect(new Privilege('a', 'r').registerConstraint([c1, c2])).toEqual(p1)
    expect(new Privilege('a', 'r').registerConstraints([c1, c2])).toEqual(p1)
  })

  test('set privilege name', () => {
    var p1 = new Privilege('a', '2', 'id', 'name')
    var p2 = new Privilege('a', '2')

    p2.rename('name')

    expect(p1.name).toEqual('name')
    expect(p2.name).toEqual('name')
  })

  test('disallow blank string id', () => {
    var p1 = new Privilege('a', '2', '', '')
    expect(p1.id).toEqual('a->2')
  })

  test('allow blank string name', () => {
    var p1 = new Privilege('a', '2', 'id', '')
    expect(p1.name).toEqual('')
  })
})
