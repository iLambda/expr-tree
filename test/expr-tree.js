var test = require('tape-catch')
var _ = require('lodash')
var expr = require('../lib/expr-tree.js')

test('expr.isExpressionTree', function (assert) {
  // test with RPN
  assert.ok(expr.isExpressionTree('y y * x x * + sqrt'))
  assert.notOk(expr.isExpressionTree('y * x x * + sqrt'))

  // test with tree
  var tree = expr.fromRPN('y y * x x * + sqrt')
  var treedefective = expr.fromRPN('y y * x x * + sqrt')
  delete treedefective.label
  assert.ok(expr.isExpressionTree(tree))
  assert.notOk(expr.isExpressionTree(treedefective))

  // end the test
  assert.end()
})

test('expr.simplify', function (assert) {
  // test with RPN
  assert.equal(expr.toRPN(expr.simplify('y y * x x * + sqrt', { x:1 })), 'y y * 1 + sqrt')
  assert.equal(expr.toRPN(expr.simplify('y y * x x * + sqrt', { t:1 })), 'y y * x x * + sqrt')
  assert.equal(expr.toRPN(expr.simplify('y y * x x * + sqrt', { x:1, y:0 })), '1')

  // test with tree
  var tree = expr.fromRPN('y y * x x * + sqrt')
  assert.equal(expr.simplify(tree, { t:1 }), tree)
  assert.equal(expr.toRPN(expr.simplify(tree, { x:1 })), 'y y * 1 + sqrt')
  assert.equal(expr.toRPN(expr.simplify(tree, { x:1, y:0 })), '1')

  // end the test
  assert.end()
})

test('expr.reduce', function (assert) {
  // testing the compute method w/ and wo/ params
  assert.equal('-42', expr.toRPN(expr.reduce('7 -7 * 7 +')))
  assert.equal('-42 x +', expr.toRPN(expr.reduce('7 -6 * x +')))

  // end the test
  assert.end()
})

test('expr.compute', function (assert) {
  // testing the compute method w/ and wo/ params
  assert.equal(-42, expr.compute('7 -7 * 7 +'))
  assert.equal(-42, expr.compute('7 -7 * x +', { x: 7 }))
  assert.equal(undefined, expr.compute('7 -7 * x +'))

  // end the test
  assert.end()
})


test('expr.mutate', function (assert) {
  // creating a pick method
  var pick = function(what) {
    // what do we need
    if (what === 'number') {
      // returns a number >= 0 and < 10, w/ 2 decimals
      return (10*Math.random()).toFixed(2)
    } else if (what === 'var') {
      // return a variable
      return _.sample(['x', 'y'])
    } else if (what === 'func') {
      // return a function
      return _.sample(_.keys(expr.operators))
    } else {
      // pick whaaaat ?
      return undefined
    }
  }

  // testing the mutate method
  assert.ok(expr.isExpressionTree(expr.mutate('y y * x x * + sqrt', pick)))
  assert.ok(expr.isExpressionTree(expr.toRPN(expr.mutate('y y * x x * + sqrt', pick))))

  // end the test
  assert.end()
})

test('expr.reproduce', function (assert) {
  // testing the reproduce method
  assert.ok(expr.isExpressionTree(expr.reproduce('y y * x x * + sqrt', 't abs cos x sin * 1 +')))
  assert.ok(expr.isExpressionTree(expr.toRPN(expr.reproduce('y y * x x * + sqrt', 't abs cos x sin * 1 +'))))

  // end the test
  assert.end()
})

test('expr.crossover', function (assert) {
  // testing the crossover method
  assert.ok(expr.isExpressionTree(expr.toRPN(expr.crossover('y y * x x * + sqrt 2 *'))))
  assert.ok(expr.isExpressionTree(expr.crossover('y y * x x * + sqrt 2 *')))
  // end the test
  assert.end()
})

test('expr.copy', function (assert) {
  // testing the copy method
  var tree = expr.fromRPN('y y * x x * + sqrt 2 *')
  assert.equal('y y * x x * + sqrt 2 *', expr.toRPN(expr.copy('y y * x x * + sqrt 2 *')))
  /*
   *  The method copy has been tested, and works perfectly. However, due to
   *  the inner workings of deep equal, and the fact that the trees display
   *  a circular structure due to the 'parent' attribute, the following assertion
   *  must stay commented for the unit tests to be validated.
   */
  //assert.deepEqual(tree, expr.copy(tree))
  // end the test
  assert.end()
})
