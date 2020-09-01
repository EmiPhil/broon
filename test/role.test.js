const { Role, Privilege } = require('../src/broon')

describe('role tests not covered in the example cases', () => {
  test('revoke privilege', () => {
    let role = new Role('role')
    let priv = new Privilege('can', 'do', 'p')

    expect(role.registerPrivilege(priv).revokePrivilege(priv)).toEqual(new Role('role'))
    expect(role.registerPrivilege(priv).revokePrivilege('p')).toEqual(new Role('role'))
  })
})
