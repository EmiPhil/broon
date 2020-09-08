const { Role, Privilege, Constraint } = require('../src/broon')

describe('role tests not covered in the example cases', () => {
  test('revoke privilege', () => {
    let role = new Role('role')
    let priv = new Privilege('can', 'do', 'p')

    expect(role.registerPrivilege(priv).revokePrivilege(priv)).toEqual(new Role('role'))
    expect(role.registerPrivilege(priv).revokePrivilege('p')).toEqual(new Role('role'))
  })

  test('revoke non existing privilege', () => {
    let role = new Role('role')
    expect(role.revokePrivilege('priv')).toEqual(new Role('role'))
  })

  test('multiple privileges with the same action/resource', () => {
    let role = new Role('role')
    let p1 = new Privilege('action', 'resource', 'p1')
    let p2 = new Privilege('action', 'resource', 'p2')

    let c1 = new Constraint('p1', 'is(persona.p1 p1)', 'c1')
    let c2 = new Constraint('p2', 'is(persona.p2 p2)', 'c2')

    p1.registerConstraint(c1)
    p2.registerConstraint(c2)

    role.registerPrivilege(p1).registerPrivilege(p2)

    expect(role.resolve('action', 'resource')).toBeFalsy()
    expect(role.resolve('action', 'resource', { p1: 'p1' })).toBeTruthy()
    expect(role.resolve('action', 'resource', { p1: 'p2' })).toBeFalsy()
    expect(role.resolve('action', 'resource', { p2: 'p1' })).toBeFalsy()
    expect(role.resolve('action', 'resource', { p2: 'p2' })).toBeTruthy()
  })

  test('pass array/arg list to resgisterPrivilege/Privileges', () => {
    var role = new Role('role')
    var p1 = new Privilege('action', 'resource', 'p1')
    var p2 = new Privilege('action', 'resource', 'p2')

    role.registerPrivilege(p1)
    role.registerPrivilege(p2)

    expect(new Role('role').registerPrivilege(p1).registerPrivilege(p2)).toEqual(role)
    expect(new Role('role').registerPrivilege(p1, p2)).toEqual(role)
    expect(new Role('role').registerPrivileges(p1, p2)).toEqual(role)
    expect(new Role('role').registerPrivilege([p1, p2])).toEqual(role)
    expect(new Role('role').registerPrivileges([p1, p2])).toEqual(role)
  })

  test('get role ids', () => {
    let role = new Role('role')
    let p1 = new Privilege('action', 'resource', 'p1')
    let p2 = new Privilege('action', 'resource', 'p2')

    role.registerPrivileges(p1, p2)

    expect(Object.keys(role.getPrivilegeIds())).toEqual(['p1', 'p2'])
    expect(role.getPrivilegeIds(true)).toEqual(['p1', 'p2'])

    let roleB = new Role('role b')
    let p3 = new Privilege('action', 'resource', 'p3')
    roleB.registerPrivilege(p3)
    role.extend(roleB)

    expect(role.getPrivilegeIds(true)).toEqual(['p1', 'p2', 'p3'])
    expect(Object.keys(role.getPrivilegeIds())).toEqual(['p1', 'p2', 'p3'])
  })
})
