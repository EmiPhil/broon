// * broon!

function includes (arrayOrString, item) {
  // * This is not an exact poly fill for Array.prototype.includes and String.prototype.includes.
  // * In the case that we are a string we check for exact equality instead of substring is in
  // * string which suits our use case better.

  if (typeof arrayOrString === 'string') {
    return arrayOrString === item
  }

  // * For Arrays, we are implementing a simple polyfill if the function does not exist

  if (typeof arrayOrString.includes === 'function') {
    return arrayOrString.includes(item)
  } else {
    for (var idx = 0; idx < arrayOrString.length; idx++) {
      if (arrayOrString[idx] === item) {
        return true
      }
    }

    return false
  }
}

function iterate (arrayOrObject, fn) {
  if (Array.isArray(arrayOrObject)) {
    for (var idx = 0; idx < arrayOrObject.length; idx++) {
      fn(arrayOrObject[idx], idx, arrayOrObject)
    }
  } else {
    for (var key in arrayOrObject) {
      fn(arrayOrObject[key], key, arrayOrObject)
    }
  }
}

function startsWith (string, search) {
  return string.substring(0, search.length) === search
}

function isObject (value) {
  return Boolean(value !== null && !Array.isArray(value) && typeof value === 'object')
}

function clone (value) {
  if (isObject(value)) {
    return cloneObject(value)
  } else if (Array.isArray(value)) {
    return cloneArray(value)
  } else {
    return value
  }
}

function cloneArray (array) {
  var _clone = []

  for (var idx = 0; idx < array.length; idx++) {
    _clone[idx] = clone(array[idx])
  }

  return _clone
}

function cloneObject (object) {
  var _clone = {}

  for (var key in object) {
    _clone[key] = clone(object[key])
  }

  return _clone
}

function isEqual (a, b) {
  if (Array.isArray(a)) {
    return Array.isArray(b) && arrayEqual(a, b)
  }

  if (isObject(a)) {
    return isObject(b) && objectEqual(a, b)
  }

  // ? NaN !== NaN
  // @ https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN
  // eslint-disable-next-line no-self-compare
  if (typeof a === 'number' && a !== a) {
    // eslint-disable-next-line no-self-compare
    return typeof b === 'number' && b !== b
  }

  if (typeof a === 'undefined') {
    return typeof b === 'undefined'
  }

  return a === b
}

function arrayEqual (arr1, arr2) {
  if (arr1.length !== arr2.length) {
    return false
  }

  for (var idx = 0; idx < arr1.length; idx++) {
    if (!isEqual(arr1[idx], arr2[idx])) {
      return false
    }
  }

  return true
}

function objectEqual (object1, object2) {
  if (Object.keys(object1).length !== Object.keys(object2).length) {
    return false
  }

  for (var key in object1) {
    if (!isEqual(object1[key], object2[key])) {
      return false
    }
  }

  return true
}

