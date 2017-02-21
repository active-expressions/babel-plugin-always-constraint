let _scope = {};
var a = 3,
    b = 2;

{
    let _scope2 = {};

    let c = 4;
    {
        let solver = Cassowary.ClSimplexSolver.getInstance();

        let _constraintVar_a = solver.getConstraintVariableFor(_scope, "a", () => {
            let _constraintVar = new Cassowary.ClVariable("a", a);

            aexpr(() => a).onChange(val => _constraintVar.set_value(val));
            aexpr(() => _constraintVar.value()).onChange(val => a = val);
            return _constraintVar;
        });

        let _constraintVar_b = solver.getConstraintVariableFor(_scope, "b", () => {
            let _constraintVar = new Cassowary.ClVariable("b", b);

            aexpr(() => b).onChange(val => _constraintVar.set_value(val));
            aexpr(() => _constraintVar.value()).onChange(val => b = val);
            return _constraintVar;
        });

        let _constraintVar_c = solver.getConstraintVariableFor(_scope2, "c", () => {
            let _constraintVar = new Cassowary.ClVariable("c", c);

            aexpr(() => c).onChange(val => _constraintVar.set_value(val));
            aexpr(() => _constraintVar.value()).onChange(val => c = val);
            return _constraintVar;
        });

        let linearEquation = _constraintVar_a.times(2).cnEquals(_constraintVar_b.plus(_constraintVar_c));

        solver.addConstraint(linearEquation);
        trigger(aexpr(() => 2 * _constraintVar_a.value() == _constraintVar_b.value() + _constraintVar_c.value())).onBecomeFalse(() => solver.solveConstraints());
    }
}