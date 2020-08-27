const { Broon, Role, Privilege } = require('../src/broon')

describe('role extension tests', () => {
  test('single chain extension', () => {
    let policy = new Broon()

    let roleA = new Role('role a')
    let roleB = new Role('role b')
    let privilege = new Privilege('action', 'resource')

    policy.registerRole(roleA)
    policy.registerRole(roleB)
    policy.registerPrivilege(privilege)
    roleB.registerPrivilege(privilege)

    expect(policy.makePersona('role b').can('action', 'resource')).toBeTruthy()
    expect(policy.makePersona('role a').can('action', 'resource')).toBeFalsy()

    roleA.extend(roleB)

    expect(policy.makePersona('role a').can('action', 'resource')).toBeTruthy()
  })

  test('tree extension', () => {
    let policy = new Broon()

    let roleA = new Role('role a')
    let roleB = new Role('role b')
    let roleC = new Role('role c')
    let privilegeA = new Privilege('action a', 'resource')
    let privilegeB = new Privilege('action b', 'resource')

    policy.registerRole(roleA)
    policy.registerRole(roleB)
    policy.registerRole(roleC)
    policy.registerPrivilege(privilegeA)
    policy.registerPrivilege(privilegeB)
    roleA.registerPrivilege(privilegeA)
    roleB.registerPrivilege(privilegeB)

    expect(policy.makePersona('role a').can('action a', 'resource')).toBeTruthy()
    expect(policy.makePersona('role b').can('action a', 'resource')).toBeFalsy()
    expect(policy.makePersona('role c').can('action a', 'resource')).toBeFalsy()

    expect(policy.makePersona('role b').can('action b', 'resource')).toBeTruthy()
    expect(policy.makePersona('role a').can('action b', 'resource')).toBeFalsy()
    expect(policy.makePersona('role c').can('action b', 'resource')).toBeFalsy()

    roleC.extend(roleA).extend(roleB)

    expect(policy.makePersona('role c').can('action a', 'resource')).toBeTruthy()
    expect(policy.makePersona('role c').can('action b', 'resource')).toBeTruthy()
    expect(policy.makePersona('role a').can('action b', 'resource')).toBeFalsy()
    expect(policy.makePersona('role b').can('action a', 'resource')).toBeFalsy()
  })

  test('deadly diamond of death extension', () => {
    let policy = new Broon()

    let privileges = ['a', 'b', 'c'].map((letter) => new Privilege(letter, 'resource'))
    let roles = ['a', 'b', 'c', 'd'].map((letter) => new Role(letter, 'role ' + letter))
    roles.map(policy.registerRole.bind(policy))
    privileges.map(policy.registerPrivilege.bind(policy))
    privileges.map((p, idx) => roles[idx].registerPrivilege(p))

    expect(policy.makePersona('role a').can('a', 'resource')).toBeTruthy()
    expect(policy.makePersona('role b').can('a', 'resource')).toBeFalsy()
    expect(policy.makePersona('role c').can('a', 'resource')).toBeFalsy()
    expect(policy.makePersona('role d').can('a', 'resource')).toBeFalsy()

    expect(policy.makePersona('role b').can('b', 'resource')).toBeTruthy()
    expect(policy.makePersona('role a').can('b', 'resource')).toBeFalsy()
    expect(policy.makePersona('role c').can('b', 'resource')).toBeFalsy()
    expect(policy.makePersona('role d').can('b', 'resource')).toBeFalsy()

    expect(policy.makePersona('role c').can('c', 'resource')).toBeTruthy()
    expect(policy.makePersona('role a').can('c', 'resource')).toBeFalsy()
    expect(policy.makePersona('role b').can('c', 'resource')).toBeFalsy()
    expect(policy.makePersona('role d').can('c', 'resource')).toBeFalsy()

    roles[1].extend(roles[0])
    roles[2].extend(roles[0])

    expect(policy.makePersona('role b').can('a', 'resource')).toBeTruthy()
    expect(policy.makePersona('role c').can('a', 'resource')).toBeTruthy()

    roles[3].extend(roles[1]).extend(roles[2])

    expect(policy.makePersona('role d').can('a', 'resource')).toBeTruthy()
    expect(policy.makePersona('role d').can('b', 'resource')).toBeTruthy()
    expect(policy.makePersona('role d').can('c', 'resource')).toBeTruthy()

    roles[0].rename('new name')

    expect(policy.makePersona('role d').can('a', 'resource')).toBeTruthy()
    expect(policy.makePersona('role d').can('b', 'resource')).toBeTruthy()
    expect(policy.makePersona('role d').can('c', 'resource')).toBeTruthy()
  })
})
