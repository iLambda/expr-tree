# expr-tree
expr-tree is an expression tree system for node.js. This library provides methods to parse reverse polish notation (RPN) and useful functions to work with expression trees.

## install
```sh
$ npm install expr-tree --save
```

## example
```js
var expr = require('expr-tree')

expr.compute('5 7 * 7 +') // == 42
expr.toFunction('x y +')(10, 10) // == 20

```

## api

The tree structure allow for the use of [t-js](https://github.com/aaronj1335/t-js).
An expression tree node has the following structure :

```js
var tree = {
  label: '...',                // string (contains the token used in RPN)
  type: 'func|var|number',     // string (depends on the type of the node/leaf)
  parent: parent,              // tree (can be undefined if tree is root)
  children: [child1, ...]      // array of trees
}
```

All the methods dealing with expressions contained in this library can take interchangeably a tree or the reverse polish notation (RPN) of an expression tree. They always output a tree : if you want a method to output RPN, wrap your calls inside *expr.toRPN(tree)*.
The following methods are available:

#### fromRPN
```js
var tree = expr.fromRPN(rpn)
```
Returns the expression tree described by the given reverse polish notation (RPN).

The complexity is O(n), with n the number of tokens in the RPN.

#### toRPN
```js
var rpn = expr.toRPN(tree)
```
Returns the RPN describing the given expression tree

The complexity is O(n), with n the number of nodes/leaves in the tree.

#### toFunction
```js
var func = expr.toFunction(expression, args)
```
Returns the function represented by the given expression.
_args_ must be an array of expression variables names.
If _args_ is null or unspecified, the function will only take the minimal number of
arguments it needs to compute the expression, sorted by lexicographical order.
If _args_ is not null, the function will take the minimal number of arguments
it needs to compute the expression, plus the ones specified in args

The complexity is O(n), with n the number of nodes/leaves in the tree, or the number of tokens in the RPN.


#### isExpressionTree
```js
expr.isExpressionTree(expression)
```
Returns true if the expression is a valid RPN or a valid tree.

The complexity is O(n), with n the number of nodes/leaves in the tree, or the number of tokens in the RPN.


#### simplify
```js
var tree = expr.simplify(expression, vars)
```
Simplify an expression by replacing some of the variables inside by their value.
The value of the variable *varname* in the expression is given by *vars[varname]*.

The complexity is O(n), with n the number of nodes/leaves in the tree, or the number of tokens in the RPN


#### reduce
```js
var tree = expr.reduce(expression)
```
Simplify an expression by computing all the constants.
For instance, '7 6 \* x +' will be reduced to '42 x +'.

This function will always return a tree. To compute the result of an expression given all
 its variables, see _expr.compute(expression, vars)_

The complexity is O(n), with n the number of nodes/leaves in the tree, or the number of tokens in the RPN


#### compute
```js
var tree = expr.compute(expression, vars)
```
Simplify an expression by computing all the constants.
For instance, '7 5 \* 7 +' will be reduced to '42'.

 **Warning** : This function will always return a tree. To compute the result of an expression given all
 its variables, see _expr.compute(expression, vars)_

The complexity is O(n), with n the number of nodes/leaves in the tree, or the number of tokens in the RPN


#### copy
```js
var tree = expr.copy(expression)
```
Returns a deep copy of the expression.

The complexity is O(n), with n the number of nodes/leaves in the tree, or the number of tokens in the RPN


#### mutate
```js
var tree = expr.mutate(expression, pick)
```
Mutate an expression by randomly changing one node/leaf label. This function is mainly used in genetic algorithms.
You must provide as an argument a _pick_ function, according to the following :
  * pick must take a _String_ as its first argument
  * pick must return a number of your choosing if its first argument equals 'number'
  * pick must return a variable name of your choosing if its first argument equals 'var'

The complexity is O(n), with n the number of nodes/leaves in the tree, or the number of tokens in the RPN


#### reproduce
```js
var tree = expr.reproduce(sup, sub) // sup and sub can be trees or RPN
```
Returns a duplicate of sup, with one of its subtrees randomly swapped with a subtree from sub.
This function is mainly used in genetic algorithms.

The complexity is O(n+m), with n (respectively m) the number of nodes/leaves in sup (resp. sub)


#### crossover
```js
var tree = expr.crossover(expression)
```
Returns a duplicate of the expression, with two of its subtrees swapped

The complexity is O(n), with n the number of nodes/leaves in the tree, or the number of tokens in the RPN





## release History

* 0.1.0 Initial release

## license
[MIT](http://opensource.org/licenses/MIT)
