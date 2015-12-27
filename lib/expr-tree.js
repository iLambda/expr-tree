var _ = require('lodash')
var t = require('t')

module.exports = {
  operators: {
    '-': { js: '(({0})-({1}))', n:2 },
    '*': { js: '(({0})*({1}))', n:2 },
    '+': { js: '(({0})+({1}))', n:2 },
    '%': { js: '(({0})%({1}))', n:2 },
    'abs': { js: 'Math.abs({0})', n:1 },
    'floor': { js: 'Math.floor({0})', n:1 },
    'min': { js: 'Math.min({0},{1})', n:2 },
    'max': { js: 'Math.max({0}, {1})', n:2 },
    'sqrt': { js: 'Math.sqrt({0})', n:1 },
    'cbrt': { js: 'math.cbrt({0})', n:1 },
    'cos': { js: 'Math.cos({0})', n:1 },
    'sin': { js: 'Math.sin({0})', n:1 },
    'tan': { js: 'Math.tan({0})', n:1 },
    'atan2': { js: 'Math.atan2({0},{1})', n:2 }
  },

  // check if object is a valid expression tree
  isExpressionTree: function(expr) {
    if (_.isString(expr)) {
      return this.fromRPN(expr) ? true : false
    } else {
      return expr
          && (_.isString(expr.label) || _.isNumber(expr.label))
          && _.isString(expr.type)
          && _.isArray(expr.children)
          && _.all(expr.children, function(sub) { return sub.parent == expr && this.isExpressionTree(sub) }, this)
    }
  },

  // simplifies a tree, given some vars
  simplify: function(expr, vars) {
    // default expr
    expr = _.isString(expr) ? this.fromRPN(expr) : expr
    // the expr is null
    if (!expr) {
      return undefined
    }

    // we can only reduce if we are a function (=node)
    if (expr.type == 'func') {
      // first, reduce all children
      expr.children = _.map(expr.children, function(item) { return this.simplify(item, vars) }, this)
      // if all children are now numbers
      if (_.all(expr.children, _.matchesProperty('type', 'number'))) {
        // format the calc
        var js = this.operators[expr.label].js
        _.forEach(expr.children, function(item, key) {
          js = js.replace(new RegExp('\\{' + key + '\\}', 'g'), item.label.toString())
        })

        // this node is gonna be a number
        expr.type = 'number'
        expr.label = new Function('return (' + js + ')')()
        _.forEach(expr.children, function(i) { delete i.parent })
        expr.children = []
      }
    } else if (expr.type == 'var') {
      // if the var is in the object and is a number
      if (vars && _.has(vars, expr.label) && _.isNumber(vars[expr.label])) {
        expr.type = 'number'
        expr.label = vars[expr.label]
      }
    }

    // return tree
    return expr
  },

  // reduces the constants of a tree
  reduce: function(expr) {
    return this.simplify(expr)
  },

  // compute the value of a tree
  compute: function(expr, vars) {
    // default args
    expr = _.isString(expr) ? this.fromRPN(expr) : expr
    // the expr is null
    if (!expr) {
      return undefined
    }

    // are all vars there ?
    var exprvars = true
    // iterate through the tree
    t.bfs(expr, function (subexpr) {
      if (subexpr.type == 'var') {
        exprvars = exprvars
                   && _.has(vars, subexpr.label)
                   && _.isNumber(vars[subexpr.label])
      }
    })
    // if all vars are there
    if (exprvars) {
      return this.simplify(expr, vars).label
    } else {
      return undefined
    }
  },


  // mutates an expression. pick is a function.
  mutate: function(expr, pick) {
    // if pick is not a function
    if (!_.isFunction(pick)) {
      return undefined
    }
    // default args
    expr = _.isString(expr) ? this.fromRPN(expr) : expr
    // the expr is null
    if (!expr) {
      return undefined
    }
    // pick a random node
    var i = 0, selected
    // we proceed to a reservoir sampling
    t.bfs(expr, function(node) {
      selected = _.random(0, i++) == 0 ? node : selected
    })
    // find a fitting replacement
    selected.label = selected.type != 'func'
                      ? pick(_.sample(['number', 'var']))
                      : _.sample(_.filter(_.keys(this.operators), function (item) {
                          return this.operators[item].n == this.operators[selected.label].n
                        }, this))
    // return the expr
    return expr
  },

  // genetically reproduce two expressions.
  // the sup is the base tree used to build the child
  // the sub is the tree that will give a subtree to build the child
  reproduce: function(sup, sub) {
    // convert exp (copy is intrinsically made)
    sup = _.isString(sup) ? this.fromRPN(sup) : this.copy(sup)
    sub = _.isString(sub) ? this.fromRPN(sub) : sub
    // the expr is null
    if (!sup || !sub) {
      return undefined
    }

    // pick a random node
    var i = 0, j = 0, pivot, given
    // we proceed to a reservoir sampling of fitting nodes
    t.bfs(sup, function(node, parent) {
      if (parent) {
        pivot = this.random(0, i++) === 0 ? node : pivot
      }
    }, _)
    t.bfs(sub, function(node, parent) {
      given = this.random(0, j++) === 0 ? node : given
    }, _)
    // if we got good candidates
    if (pivot && given) {
      var transferred = this.copy(given)
      var pivotid = pivot.parent.children.indexOf(pivot)
      pivot.parent.children[pivotid] = transferred
      transferred.parent = pivot
    }
    // return the result
    return sup
  },

  // permutes two subtrees
  crossover: function(expr) {
    // convert expr
    expr = _.isString(expr) ? this.fromRPN(expr) : expr
    // the expr is null
    if (!expr) {
      return undefined
    }

    // determine if a node is parent of another
    var isancestor = function(node, parent) {
      return node ? (node === parent || isancestor(node.parent, parent)) : false
    }

    // pick a random node
    var i = 0, j = 0, a, b
    // we proceed to a reservoir sampling of fitting nodes
    t.bfs(expr, function(node, parent) {
      if (parent && parent != expr) {
        a = _.random(0, i++) === 0 ? node : a
      }
    })
    t.bfs(expr, function(node, parent) {
      if (parent && !isancestor(node, a) && !isancestor(a, node)) {
        b = _.random(0, j++) === 0 ? node : b
      }
    })

    // if we got good candidates
    if (a && b) {
      var ida = a.parent.children.indexOf(a)
      var idb = b.parent.children.indexOf(b)
      var parenta = a.parent, parentb = b.parent

      parenta.children[ida] = b
      parentb.children[idb] = a
      a.parent = parentb
      b.parent = parenta
    }
    // return the result
    return expr
  },

  // copies a tree
  copy: function(expr) {
    // if we are given a string
    if (_.isString(expr)) {
      return this.fromRPN(expr)
    }

    // the expr is null
    if (!expr) {
      return undefined
    }
    // if this is a func (node)
    if (expr.type == 'func') {
      // we create the node
      var children = []
      var node = {
        type: expr.type,
        label: expr.label,
        children: []
      }
      // copy the children
      _.forEach(expr.children, function (sub) {
        var copy = this.copy(sub)
        // don't forget to assign the parent
        copy.parent = node
        // add the copy
        node.children.push(copy)
      }, this)

      // finally return the node
      return node
    } else {
      // we return the simple label
      return {
        type: expr.type,
        label: expr.label,
        children: []
      }
    }
  },

  // creates a tree from RPN
  fromRPN: function(rpn) {
    // the rpn is null
    if (!rpn || !_.isString(rpn)) {
      return undefined
    }
    // split expression
    var expr = rpn.trim().split(/\s+/)
    // create the stack
    var stack = []
    // loop thru tokens
    for (var i = 0; i < expr.length; i++) {
      // test the type
      if (this.operators[expr[i]]) {
        // create the argument list
        var operation = this.operators[expr[i]]
        var node = {
          type: 'func',
          label: expr[i],
          children: []
        }
        // get all the arguments
        for (var j = 0; j < operation.n; j++) {
          var child = stack.pop()
          // if no arguments, the rpn is not valid
          if (!child) {
            return undefined
          }
          // else, it's all right
          child.parent = node
          node.children.push(child)
        }
        // reverse the children (optional if all the functions are commutative. )
        node.children.reverse()
        // push the operation
        stack.push(node)
      } else {
        stack.push({
          type: !_.isNaN(parseFloat(expr[i])) ? 'number' : 'var',
          label:  !_.isNaN(parseFloat(expr[i])) ? parseFloat(expr[i]) : expr[i],
          children: []
        })
      }
    }

    return stack.length === 1 ? _.first(stack) : undefined
  },


  // convert the tree as a function
  toFunction: function(expr, args) {
    // defaulting expr
    expr = _.isString(expr) ? this.fromRPN(expr) : expr
    // the expr is null
    if (!expr) {
      return undefined
    }

    // getting the minimal list of args
    var minargs = []

    // creating a recursive method
    var express = function(expr, operations) {
      // if we deal with a function
      if (expr.type == 'func') {
        // we compute expressions for the children
        var exp = _.map(expr.children, function(i) { return express(i, operations) })
        var js = operations[expr.label].js

        // we format the label
        _.forEach(exp, function(item, key) {
          js = js.replace(new RegExp('\\{' + key + '\\}', 'g'), item)
        })

        // we return the formatted label
        return js
      } else {
        // if we meet a var we list it in the future list of args
        if (expr.type == 'var') {
          minargs.push(expr.label)
        }
        // return the label
        return expr.label
      }
    }

    // args
    args = _.union(args, minargs).sort()
    // getting the expr
    var infix = express(expr, this.operators)
    return new Function(args, 'return ' + infix)
  },

  // converts the tree to RPN
  toRPN: function(expr) {
    // the expr is null
    if (!expr) {
      return undefined
    }
    // recursive function
    if (expr.type === 'func') {
      return _.map(expr.children, function (i) { return this.toRPN(i) }, this).join(' ') + ' ' + expr.label
    } else {
      return expr.label.toString()
    }
  },
}
