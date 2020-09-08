const { Broon, Role, Privilege, Constraint } = require('../src/broon')

describe('persona tests not covered in the example cases', () => {
  test('persona has privilege', () => {
    let policy = new Broon()
    let role = new Role('role', 'role')
    let p1 = new Privilege('action', 'resource', 'p1')
    let c1 = new Constraint('name', 'is(false true)')
    p1.registerConstraint(c1)

    policy.registerPrivilege(p1)
    role.registerPrivilege(p1)
    policy.registerRole(role)

    let persona = policy.makePersona('role')

    expect(persona.can('action', 'resource')).toBeFalsy()
    expect(persona.has('action', 'resource')).toBeTruthy()
    expect(persona.has('p1')).toBeTruthy()
  })

  test('super persona has privilege', () => {
    let policy = new Broon()
    let role = new Role('role', 'role').superfy()

    policy.registerRole(role)

    let persona = policy.makePersona('role')

    expect(persona.can('action', 'resource')).toBeTruthy()
    expect(persona.has('action', 'resource')).toBeTruthy()
  })

  test('get privilege ids', () => {
    let policy = new Broon()
    let roleA = new Role('role a')
    let roleB = new Role('role b')
    let privilegeA = new Privilege('privilege a', 'resource', 'privilege a')
    let privilegeB = new Privilege('privilege b', 'resource', 'privilege b')

    policy.registerPrivileges(privilegeA, privilegeB)

    roleA.registerPrivilege(privilegeA)
    roleB.registerPrivilege(privilegeB)

    policy.registerRoles(roleA, roleB)

    let persona = policy.makePersona(['role a', 'role b'])
    expect(Object.keys(persona.getPrivilegeIds())).toEqual(['privilege a', 'privilege b'])
    expect(persona.getPrivilegeIds(true)).toEqual(['privilege a', 'privilege b'])

    roleA.extend(roleB)
    persona = policy.makePersona('role a')
    expect(persona.getPrivilegeIds(true)).toEqual(['privilege a', 'privilege b'])
    expect(Object.keys(persona.getPrivilegeIds())).toEqual(['privilege a', 'privilege b'])
  })

  test('is subset of', () => {
    let policy = new Broon()
    let roleA = new Role('role a')
    let roleB = new Role('role b')
    let roleC = new Role('role c')

    let privilegeA = new Privilege('action', 'resource a')
    let privilegeB = new Privilege('action', 'resource b')

    policy.registerPrivileges(privilegeA, privilegeB)
    roleA.registerPrivilege(privilegeA)
    roleB.registerPrivilege(privilegeB)
    roleC.registerPrivileges(privilegeA, privilegeB)

    policy.registerRoles(roleA, roleB, roleC)

    let personaA = policy.makePersona('role a')
    let personaB = policy.makePersona('role b')
    let personaC = policy.makePersona('role c')

    expect(personaA.subset(personaC)).toBeTruthy()
    expect(personaB.subset(personaC)).toBeTruthy()
    expect(personaC.subset(personaA)).toBeFalsy()
    expect(personaC.subset(personaB)).toBeFalsy()

    let personaAB = policy.makePersona(['role a', 'role b'])
    expect(personaAB.subset(personaC)).toBeTruthy()

    let roleD = new Role('role d')
    roleD.extend(roleA)

    policy.registerRole(roleD)
    let personaD = policy.makePersona('role d')
    expect(personaD.subset(personaC)).toBeTruthy()

    let roleE = new Role('role e')
    let privilegeE = new Privilege('a', 'd')
    roleE.registerPrivilege(privilegeE)
    policy.registerPrivilege(privilegeE)
    policy.registerRole(roleE)

    let personaE = policy.makePersona('role e')

    expect(personaE.subset(personaC)).toBeFalsy()
    roleC.registerPrivilege(privilegeE)
    expect(personaE.subset(personaC)).toBeTruthy()

    roleC.revokePrivilege(privilegeA)
    expect(personaA.subset(personaC)).toBeFalsy()
    expect(personaB.subset(personaC)).toBeTruthy()
    roleC.revokePrivilege(privilegeB)
    expect(personaA.subset(personaC)).toBeFalsy()
    expect(personaB.subset(personaC)).toBeFalsy()
  })
})
