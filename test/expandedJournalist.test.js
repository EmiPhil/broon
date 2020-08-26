const { Broon, Role, Privilege, Constraint } = require('../src/broon')

function getRandomInt (max) {
  return Math.floor(Math.random() * Math.floor(max))
}

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
let roles = [EDITOR, JOURNALIST, SUBSCRIBER]

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

/**
 * Add some constraints
 */
const editorOrOwner = new Constraint('editorOrOwner', `or( is(role, ${EDITOR}), is(persona.id, data.authorId))`)

policy.getPrivilege(UPDATE, POST).registerConstraint(editorOrOwner)
policy.getPrivilege(UPDATE, COMMENT).registerConstraint(editorOrOwner)

policy.roles[JOURNALIST].registerPrivileges(policy.getPrivileges([
  [UPDATE, POST], [UPDATE, COMMENT]
]))

policy.roles[SUBSCRIBER].registerPrivilege(policy.getPrivilege(UPDATE, COMMENT))

let posts = []
let comments = []

for (let i = 0; i < 20; i++) {
  posts.push({ postId: i, authorId: getRandomInt(3) })

  for (let j = 0; j < 10; j++) {
    comments.push({ postId: i, commentId: j, authorId: getRandomInt(5) })
  }
}

test('the editor can update all posts and comments', () => {
  let theEditor = policy.makePersona(EDITOR, { id: 0 })

  posts.forEach((post) => {
    expect(theEditor.can(UPDATE, POST, post)).toBeTruthy()
  })

  comments.forEach((comment) => {
    expect(theEditor.can(UPDATE, COMMENT, comment)).toBeTruthy()
  })
})

test('the journalist can only update their own posts and comments', () => {
  let theJournalist1 = policy.makePersona(JOURNALIST, { id: 1 })
  let theJournalist2 = policy.makePersona(JOURNALIST, { id: 2 })

  posts.forEach((post) => {
    if (post.authorId === 1) {
      expect(theJournalist1.can(UPDATE, POST, post)).toBeTruthy()
      expect(theJournalist2.can(UPDATE, POST, post)).toBeFalsy()
    } else if (post.authorId === 2) {
      expect(theJournalist1.can(UPDATE, POST, post)).toBeFalsy()
      expect(theJournalist2.can(UPDATE, POST, post)).toBeTruthy()
    } else {
      expect(theJournalist1.can(UPDATE, POST, post)).toBeFalsy()
      expect(theJournalist2.can(UPDATE, POST, post)).toBeFalsy()
    }
  })

  comments.forEach((comment) => {
    if (comment.authorId === 1) {
      expect(theJournalist1.can(UPDATE, COMMENT, comment)).toBeTruthy()
      expect(theJournalist2.can(UPDATE, COMMENT, comment)).toBeFalsy()
    } else if (comment.authorId === 2) {
      expect(theJournalist1.can(UPDATE, COMMENT, comment)).toBeFalsy()
      expect(theJournalist2.can(UPDATE, COMMENT, comment)).toBeTruthy()
    } else {
      expect(theJournalist1.can(UPDATE, COMMENT, comment)).toBeFalsy()
      expect(theJournalist2.can(UPDATE, COMMENT, comment)).toBeFalsy()
    }
  })
})

test('the subscriber can only update their own comments', () => {
  let theSubscriber1 = policy.makePersona(JOURNALIST, { id: 3 })
  let theSubscriber2 = policy.makePersona(JOURNALIST, { id: 4 })

  posts.forEach((post) => {
    expect(theSubscriber1.can(UPDATE, POST, post)).toBeFalsy()
    expect(theSubscriber2.can(UPDATE, POST, post)).toBeFalsy()
  })

  comments.forEach((comment) => {
    if (comment.authorId === 3) {
      expect(theSubscriber1.can(UPDATE, COMMENT, comment)).toBeTruthy()
      expect(theSubscriber2.can(UPDATE, COMMENT, comment)).toBeFalsy()
    } else if (comment.authorId === 4) {
      expect(theSubscriber1.can(UPDATE, COMMENT, comment)).toBeFalsy()
      expect(theSubscriber2.can(UPDATE, COMMENT, comment)).toBeTruthy()
    } else {
      expect(theSubscriber1.can(UPDATE, COMMENT, comment)).toBeFalsy()
      expect(theSubscriber2.can(UPDATE, COMMENT, comment)).toBeFalsy()
    }
  })
})
