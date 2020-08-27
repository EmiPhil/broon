const Broon = require('../src/broon')

test('Broon has a static method toTarget to create target strings', () => {
  expect(typeof Broon.toTarget).toBe('function')
  expect(Broon.toTarget('a', 'b')).toBe(new Broon.Privilege('a', 'b').target)
})

test('Broon registers privileges via their target', () => {
  let policy = new Broon()
  let privilege = { target: 'test' }
  policy.registerPrivilege(privilege)

  expect(policy.privileges['test']).toBe(privilege)
})

test('Broon registers roles via their id', () => {
  let policy = new Broon()
  let role = { name: 'test', id: 'id' }
  policy.registerRole(role)

  expect(policy.roles['id']).toBe(role)
})

test('Role registers privileges via their target', () => {
  let role = new Broon.Role('test')
  let privilege = { target: 'test' }
  role.registerPrivilege(privilege)

  expect(role.privileges['test']).toBe(privilege)
})

test('Privilege registers constraints via their name', () => {
  let privilege = new Broon.Privilege('action', 'resource')
  let constraint = { name: 'constraint' }
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
