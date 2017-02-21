var a = 3, b = 2, obj = { prop: 42 };

{
    let c = 4;
    always: 2 * a + obj.prop == b + c;
}