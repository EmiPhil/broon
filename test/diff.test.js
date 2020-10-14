const Broon = require('../src/broon')

describe('two broons can go through a differential check to see how they differ', () => {
  test('the rightDiff is a new broon', () => {
    let policyA = new Broon()
    let policyB = new Broon()

    expect(policyA.rightDiff(policyB).constructor).toEqual(Broon)
  })

  test('the rightDiff has new roles', () => {
    let policyA = new Broon()
    let policyB = new Broon()

    let roleB = new Broon.Role('A', '1')

    policyB.registerRole(roleB)

    expect(policyA.rightDiff(policyB)).toEqual(policyB)
  })

  test('and only new roles', () => {
    let policyA = new Broon()
    let policyB = new Broon()

    let roleA = new Broon.Role('A', '1')
    let roleB = new Broon.Role('A', '2')

    policyA.registerRole(roleA)
    policyB.registerRoles(roleA, roleB)

    expect(policyA.rightDiff(policyB)).toEqual(new Broon().registerRole(roleB))
  })

  test('the rightDiff has new privileges', () => {
    let policyA = new Broon()
    let policyB = new Broon()

    let privilegeB = new Broon.Privilege('action', 'resource')

    policyB.registerPrivilege(privilegeB)

    expect(policyA.rightDiff(policyB)).toEqual(policyB)
  })

  test('and only new privileges', () => {
    let policyA = new Broon()
    let policyB = new Broon()

    let privilegeA = new Broon.Privilege('action', 'resource', '1')
    let privilegeB = new Broon.Privilege('action', 'resource', '2')

    policyA.registerPrivilege(privilegeA)
    policyB.registerPrivileges(privilegeA, privilegeB)

    expect(policyA.rightDiff(policyB)).toEqual(new Broon().registerPrivilege(privilegeB))
  })

  test('roles and privs', () => {
    let policyA = new Broon()
    let policyB = new Broon()

    let roleA = new Broon.Role('A', '1')
    let roleB = new Broon.Role('A', '2')

    let privilegeA = new Broon.Privilege('action', 'resource', '1')
    let privilegeB = new Broon.Privilege('action', 'resource', '2')

    roleA.registerPrivilege(privilegeA)
    roleB.registerPrivileges(privilegeA, privilegeB)

    policyA.registerPrivilege(privilegeA)
    policyB.registerPrivileges(privilegeA, privilegeB)

    policyA.registerRole(roleA)
    policyB.registerRoles(roleA, roleB)

    expect(policyA.rightDiff(policyB))
      .toEqual(new Broon().registerPrivilege(privilegeB).registerRole(roleB))
  })

  test('saving diff for future merge', () => {
    let basePolicy = new Broon()
    basePolicy.registerPrivilege(new Broon.Privilege('action', 'resource', 'p1'))
    basePolicy.registerRole(new Broon.Role('base', 'base').registerPrivilege(basePolicy.getPrivilege('p1')))

    let userPolicy = new Broon()
    userPolicy.registerPrivilege(new Broon.Privilege('action 2', 'resource', 'p2'))
    userPolicy.registerRole(new Broon.Role('user', 'user').registerPrivilege(userPolicy.getPrivilege('p2')))

    expect(basePolicy.rightDiff(userPolicy)).toEqual(userPolicy)

    let saved = userPolicy.toJson()

    expect(Broon.merge(basePolicy, Broon.from(saved)))
      .toEqual(Broon.merge(basePolicy, userPolicy))

    expect(Broon.merge(basePolicy, basePolicy.rightDiff(userPolicy)))
      .toEqual(Broon.merge(basePolicy, userPolicy))
  })
})
