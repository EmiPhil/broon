const test = require('ava')

const { brood } = require('../src/brood')

test('brood exports', t => {
  brood ? t.pass() : t.fail()
})
