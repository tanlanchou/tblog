
### 01. this 指向

首先都知道的, function 中 this 指向基于调用者, 谁调用你 this 指向谁.

```js
function a() {
    this.a = 1;
    b();
}

function b() {
    this.b = 2;
    console.log(a);
    c()
}

function c() {
    this.c = 3;
    console.log(a);
    console.log(b);
}

a();
```

做一个最简单的测试, 输出

```
1
1
2
```

可以看到 a 函数中 this 指向了 window, 然后 b 函数中 this 指向了 a 函数, 然后 c 函数中 this 指向了 b 函数.

### 02. 箭头函数

箭头函数的 this 指向定义时所在的对象, 而不是执行时所在的对象, 他是最特殊的

```

```