function stringJson (string) {
  var str = string

  str = str.replace(/\n/g, '\\n')
  str = str.replace(/\r/g, '\\r')
  str = str.replace(/\t/g, '\\t')
  // ! The order of operations matters here. If you do the quote replacer first the \ replacer will
  // ! remove the \ in \"
  str = str.replace(/\\/g, '\\\\')
  str = str.replace(/"/g, '\\"')

  return '"' + str + '"'
}

function objectJson (object, asArray) {
  var json = ''

  for (var key in object) {
    json += stringJson(key)

    if (!asArray) {
      json += ':'
      // ! Note that children objects are expected to implement a toJson instance method
      json += object[key].toJson()
    }

    json += ','
  }

  // * Remove trailing comma
  json = json.substring(0, json.length - 1)
  return json
}

function readJson (string) {
  // * We rely on the JSON global for reading json. Certain (but few) contexts may not implement it,
  // * so we throw in those cases.
  if (JSON === undefined) {
    throw new ReferenceError('Passed a string with no global JSON context to parse with')
  }

  return JSON.parse(string)
}

function Broon () {
  this.privileges = {}
  this.roles = {}
}

// * These utility functions aren't really associated with Broon, but we export them for testing
// * purposes
Broon._includes = includes
Broon._iterate = iterate
Broon._startsWith = startsWith
Broon._clone = clone
Broon._isEqual = isEqual

Broon.toTarget = function (action, resourceKind) {
  return action + '->' + resourceKind
}

Broon.prototype.registerPrivilege = function (privilege) {
  var _privileges
  if (Array.isArray(arguments[0])) {
    _privileges = arguments[0]
  } else {
    _privileges = arguments
  }

  for (var idx = 0; idx < _privileges.length; idx++) {
    this.privileges[_privileges[idx].id] = _privileges[idx]
  }

  return this
}

Broon.prototype.registerPrivileges = function () {
  return this.registerPrivilege.apply(this, arguments)
}

Broon.prototype.getPrivilege = function (action, resourceKind) {
  if (arguments.length === 1) {
    // * assume we were passed a target
    return this.privileges[action]
  }

  return this.privileges[Broon.toTarget(action, resourceKind)]
}

Broon.prototype.getPrivileges = function (signatures) {
  // * expect an array of requests of signature [[action, resourceKind]]
  var privileges = []
  for (var idx = 0; idx < signatures.length; idx++) {
    var request = signatures[idx]
    var action = request[0]
    var resourceKind = request[1]

    privileges.push(this.getPrivilege(action, resourceKind))
  }

  return privileges
}

Broon.prototype.registerRole = function (role) {
  var _roles
  if (Array.isArray(arguments[0])) {
    _roles = arguments[0]
  } else {
    _roles = arguments
  }

  for (var idx = 0; idx < _roles.length; idx++) {
    this.roles[_roles[idx].id] = _roles[idx]
  }
  return this
}

Broon.prototype.registerRoles = function () {
  return this.registerRole.apply(this, arguments)
}

Broon.prototype.getRole = function (id) {
  return this.roles[id]
}

Broon.prototype.loadRoles = function () {
  for (var roleId in this.roles) {
    this.getRole(roleId).load()
  }

  return this
}

Broon.prototype.makePersona = function (roleIds, persona) {
  var roles = {}

  for (var roleId in this.roles) {
    // * See the note about includes above. Since we check for an exact match on strings, we
    // * support roleIds being an array of roles or being a string of an exact roleId
    if (includes(roleIds, roleId)) {
      roles[roleId] = this.roles[roleId]
    }
  }

  return new Persona(roles, persona, this)
}

Broon.merge = function () {
  var _broons
  if (Array.isArray(arguments[0])) {
    _broons = arguments[0]
  } else {
    _broons = arguments
  }

  var broon = new Broon()

  for (var idx = 0; idx < _broons.length; idx++) {
    broon.merge(_broons[idx])
  }

  return broon
}

Broon.prototype.merge = function (broon, overwrite) {
  if (typeof overwrite === 'undefined') {
    overwrite = true
  }

  var reRegisterRoles = false
  for (var privilegeId in broon.privileges) {
    if (overwrite || !(privilegeId in this.privileges)) {
      if (!reRegisterRoles && privilegeId in this.privileges) {
        reRegisterRoles = true
      }

      this.registerPrivilege(Privilege.from(broon.privileges[privilegeId]))
    }
  }

  // * Reregister our roles to use the new privileges if any were overwritten (since roles keep
  // * their own reference to privileges)
  if (reRegisterRoles) {
    for (var roleId in this.roles) {
      this.registerRole(Role.from(this.roles[roleId], this))
    }
  }

  // eslint-disable-next-line no-redeclare
  for (var roleId in broon.roles) {
    if (overwrite || !(roleId in this.roles)) {
      this.registerRole(Role.from(broon.roles[roleId], this))
    }
  }

  this.loadRoles()
  return this
}

Broon.prototype.rightDiff = function (broon) {
  // * create a new Broon which represents the new things that would be added in a merge between
  // * this broon and the argument(right) broon. This is useful if an application has a default
  // * policy and only wants to store the additive modifications for each account's policy
  var diff = new Broon()
  var context = Broon.merge(this, broon)

  for (var privilegeId in broon.privileges) {
    if (!isEqual(this.privileges[privilegeId], broon.privileges[privilegeId])) {
      diff.registerPrivilege(Privilege.from(broon.privileges[privilegeId]))
    }
  }

  for (var roleId in broon.roles) {
    if (!isEqual(this.roles[roleId], broon.roles[roleId])) {
      diff.registerRole(Role.from(broon.roles[roleId], context))
      // * Making the Role.from context equal to the merged result of this broon and arg broon
      // * enables the roles from the arg broon to access privileges in this broon. In other words,
      // * the resulting diff will bring along extra privileges from this broon if they are
      // * directly referenced by a role, even if they are not different. This allows the diff
      // * to always be a correct and functional Broon policy, at the expense of not being a "true"
      // * diff.
      // * To achieve a true diff, we would need to support the concept of a Broon partial/stub
      // * which probably isn't worthwhile.
    }
  }

  diff.loadRoles()
  return diff
}

Broon.prototype.toJson = function () {
  var json = '{"privileges":{'
  json += objectJson(this.privileges)
  json += '},"roles":{'
  json += objectJson(this.roles)
  json += '}}'

  return json
}

Broon.from = function (object) {
  var broon = new Broon()

  if (typeof object === 'string') {
    object = readJson(object)
  }

  for (var privilegeId in object.privileges) {
    broon.registerPrivilege(Privilege.from(object.privileges[privilegeId]))
  }

  // * roles are self referencing so we first create holder objects for all the possible roles, then
  // * call the load function
  for (var roleId in object.roles) {
    broon.registerRole(Role.from(object.roles[roleId], broon))
  }

  broon.loadRoles()

  return broon
}

function Persona (roles, context, broon) {
  // * Personas are the primary way to ask the broon policy if a particular user can do an action.
  // * We bind the persona to the user (context) for easy reuse, eg persona.can('do', 'action')
  this.roles = roles
  this.context = context
  this.broon = broon
}

Persona.prototype.can = function (action, resourceKind, resourceData) {
  var approved = false

  // * redirect requests to each of our roles and early return if any resolve true. This is an
  // * additive style of role management - if 900 requests say no and 1 says yes, the answer will be
  // * yes. There might be room for other strategies in the future. The .can interface could be
  // * using a Persona instance can strategy (GoF strategy pattern) if required in the future
  // * without introducing breaking changes.
  for (var roleId in this.roles) {
    var role = this.roles[roleId]
    approved = role.resolve(action, resourceKind, this.context, resourceData)
    if (approved) {
      break
    }
  }

  return approved
}

Persona.prototype.has = function (action, resourceKind) {
  var has = false

  // * The has method checks only for existance of a particular privilege - it DOES NOT resolve
  // * whether or not the persona is authorized to do the action to the resource given the contexts.
  // * This is useful in, for example, a user interface showing which privileges are enabled for
  // * the persona.
  // * If resourceKind is undefined, roles.has will assume it was passed a privilegeId. See
  // * Role.prototype.has for more info.
  for (var roleId in this.roles) {
    has = this.roles[roleId].has(action, resourceKind)
    if (has) {
      break
    }
  }

  return has
}

Persona.prototype.getPrivilegeIds = function (asArray) {
  // * We could cache the results of this call like we do in roles, but cache invalidation would
  // * require some sort of a hook into the roles to detect when they change. It is trivial to add
  // * cache invalidation functions in methods that mutate the role, but less so to add them to the
  // * persona roles. To implement caching here, we would want some kind of a (GoF) Observer pattern
  // * that we could register with and clear the cache with a callback.
  var privilegeIds = {}

  for (var roleId in this.roles) {
    var privileges = this.roles[roleId].getPrivilegeIds()
    for (var privilegeId in privileges) {
      privilegeIds[privilegeId] = true
    }
  }

  if (asArray) {
    var set = []
    // eslint-disable-next-line no-redeclare
    for (var privilegeId in privilegeIds) {
      set.push(privilegeId)
    }

    return set
  } else {
    return privilegeIds
  }
}

Persona.prototype.isSuper = function () {
  var isSuper = false

  for (var roleId in this.roles) {
    if (this.roles[roleId].superInChain()) {
      isSuper = true
      break
    }
  }

  return isSuper
}

Persona.prototype.subset = function (persona) {
  // * The subset method will return true if this persona is a complete subset of the argument
  // * persona. A persona is a subset if the 'parent' persona has all of their privileges.
  // * The function could be read as "is this persona a subset of that persona"

  // * Note that it is insufficient to simply compare role lists because a set of privileges could
  // * be composed by different groups of roles

  // * If the argument persona is super then we are a subset of it
  if (persona.isSuper()) {
    return true
  }

  // * similarly, if we are super then we are not a subset of the argument persona (we would be if
  // * they were also super, but that case would have already returned true above)
  if (this.isSuper()) {
    return false
  }

  var subset = true

  var selfPrivileges = this.getPrivilegeIds()
  var parentPrivileges = persona.getPrivilegeIds()

  for (var privilegeId in selfPrivileges) {
    if (!(privilegeId in parentPrivileges)) {
      subset = false
      break
    }
  }

  return subset
}

function Role (name, id) {
  this.name = name
  this.id = id || name
  this.privileges = {}
  this.privilegeIdCache = undefined
  this.targets = {}
  this.extends = {}
  this.isSuper = false
}

Role.prototype.rename = function (name) {
  this.name = name
  return this
}

Role.prototype.registerPrivilege = function (privilege) {
  var _privileges
  if (Array.isArray(arguments[0])) {
    _privileges = arguments[0]
  } else {
    _privileges = arguments
  }

  for (var idx = 0; idx < _privileges.length; idx++) {
    var _privilege = _privileges[idx]

    if (_privilege.id in this.privileges) {
      // * the privilege of this id already exists, so remove it before adding this (presumably) new
      // * privilege.
      this.revokePrivilege(_privilege.id)
    }

    // * Keep the privilege in a hash map indexed by id
    this.privileges[_privilege.id] = _privilege

    // * Also keep a seperate hash of arrays representing all privileges that respond to an action
    // * -> resourceKind pair. This enables a role to have multiple privileges that can resolve a
    // * particular action -> resourceKind pair in different ways based on the contexts
    var target = Broon.toTarget(_privilege.action, _privilege.resourceKind)
    if (!(target in this.targets)) {
      this.targets[target] = []
    }
    this.targets[target].push(_privilege.id)
  }

  this.clearPrivilegeIdCache()

  return this
}

Role.prototype.registerPrivileges = function () {
  return this.registerPrivilege.apply(this, arguments)
}

Role.prototype.revokePrivilege = function (privilegeId) {
  // * Expect just a privilegeId, but accept the whole privilege object
  if (typeof privilegeId !== 'string') {
    privilegeId = privilegeId.id
  }

  if (!(privilegeId in this.privileges)) {
    return this
  }

  // * We need to clean up both the privilege hash and the action -> resourceKind hash map
  var privilege = this.privileges[privilegeId]
  var target = Broon.toTarget(privilege.action, privilege.resourceKind)

  // * Privilege hash
  if (privilegeId in this.privileges) {
    delete this.privileges[privilegeId]
  }

  // * action -> resourceKind hash map
  for (var idx = 0; idx < this.targets[target].length; idx++) {
    if (this.targets[target][idx] === privilegeId) {
      this.targets[target].splice(idx, 1)

      // * If there are no more privileges in the action -> resourceKind hash map, clean it up too.
      if (this.targets[target].length === 0) {
        delete this.targets[target]
      }

      break
    }
  }

  this.clearPrivilegeIdCache()

  return this
}

Role.prototype.clearPrivilegeIdCache = function () {
  this.privilegeIdCache = undefined
}

Role.prototype.getPrivilegeIds = function (asArray) {
  // * Getting privileges can be an expensive operation, so we cache the result on the first call
  if (typeof this.privilegeIdCache === 'undefined') {
    var privilegeIds = {}

    for (var privilegeId in this.privileges) {
      privilegeIds[privilegeId] = true
    }

    for (var roleId in this.extends) {
      // eslint-disable-next-line no-redeclare
      for (var privilegeId in this.extends[roleId].getPrivilegeIds()) {
        privilegeIds[privilegeId] = true
      }
    }

    this.privilegeIdCache = privilegeIds
  }

  if (asArray) {
    var set = []
    // eslint-disable-next-line no-redeclare
    for (var privilegeId in this.privilegeIdCache) {
      set.push(privilegeId)
    }

    return set
  } else {
    return this.privilegeIdCache
  }
}

Role.prototype.resolve = function (action, resourceKind, context, resourceData) {
  // * isSuper is a full override
  if (this.isSuper) {
    return true
  }

  var target = Broon.toTarget(action, resourceKind)
  var privilegeList = this.targets[target] || []

  // * We may have more than one privilege for a given action->resourceKind pair, so check them all
  // * and return early if any resolve
  for (var idx = 0; idx < privilegeList.length; idx++) {
    if (this.privileges[privilegeList[idx]].resolve(context, resourceData, this.name)) {
      return true
    }
  }

  // * We failed to authorize the user within our own role, so we check the hierarchy and return
  // * early if any resolve. Calling resolve down the chain is a form of the Composite pattern from
  // * Design Patterns by the Gang of Four.
  for (var role in this.extends) {
    if (this.extends[role].resolve(action, resourceKind, context, resourceData)) {
      return true
    }
  }

  // * We failed to authorize the user within our role and within the hierarchy
  return false
}

Role.prototype.has = function (action, resourceKind) {
  // * isSuper has all privileges
  if (this.isSuper) {
    return true
  }

  if (typeof resourceKind !== 'undefined') {
    // * has is distinct from can because it returns truthy if the action/resourceKind pair exists
    return this.targets[Broon.toTarget(action, resourceKind)].length > 0
  } else {
    // * or if the privilege of this specific id exists (action = privilegeId if resourceKind
    // * is undefined)
    return action in this.privileges
  }
}

Role.prototype.extend = function (role) {
  this.extends[role.id] = role
  this.clearPrivilegeIdCache()
  return this
}

Role.prototype.revokeExtension = function (roleId) {
  if (typeof roleId !== 'string') {
    roleId = roleId.id
  }

  if (roleId in this.extends) {
    delete this.extends[roleId]
  }

  this.clearPrivilegeIdCache()

  return this
}

Role.prototype.superfy = function () {
  this.isSuper = true
  return this
}

Role.prototype.desuperfy = function () {
  this.isSuper = false
  return this
}

Role.makeSuper = function (role) {
  return role.superfy()
}

Role.revokeSuper = function (role) {
  return role.desuperfy()
}

Role.prototype.superInChain = function () {
  // * Check if self or a role we extend isSuper
  if (this.isSuper) {
    return true
  }

  var inChain = false
  for (var roleId in this.extends) {
    if (this.extends[roleId].superInChain()) {
      inChain = true
      break
    }
  }

  return inChain
}

Role.prototype.toJson = function () {
  var json = '{'
  json += '"name":' + stringJson(this.name) + ','
  json += '"id":' + stringJson(this.id) + ','
  json += '"isSuper":' + this.isSuper + ','

  json += '"extends":['
  json += objectJson(this.extends, true)
  json += '],"privileges":['
  json += objectJson(this.privileges, true)
  json += ']}'

  return json
}

// * setLoadContext and load are meant to be called within close proximity to each other and handle
// * the self referencing nature of roles a bit cleaner. A parent class will instantiate all the
// * roles of the policy first, and then call the load method on each so that each role can
// * reference their extended roles directly
Role.prototype.setLoadContext = function (context, roleObject) {
  this.loadContext = {
    broon: context,
    roleObject: roleObject
  }
  return this
}

Role.prototype.load = function () {
  if (!('loadContext' in this)) {
    return
  }

  var broon = this.loadContext.broon
  var roleObject = this.loadContext.roleObject

  var self = this

  // * The roleObject could either be a raw json object from Role.toJson (arrays) or a real role
  // * (objects), so we use the iterate helper to handle either case
  iterate(roleObject.privileges, function (privilege) {
    var id = privilege.constructor === Privilege ? privilege.id : privilege
    self.registerPrivilege(broon.getPrivilege(id))
  })

  iterate(roleObject.extends, function (role) {
    var id = role.constructor === Role ? role.id : role
    self.extend(broon.getRole(id))
  })

  // * It would be bad practice for the cache to have anything in it at this point, but clear it
  // * just in case.
  this.clearPrivilegeIdCache()

  delete this.loadContext
}

Role.from = function (_role, context) {
  var role = new Role(_role.name, _role.id)
  if (_role.isSuper) {
    role.superfy()
  }

  return role.setLoadContext(context, _role)
}

function Constraint (name, constraint, id) {
  this.id = id || name
  this.name = name

  this.program = constraint
  var parsed = Constraint.parseExpression(constraint, true)
  this.syntaxTree = parsed.expression
}

Constraint.skipSpace = function (string) {
  var first = string.search(/\S/)
  if (first === -1) {
    return ''
  }
  return string.slice(first)
}

Constraint.operators = {
  'and': function () {
    var result = true
    for (var idx = 0; idx < arguments.length; idx++) {
      if (arguments[idx] === false) {
        result = false
        break
      }
    }
    return result
  },
  'or': function () {
    var result = false
    for (var idx = 0; idx < arguments.length; idx++) {
      if (arguments[idx] === true) {
        result = true
        break
      }
    }
    return result
  },
  'not': function (boolean) {
    return !boolean
  },
  'is': function (left, right) {
    return left === right
  },
  'in': function () {
    var check = arguments[0]
    var list = arguments[1].split(',')
    var result = false

    for (var idx = 0; idx < list.length; idx++) {
      if (list[idx] === check) {
        result = true
        break
      }
    }

    return result
  }
}

Constraint.accessors = {
  'persona': 'persona',
  'context': 'context',
  'data': 'data',
  'resource': 'resource'
}

Constraint.parseExpression = function (program, start) {
  program = Constraint.skipSpace(program)
  var match, expression

  if (start) {
    // * the start of a program must be a function
    var isWrapped = false

    for (var op in Constraint.operators) {
      if (startsWith(program, op)) {
        isWrapped = true
        break
      }
    }

    if (!isWrapped) {
      throw new SyntaxError('Program must start with an operator')
    }
  }

  if ((match = /^(\w+\.)+\w+/.exec(program))) {
    var value = match[0]
    if (!(value.split('.')[0] in Constraint.accessors)) {
      throw new SyntaxError('Unknown accessor ' + value + ' in program')
    }

    expression = { type: 'accessor', value: value }
  } else if ((match = /^[^\s(),]+/.exec(program))) {
    expression = { type: 'word', name: match[0] }
  } else {
    throw new SyntaxError('Unexpected syntax in constraint program')
  }

  return Constraint.parseApply(expression, program.slice(match[0].length))
}

Constraint.parseApply = function (expression, program) {
  program = Constraint.skipSpace(program)
  if (program[0] !== '(') {
    return { expression: expression, rest: program }
  }

  if (!(expression.name in Constraint.operators)) {
    throw new SyntaxError('Operator ' + expression.name + ' not recognized')
  }

  program = Constraint.skipSpace(program.slice(1))
  expression = { type: 'apply', operator: expression, args: [] }
  while (program[0] !== ')') {
    var arg = Constraint.parseExpression(program)
    expression.args.push(arg.expression)
    program = Constraint.skipSpace(arg.rest)
    if (program[0] === ',') {
      program = Constraint.skipSpace(program.slice(1))
    }
  }

  return Constraint.parseApply(expression, program.slice(1))
}

Constraint.eval = function (expression, context, resourceData, roleName) {
  if (expression.type === 'apply') {
    var operator = expression.operator
    var args = expression.args

    if (operator.type === 'word') {
      var evaluatedArguments = args.map(function (arg) {
        return Constraint.eval(arg, context, resourceData, roleName)
      })

      return Constraint.operators[operator.name].apply(null, evaluatedArguments)
    }
  } else if (expression.type === 'accessor') {
    var accessors = expression.value.split('.')
    var accessorType = accessors.shift()

    var object

    if (accessorType === 'persona' || accessorType === 'context') {
      object = context
    } else if (accessorType === 'data' || accessorType === 'resource') {
      object = resourceData
    }

    for (var idx = 0; idx < accessors.length; idx++) {
      if (typeof object !== 'object' || !(accessors[idx] in object)) {
        object = undefined
        break
      }

      object = object[accessors[idx]]
    }

    return String(object)
  } else if (expression.type === 'word') {
    if (expression.name === 'role') {
      return String(roleName)
    } else {
      return String(expression.name)
    }
  }
}

Constraint.prototype.evaluate = function (context, resourceData, roleName) {
  return Constraint.eval(this.syntaxTree, context, resourceData, roleName)
}

Constraint.prototype.toJson = function () {
  var json = '{'

  json += '"id":' + stringJson(this.id) + ','
  json += '"name":' + stringJson(this.name) + ','
  json += '"program":' + stringJson(this.program)
  json += '}'

  return json
}

Constraint.from = function (_constraint) {
  return new Constraint(_constraint.name, _constraint.program, _constraint.id)
}

function Privilege (action, resourceKind, id) {
  this.action = action
  this.resourceKind = resourceKind
  this.target = Broon.toTarget(action, resourceKind)
  this.id = id || this.target
  this.constraints = {}
}

Privilege.prototype.registerConstraint = function (constraint) {
  var _constraints
  if (Array.isArray(arguments[0])) {
    _constraints = arguments[0]
  } else {
    _constraints = arguments
  }

  for (var idx = 0; idx < _constraints.length; idx++) {
    this.constraints[_constraints[idx].id] = _constraints[idx]
  }
  return this
}

Privilege.prototype.registerConstraints = function () {
  return this.registerConstraint.apply(this, arguments)
}

Privilege.prototype.resolve = function (context, resourceData, roleName) {
  var approved = true

  for (var constraintId in this.constraints) {
    approved = this.constraints[constraintId].evaluate(context, resourceData, roleName)

    if (!approved) {
      break
    }
  }

  return approved
}

Privilege.prototype.toJson = function () {
  var json = '{'

  json += '"id":' + stringJson(this.id) + ','
  json += '"target":' + stringJson(this.target) + ','
  json += '"action":' + stringJson(this.action) + ','
  json += '"resourceKind":' + stringJson(this.resourceKind) + ','

  json += '"constraints":{'
  json += objectJson(this.constraints)
  json += '}}'

  return json
}

Privilege.from = function (_privilege) {
  var privilege = new Privilege(_privilege.action, _privilege.resourceKind, _privilege.id)

  for (var id in _privilege.constraints) {
    privilege.registerConstraint(Constraint.from(_privilege.constraints[id]))
  }

  return privilege
}

// * this function allows importing via various methods (node, browser, etc). Taken from
// @ https://github.com/umdjs/umd/blob/master/templates/returnExports.js
;(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // * AMD. Register as an anonymous module.
    define([], factory)
  } else if (typeof module === 'object' && module.exports) {
    // * Node. Does not work with strict CommonJS, but
    // * only CommonJS-like environments that support module.exports,
    // * like Node.
    module.exports = factory()
  } else {
    // * Browser globals (root is window)
    root.returnExports = factory()
  }
}(typeof self !== 'undefined' ? self : this, function () {
  Broon.default = Broon
  Broon.Broon = Broon
  Broon.Role = Role
  Broon.Privilege = Privilege
  Broon.Constraint = Constraint
  Broon.Persona = Persona

  return Broon
}))
