const Broon = require('../src/broon')

describe('broons can be merged', () => {
  test('basic merge', () => {
    let policyA = new Broon()
    let policyB = new Broon()

    let roleA = new Broon.Role('A', '1')
    let roleB = new Broon.Role('B', '2')

    policyA.registerRole(roleA)
    policyB.registerRole(roleB)

    let policyC = new Broon().registerRole(roleA).registerRole(roleB)

    expect(policyA.merge(policyB)).toEqual(policyC)
  })

  test('overwrite', () => {
    let policyA = new Broon()
    let policyB = new Broon()

    let roleA = new Broon.Role('A', '1')
    let roleB = new Broon.Role('B', '1')

    policyA.registerRole(roleA)
    policyB.registerRole(roleB)

    expect(policyA.merge(policyB)).toEqual(policyB)
  })

  test('no overwrite', () => {
    let policyA = new Broon()
    let policyB = new Broon()

    let roleA = new Broon.Role('A', '1')
    let roleB = new Broon.Role('B', '1')

    policyA.registerRole(roleA)
    policyB.registerRole(roleB)

    expect(policyA.merge(policyB, false)).toEqual(policyA)
  })

  test('deep overwrite', () => {
    let policyA = new Broon()
    let policyB = new Broon()

    let roleA = new Broon.Role('A', '1')
    let roleB = new Broon.Role('B', '2')

    let privilegeA = new Broon.Privilege('act', 'res', '1')
    let privilegeB = new Broon.Privilege('act2', 'res', '1')

    roleA.registerPrivilege(privilegeA)
    roleB.registerPrivilege(privilegeB)

    policyA.registerPrivilege(privilegeA)
    policyB.registerPrivilege(privilegeB)

    policyA.registerRole(roleA)
    policyB.registerRole(roleB)

    let policyC = new Broon()
      .registerPrivilege(privilegeB)
      .registerRole(new Broon.Role('A', '1').registerPrivilege(privilegeB))
      .registerRole(new Broon.Role('B', '2').registerPrivilege(privilegeB))

    expect(policyA.merge(policyB)).toEqual(policyC)
  })

  test('class merge', () => {
    let policyA = new Broon()
    let policyB = new Broon()

    let roleA = new Broon.Role('A', '1')
    let roleB = new Broon.Role('B', '2')

    policyA.registerRole(roleA)
    policyB.registerRole(roleB)

    expect(Broon.merge(policyA, policyB)).toEqual(new Broon().merge(policyA).merge(policyB))
    expect(Broon.merge([policyA, policyB])).toEqual(Broon.merge(policyA, policyB))
  })
})
