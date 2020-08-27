function includes (arrayOrString, item) {
  if (typeof arrayOrString === 'string') {
    return arrayOrString === item
  }

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

function startsWith (string, search) {
  return string.substring(0, search.length) === search
}

function stringJson (string) {
  var str = string

  str = str.replace(/\n/g, '\\n')
  str = str.replace(/\r/g, '\\r')
  str = str.replace(/\t/g, '\\t')
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
      json += object[key].toJson()
    }

    json += ','
  }

  json = json.substring(0, json.length - 1)

  return json
}

function readJson (string) {
  if (JSON === undefined) {
    throw new ReferenceError('Passed a string with no JSON context to parse with')
  }

  return JSON.parse(string)
}

function Broon () {
  this.privileges = {}
  this.roles = {}
}

Broon.toTarget = function (action, resourceKind) {
  return action + '->' + resourceKind
}

Broon._includes = includes
Broon._startsWith = startsWith

Broon.prototype.registerPrivilege = function (privilege) {
  this.privileges[privilege.target] = privilege
  return this
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
  this.roles[role.id] = role
  return this
}

Broon.prototype.getRole = function (id) {
  return this.roles[id]
}

Broon.prototype.makePersona = function (roleIds, persona) {
  var roles = {}

  for (var roleId in this.roles) {
    if (includes(roleIds, roleId)) {
      roles[roleId] = this.roles[roleId]
    }
  }

  return new Persona(roles, persona)
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
    broon.registerPrivilege(Privilege.from.call(broon, object.privileges[privilegeId]))
  }

  // * roles are self referencing so we first create holder objects for all the possible roles, then
  // * call the load function
  for (var roleId in object.roles) {
    broon.registerRole(Role.from.call(broon, object.roles[roleId]))
  }

  // eslint-disable-next-line no-redeclare
  for (var roleId in object.roles) {
    broon.getRole(roleId).load()
  }

  return broon
}

function Persona (roles, context) {
  this.roles = roles
  this.context = context
}

Persona.prototype.can = function (action, resourceKind, resourceData) {
  var approved = false
  var target = Broon.toTarget(action, resourceKind)

  for (var roleId in this.roles) {
    var role = this.roles[roleId]
    approved = role.resolve(target, this.context, resourceData)
    if (approved) {
      break
    }
  }

  return approved
}

function Role (name, id) {
  this.name = name
  this.id = id || name
  this.privileges = {}
  this.extends = {}
  this.isSuper = false
}

Role.prototype.rename = function (name) {
  this.name = name
  return this
}

Role.prototype.registerPrivilege = function (privilege) {
  this.privileges[privilege.target] = privilege
  return this
}

Role.prototype.registerPrivileges = function (privileges) {
  // * expects an array of signature [privilege]
  for (var idx = 0; idx < privileges.length; idx++) {
    this.registerPrivilege(privileges[idx])
  }

  return this
}

Role.prototype.resolve = function (target, context, resourceData) {
  if (this.isSuper) {
    return true
  }

  if (!(target in this.privileges)) {
    // * this role doesn't have the privilege for this action, but we may in our hierarchy
    for (var role in this.extends) {
      if (this.extends[role].resolve(target, context, resourceData)) {
        return true
      }
    }
    return false
  }

  return this.privileges[target].resolve(context, resourceData, this.name)
}

Role.prototype.extend = function (role) {
  this.extends[role.id] = role
  return this
}

Role.prototype.superfy = function () {
  this.isSuper = true
  return this
}

Role.makeSuper = function (role) {
  return role.superfy()
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
  var broon = this.loadContext.broon
  var roleObject = this.loadContext.roleObject

  for (var idx = 0; idx < roleObject.privileges.length; idx++) {
    this.registerPrivilege(broon.getPrivilege(roleObject.privileges[idx]))
  }

  // eslint-disable-next-line no-redeclare
  for (var idx = 0; idx < roleObject.extends.length; idx++) {
    this.extend(broon.getRole(roleObject.extends[idx]))
  }

  delete this.loadContext
}

Role.from = function (roleObject) {
  var role = new Role(roleObject.name, roleObject.id)
  if (roleObject.isSuper) {
    role.superfy()
  }

  return role.setLoadContext(this, roleObject)
}

function Constraint (name, constraint) {
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
  var json = '{"name":' + stringJson(this.name) + ','
  json += '"program":' + stringJson(this.program)
  json += '}'

  return json
}

Constraint.from = function (constraintObject) {
  return new Constraint(constraintObject.name, constraintObject.program)
}

function Privilege (action, resourceKind) {
  this.action = action
  this.resourceKind = resourceKind
  this.target = Broon.toTarget(action, resourceKind)
  this.constraints = {}
}

Privilege.prototype.registerConstraint = function (constraint) {
  this.constraints[constraint.name] = constraint
  return this
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
  var json = '{"target":' + stringJson(this.target) + ','
  json += '"action":' + stringJson(this.action) + ','
  json += '"resourceKind":' + stringJson(this.resourceKind) + ','

  json += '"constraints":{'
  json += objectJson(this.constraints)
  json += '}}'

  return json
}

Privilege.from = function (privilegeObject) {
  var privilege = new Privilege(privilegeObject.action, privilegeObject.resourceKind)

  for (var id in privilegeObject.constraints) {
    privilege.registerConstraint(Constraint.from.call(this, privilegeObject.constraints[id]))
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
