'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (param) {
    var t = param.types,
        template = param.template,
        traverse = param.traverse;


    function getPropertyFromMemberExpression(node) {
        // We are looking for MemberExpressions, which have two distinct incarnations:
        // 1. we have a computed MemberExpression like a[b], with the property being an Expression
        // 2. a non-computed MemberExpression like a.b, with the property being an Identifier
        return node.computed ?
        // We can easily deal with the first case by replacing the MemberExpression with a call
        node.property :
        // In the second case, we introduce a StringLiteral matching the Identifier
        t.stringLiteral(node.property.name);
    }

    return {
        visitor: {
            Program: {
                enter: function enter(path, state) {
                    function getIdentifierForExplicitScopeObject(parentWithScope) {
                        var bindings = parentWithScope.scope.bindings;
                        var scopeName = Object.keys(bindings).find(function (key) {
                            return bindings[key].path && bindings[key].path.node && bindings[key].path.node.id && bindings[key].path.node.id[FLAG_GENERATED_SCOPE_OBJECT]; // should actually be IS_EXPLICIT_SCOPE_OBJECT
                        });

                        var uniqueIdentifier = void 0;
                        if (scopeName) {
                            uniqueIdentifier = t.identifier(scopeName);
                        } else {
                            uniqueIdentifier = parentWithScope.scope.generateUidIdentifier('scope');
                            uniqueIdentifier[FLAG_GENERATED_SCOPE_OBJECT] = true;

                            parentWithScope.scope.push({
                                kind: 'let',
                                id: uniqueIdentifier,
                                init: t.objectExpression([])
                            });
                        }
                        uniqueIdentifier[FLAG_SHOULD_NOT_REWRITE_IDENTIFIER] = true;
                        return uniqueIdentifier;
                    }

                    path.traverse({
                        LabeledStatement: function LabeledStatement(path) {
                            if (path.node.label.name !== 'always') {
                                return;
                            }

                            var getSolverInstance = template('let solver = Cassowary.ClSimplexSolver.getInstance();')();
                            var addConstraint = template('solver.addConstraint(linearEquation);')();
                            function getTemplateForName(name) {
                                return template('solver.getConstraintVariableFor(window, \'' + name + '\', () => {\n                                  let _constraintVar = new Cassowary.ClVariable(\'' + name + '\', ' + name + ');\n                                  aexpr(() => ' + name + ').onChange(val => _constraintVar.set_value(val));\n                                  aexpr(() => _constraintVar.value()).onChange(val => ' + name + ' = val);\n                                  return _constraintVar;\n                                })')();
                            }
                            // identify all referenced variables
                            var variables = new Set();
                            path.traverse({
                                Identifier: function Identifier(path) {
                                    if (path.node.name === 'always') {
                                        return;
                                    }
                                    variables.add(path.node.name);
                                }
                            });
                            console.log(variables);

                            var constraintVariableConstructors = [];
                            var constraintVarsByVariables = new Map();

                            variables.forEach(function (val) {
                                console.log(val);
                                var identifier = path.scope.generateUidIdentifier('constraintVar_' + val);
                                var constraintVariableConstructor = t.variableDeclaration('let', [t.variableDeclarator(identifier, getTemplateForName(val).expression)]);
                                constraintVariableConstructors.push(constraintVariableConstructor);
                                constraintVarsByVariables.set(val, identifier);
                            });

                            function buildLinearEquation(node) {
                                if (t.isExpressionStatement(node)) {
                                    return buildLinearEquation(node.expression);
                                }
                                if (t.isBinaryExpression(node)) {
                                    if (['==', '===', '>='].indexOf(node.operator) >= 0) {
                                        return t.callExpression(t.memberExpression(buildLinearEquation(node.left), t.identifier('cnEquals')), [buildLinearEquation(node.right)]);
                                    } else if (['+'].indexOf(node.operator) >= 0) {
                                        return t.callExpression(t.memberExpression(buildLinearEquation(node.left), t.identifier('plus')), [buildLinearEquation(node.right)]);
                                    } else if (['*'].indexOf(node.operator) >= 0) {
                                        var left = t.isIdentifier(node.left) ? node.left : node.right;
                                        var right = t.isIdentifier(node.right) ? node.left : node.right;
                                        return t.callExpression(t.memberExpression(buildLinearEquation(left), t.identifier('times')), [buildLinearEquation(right)]);
                                    }
                                }
                                if (t.isIdentifier(node)) {
                                    return constraintVarsByVariables.get(node.name);
                                }
                                if (t.isNumericLiteral(node)) {
                                    return t.numericLiteral(node.value);
                                }
                                throw new Error('unknown type in always statement: ' + node.type);
                            }

                            var linearEquationConstruction = t.variableDeclaration('let', [t.variableDeclarator(t.identifier('linearEquation'), buildLinearEquation(path.node.body))]);

                            console.log(path.get('body').get('expression'));
                            function convertIntoObservable(node) {
                                if (t.isIdentifier(node)) {
                                    return t.callExpression(t.memberExpression(constraintVarsByVariables.get(node.name), t.identifier('value')), []);
                                }
                                if (t.isBinaryExpression(node)) {
                                    return t.binaryExpression(node.operator, convertIntoObservable(node.left), convertIntoObservable(node.right));
                                }
                                return node;
                            }
                            var triggerStatement = t.expressionStatement(t.callExpression(t.memberExpression(t.callExpression(t.identifier('trigger'), [t.callExpression(t.identifier('aexpr'), [t.arrowFunctionExpression([], convertIntoObservable(path.node.body.expression))])]), t.identifier('onBecomeFalse')), [t.arrowFunctionExpression([], template('solver.solveConstraints()')().expression)]));

                            path.replaceWith(t.blockStatement([getSolverInstance].concat(constraintVariableConstructors, [linearEquationConstruction, addConstraint, triggerStatement])));
                        }
                    });
                }
            }
        }
    };
};

var FLAG_GENERATED_SCOPE_OBJECT = Symbol('FLAG: generated scope object');
var FLAG_SHOULD_NOT_REWRITE_IDENTIFIER = Symbol('FLAG: should not rewrite identifier');