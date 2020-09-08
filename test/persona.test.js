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
})
