const test = require('ava')

const { broon } = require('../src/broon')

test('broon exports', t => {
  broon ? t.pass() : t.fail()
})
