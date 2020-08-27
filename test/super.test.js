const Broon = require('../src/broon')

describe('superadmin feature always can', () => {
  test('always can', () => {
    let policy = new Broon()
    let role = new Broon.Role('super', '1')
    Broon.Role.makeSuper(role)
    policy.registerRole(role)

    let superAdmin = policy.makePersona('1')

    expect(superAdmin.can('any action on', 'anything')).toBeTruthy()
  })
})
