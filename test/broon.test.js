const Broon = require('../src/broon')

test('Broon has a static method toTarget to create target strings', () => {
  expect(typeof Broon.toTarget).toBe('function')
  expect(Broon.toTarget('a', 'b')).toBe(new Broon.Privilege('a', 'b').target)
})

test('Broon registers privileges via their id', () => {
  let policy = new Broon()
  let privilege = { id: 'test' }
  policy.registerPrivilege(privilege)

  expect(policy.privileges['test']).toBe(privilege)
})

test('Broon registers roles via their id', () => {
  let policy = new Broon()
  let role = { name: 'test', id: 'id' }
  policy.registerRole(role)

  expect(policy.roles['id']).toBe(role)
})

test('Role registers privileges via their id', () => {
  let role = new Broon.Role('test')
  let privilege = { id: 'test' }
  role.registerPrivilege(privilege)

  expect(role.privileges['test']).toBe(privilege)
})

test('Privilege registers constraints via their id', () => {
  let privilege = new Broon.Privilege('action', 'resource')
  let constraint = { id: 'constraint' }
  privilege.registerConstraint(constraint)

  expect(privilege.constraints['constraint']).toBe(constraint)
})

test('Exports and imports json', () => {
  let policy = new Broon()

  policy.registerRole(new Broon.Role('test'))
  policy.registerPrivilege(new Broon.Privilege('action', 'resource'))
  policy.getRole('test').registerPrivilege(policy.getPrivilege('action', 'resource'))
  policy.getPrivilege('action', 'resource').registerConstraint(new Broon.Constraint('constraint', 'is("true" \'true\')'))
  policy.registerRole(new Broon.Role('test2'))
  policy.getRole('test2').extend(policy.getRole('test'))
  policy.registerRole(Broon.Role.makeSuper(new Broon.Role('super')))

  let json = policy.toJson()
  var mock1 = jest.fn(() => JSON.parse(json))
  mock1()
  expect(mock1).toHaveReturned()

  let policy2 = Broon.from(json)
  expect(policy).toEqual(policy2)

  let J = JSON
  // eslint-disable-next-line
  JSON = undefined
  var policy3 = Broon.from(J.parse(json))
  expect(policy).toEqual(policy3)
  expect(() => Broon.from(json)).toThrow(ReferenceError)
  // eslint-disable-next-line
  JSON = J
})

test('Import empty object returns new broon', () => {
  expect(Broon.from({})).toEqual(new Broon())
})

test('pass array/arg list to resgisterPrivilege/Privileges', () => {
  var policy = new Broon()
  var privilegeA = new Broon.Privilege('action', 'resource')
  var privilegeB = new Broon.Privilege('action', 'resource 2')

  policy.registerPrivilege(privilegeA)
  policy.registerPrivilege(privilegeB)

  expect(new Broon().registerPrivilege(privilegeA).registerPrivilege(privilegeB)).toEqual(policy)
  expect(new Broon().registerPrivilege(privilegeA, privilegeB)).toEqual(policy)
  expect(new Broon().registerPrivileges(privilegeA, privilegeB)).toEqual(policy)
  expect(new Broon().registerPrivilege([privilegeA, privilegeB])).toEqual(policy)
  expect(new Broon().registerPrivileges([privilegeA, privilegeB])).toEqual(policy)
})

test('pass array/arg list to resgisterRole/Roles', () => {
  var policy = new Broon()
  var roleA = new Broon.Role('role a')
  var roleB = new Broon.Role('role b')

  policy.registerRole(roleA)
  policy.registerRole(roleB)

  expect(new Broon().registerRole(roleA).registerRole(roleB)).toEqual(policy)
  expect(new Broon().registerRole(roleA, roleB)).toEqual(policy)
  expect(new Broon().registerRoles(roleA, roleB)).toEqual(policy)
  expect(new Broon().registerRole([roleA, roleB])).toEqual(policy)
  expect(new Broon().registerRoles([roleA, roleB])).toEqual(policy)
})
