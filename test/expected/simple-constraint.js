var a = 3,
    b = 2;

{
  let solver = Cassowary.ClSimplexSolver.getInstance();

  let _constraintVar_a = solver.getConstraintVariableFor(window, 'a', () => {
    let _constraintVar = new Cassowary.ClVariable('a', a);

    aexpr(() => a).onChange(val => _constraintVar.set_value(val));
    aexpr(() => _constraintVar.value()).onChange(val => a = val);
    return _constraintVar;
  });

  let _constraintVar_b = solver.getConstraintVariableFor(window, 'b', () => {
    let _constraintVar = new Cassowary.ClVariable('b', b);

    aexpr(() => b).onChange(val => _constraintVar.set_value(val));
    aexpr(() => _constraintVar.value()).onChange(val => b = val);
    return _constraintVar;
  });

  let linearEquation = _constraintVar_a.times(2).cnEquals(_constraintVar_b);

  solver.addConstraint(linearEquation);
  trigger(aexpr(() => 2 * _constraintVar_a.value() == _constraintVar_b.value())).onBecomeFalse(() => solver.solveConstraints());
}