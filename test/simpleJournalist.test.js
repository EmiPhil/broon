const { Broon, Role, Privilege } = require('../src/broon')

/**
 * Build a journalism example policy and make sure that Broon properly gatekeeps
 */

let policy = new Broon()

const CREATE = 'create'
const READ = 'read'
const UPDATE = 'update'
const DELETE = 'delete'

const POST = 'post'
const COMMENT = 'comment'

let actions = [CREATE, READ, UPDATE, DELETE]
let resources = [POST, COMMENT]

actions.forEach((action) => {
  resources.forEach((resource) => {
    policy.registerPrivilege(new Privilege(action, resource))
  })
})

const EDITOR = 'editor'
const JOURNALIST = 'journalist'
const SUBSCRIBER = 'subscriber'
const GUEST = 'guest'
let roles = [EDITOR, JOURNALIST, SUBSCRIBER, GUEST]

roles.forEach((role) => {
  policy.registerRole(new Role(role))
})

policy.roles[EDITOR].registerPrivileges(policy.getPrivileges([
  [CREATE, POST], [READ, POST], [UPDATE, POST], [DELETE, POST],
  [CREATE, COMMENT], [READ, COMMENT], [UPDATE, COMMENT], [DELETE, COMMENT]
]))

policy.roles[JOURNALIST].registerPrivileges(policy.getPrivileges([
  [CREATE, POST], [READ, POST], [CREATE, COMMENT], [READ, COMMENT]
]))

policy.roles[SUBSCRIBER].registerPrivileges(policy.getPrivileges([
  [READ, POST], [CREATE, COMMENT], [READ, COMMENT]
]))

policy.roles[GUEST].registerPrivileges(policy.getPrivileges([
  [READ, POST], [READ, COMMENT]
]))

test('privileges and roles were created', () => {
  expect(Object.keys(policy.privileges).length).toBe(actions.length * resources.length)
  expect(Object.keys(policy.roles).length).toBe(roles.length)
})

test('the editor can do everything', () => {
  let theEditor = policy.makePersona(EDITOR, {})

  actions.forEach((action) => {
    resources.forEach((resource) => {
      expect(theEditor.can(action, resource)).toBeTruthy()
    })
  })
})

test('the journalist can only create and read', () => {
  let theJournalist = policy.makePersona(JOURNALIST, {})

  actions.forEach((action) => {
    resources.forEach((resource) => {
      if (action === CREATE || action === READ) {
        expect(theJournalist.can(action, resource)).toBeTruthy()
      } else {
        expect(theJournalist.can(action, resource)).toBeFalsy()
      }
    })
  })
})

test('the subscriber can create and read comments and read posts', () => {
  let theSubscriber = policy.makePersona(SUBSCRIBER, {})

  actions.forEach((action) => {
    resources.forEach((resource) => {
      if (action === READ || (action === CREATE && resource === COMMENT)) {
        expect(theSubscriber.can(action, resource)).toBeTruthy()
      } else {
        expect(theSubscriber.can(action, resource)).toBeFalsy()
      }
    })
  })
})

test('the guest can only read', () => {
  let theGuest = policy.makePersona(GUEST, {})

  actions.forEach((action) => {
    resources.forEach((resource) => {
      if (action === READ) {
        expect(theGuest.can(action, resource)).toBeTruthy()
      } else {
        expect(theGuest.can(action, resource)).toBeFalsy()
      }
    })
  })
})
