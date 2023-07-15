---
title: Javascript Array
date: 2023-07-12 15:30:01
tags: 
    - web
    - javascript
    - array
---

重新复习一下

### 1. 构造函数

> Array() 构造函数用于创建 Array 对象。
> 
> 调用 Array() 时可以使用或不使用 new。两者都会创建一个新的 Array 实例。

**elementN**

```javascript
Array(1,2,3,4) //[1,2,3,4]
```

**arrayLength**

```
> Array(5) //[undefined,undefined,undefined]undefined,undefined
```

### 2. Array[@@species]

```javascript
Array[Symbol.species]
```

`Symbol.specie` 

> species 访问器属性允许子类覆盖对象的默认构造函数。

```javascript
class Array1 extends Array {
  static get [Symbol.species]() { return Array; }
}

const a = new Array1(1, 2, 3);
const mapped = a.map(x => x * x);

console.log(mapped instanceof Array1);
// Expected output: false

console.log(mapped instanceof Array);
// Expected output: true
```

### 3. Array.prototype[@@unscopables]

```javascript
Array.prototype[@@unscopables]
```

其实也就是 `Symbol.unscopables`, 

> Symbol.unscopables 属性通常在对象的原型链上定义，用于控制在作用域绑定中应该被忽略的属性。如果一个对象的属性名存在于 Symbol.unscopables 属性中，那么在使用 with 语句时，该属性将被忽略，不会被当作局部变量引入。

也就是定义哪些 with 中无法使用，这个可以忽略，因为 with 是一种问题很大的写法。

> 可读性和维护性差：with 语句可以引入额外的作用域绑定，从而导致代码的可读性下降。在一个较大的代码块中，难以准确判断变量的来源，增加了代码的维护难度。
> 
> 作用域泄漏：with 语句会将对象添加到作用域链的前端，这可能导致意外的变量声明。如果在 with 语句内部使用了未声明的变量，该变量会被添加到全局作用域中，可能引发命名冲突或意外的行为。
> 
> 性能问题：with 语句会影响代码的性能。由于引入额外的作用域绑定，JavaScript 引擎在查找变量时需要遍历更长的作用域链，导致代码执行速度变慢。
> 
> 不安全的属性访问：使用 with 语句可以直接访问对象的属性，但如果属性不存在，会自动将其认为是全局变量。这种隐式的属性访问会使代码更加脆弱，容易出现错误。
> 
> 严格模式不支持：with 语句在严格模式下是被禁止的，如果你的代码要求使用严格模式，就不能使用 with 语句。

所以都别用。

### 4. length

> length 是 Array 的实例属性，表示该数组中元素的个数。该值是一个无符号 32 位整数，并且其数值总是大于数组最大索引。

一般使用的话，会直接返回数组的长度, 可以判断长度，遍历等操作。

值得注意的是 length 是可写的，它可以做几件事。

```javascript
let arr = [];
arr.length = 200; //[undefined * 200]

let arr1 = [1,2,3,4];
arr1.length = 3; //[1,2,3]
```

写 length 可以做到，裁减 arr，可以创建数组。

### 5. Array.prototype[@@iterator]()

`Symbol.iterator` 

> Symbol.iterator 是 JavaScript 中的一个内置符号（Symbol），它用于定义一个对象的默认迭代器方法。

```javascript
const myObject = {
  data: [1, 2, 3, 4, 5],
  [Symbol.iterator]() {
    let index = 0;
    const data = this.data;

    return {
      next() {
        if (index < data.length) {
          return {
            value: data[index++],
            done: false
          };
        } else {
          return {
            done: true
          };
        }
      }
    };
  }
};
```

就可以支持 `for of` 循环。

### 6. at

> at() 方法接收一个整数值并返回该索引对应的元素，允许正数和负数。负整数从数组中的最后一个元素开始倒数。

正常情况下，正整数去使用的话和直接 `array[index]` 是没有区别的.

```javascript
let o = [1,2,3,4,5];
o[0] //1;
o.at(0) //1;
```

但是有些不一样

```javascript
let o = [1,2,3,4,5];
o[o.length - 1] //5;
o.at(-1) //5;
```

他会简化操作。

### 7. concat

> concat() 方法用于合并两个或多个数组。此方法不会更改现有数组，而是返回一个新数组。

```javascript
Array.prototype.concat(...item);
```

就是合并，不会去重，并且是浅拷贝

```javascript
const num1 = [[1]];
const num2 = [2, [3]];

const numbers = num1.concat(num2);

console.log(numbers);
// [[1], 2, [3]]

// 修改 num1 的第一个元素
num1[0].push(4);

console.log(numbers);
// [[1, 4], 2, [3]]
```

还有就是 **Symbol.isConcatSpreadable**

> 内置的**Symbol.isConcatSpreadable**符号用于配置某对象作为Array.prototype.concat()方法的参数时是否展开其数组元素。

```javascript
let arr = [1,2,3,4,5];
let arr1 = [6,7,8]
arr[Symbol.isConcatSpreadable] = false;
arr.concat(arr1); //[[1, 2, 3, 4, 5], 6,7,8]
```

会改变默认行为.

如果是 Array-like, 就会直接支持 `concat`

```javascript
const obj2 = { 0: 1, 1: 2, 2: 3, length: 3, [Symbol.isConcatSpreadable]: true };
const arr = [5,6,7,8];
arr.concat(obj2) //[1,2,3,5,6,7,8]
```

### 8. copyWithin

```javascript
copyWithin(target)
copyWithin(target, start)
copyWithin(target, start, end)
```

> copyWithin 是数组的一个方法，用于将数组中的一部分元素复制到数组的指定位置。它修改原始数组，不会创建新的数组副本。

简单的方法却有很多东西.

* 所有参数都支持负数， 如果 param < 0，则实际是 param + array.length。
* 所有参数都会转为整数, 如果不是整数，比如是 `abcd` 之类的，会被转为 0
* 如果 param < -arr.length, 使用 0
* 如果 (target or start) >= arr.length, 不会拷贝 
* 如果 省略end 或者 end >= arr.length, 末尾所有元素都被复制。
* 如果 如果 end 位于 start 之前，则不会拷贝任何内容。
* end 如果 end 位于 start 之前，则不会拷贝任何内容。

对于参数来说他实在是太能兼容了，真的不太想用这个方法。

### 9. Array.prototype.entries()

> entries() 方法返回一个新的数组迭代器 (en-US)对象，该对象包含数组中每个索引的键/值对。

首先需要知道什么是迭代器, 是实现了一个迭代器协议

https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Iteration_protocols#%E8%BF%AD%E4%BB%A3%E5%99%A8%E5%8D%8F%E8%AE%AE

协议是上面那个链接

需要实现 next 方法，并且返回 IteratorResult接口对象。

接口包含 

```
{
	done: boolean,
	value: string
}
```

相当于返回一个这样的接口对象。

### 10. Array.prototype.every()

> every() 方法测试一个数组内的所有元素是否都能通过指定函数的测试。它返回一个布尔值。

```js
arr.every(callbackFn, arg);
```

callbackFn 表示回调， arg表示 this 指向，可选。

every 会遍历所有的数组元素，如果 callbackFn 中返回假值，会立刻停止遍历，并且返回 false.

唯一需要注意的是，every 不会遍历稀疏数组中的空, 这里是我之前不知道的一个概念

```
[1, undefined, 1].every(v => v === 1) //false
[1, , 1].every(v => v === 1) //true
```

[1,,1]是稀疏数组，但是[1, undefined, 1]不是。

### 11. Array.prototype.fill()

```js
fill(value)
fill(value, start)
fill(value, start, end)
```

功能很简单，就是填充数组。

```js
Array(5).fill(0) // [0, 0, 0, 0, 0]
```

主要再 start 和 end, 和 copyWithin 一样。

* 所有参数，基于零的索引，从此开始填充，转换为整数。
* 如果 start 为空，就全部填充， 如果 start 不为空， end为空，那么从start开始填充，直到末尾。
* 如果 参数 < -array.length 或 参数 被省略，则使用 0。
* 如果 start >= array.length

需要注意的是，不管是 every 还是 fill， end值都不是通过 start 计算，而是独立计算。

### 12. Array.prototype.filter()

很常用的方法

```js
filter(callbackFn)
filter(callbackFn, thisArg)
callbackFn(element, index, array)
```

thisArg 是替换 callbackFn 中 this 指向。

返回数组，不过是浅拷贝,同样会出现稀疏数组的问题，会跳过。

### 13. Array.prototype.find, Array.prototype.findIndex, Array.prototype.findLast, Array.prototype.findLastIndex

```js
find(callbackFn);
find(callbackFn, thisArg);
callbackFn(element, index. arr);
```

find 和之前看过的 every, filter 不一样，是能够访问稀疏数组的，也就是为 undefined.

find 升序迭代数组。返回true, 返回当前 index 的 item.
其他总体类似，只是顺序和返回值差别。

### 14. Array.prototype.flat

> flat() 方法创建一个新的数组，并根据指定深度递归地将所有子数组元素拼接到新的数组中。

简单说就是，将多维数组简化成更低维度的数组，不一定是一维数组，需要注意的是返回的是浅拷贝。

```js
flat()
flat(depth)
```

> 指定要提取嵌套数组的结构深度，默认值为 1。

东西比较简单，一个简单例子


```
//flat
console.log(`---------------flat start---------------`);
const flatTest1 = [1, 2, 3, 4, [5, 6, [7, 8, [9, 10, [11, 12]]]]];
console.log("empty flatTest1:", flatTest1.flat());
console.log(`1 flatTest1:`, flatTest1.flat(1));
console.log(`2 flatTest1:`, flatTest1.flat(2));
console.log(`3 flatTest1`, flatTest1.flat(3));
console.log(`4 flatTest1`, flatTest1.flat(4));
console.log("Infinity flatTest1", flatTest1.flat(Infinity));

const flatTest2 = [
1,
2,
,
3,
4,
[5, , 6, [7, , 8, [9, , 10, [11, , 12]]]],
];
console.log("empty flatTest2:", flatTest2.flat());
console.log(`1 flatTest2:`, flatTest2.flat(1));
console.log(`2 flatTest2:`, flatTest2.flat(2));
console.log(`3 flatTest2`, flatTest2.flat(3));
console.log(`4 flatTest2`, flatTest2.flat(4));
console.log("Infinity flatTest2", flatTest2.flat(Infinity));
console.log(`---------------flat end---------------`);

index.html:13 ---------------flat start---------------
index.html:15 empty flatTest1: (7) [1, 2, 3, 4, 5, 6, Array(3)]
index.html:16 1 flatTest1: (7) [1, 2, 3, 4, 5, 6, Array(3)]
index.html:17 2 flatTest1: (9) [1, 2, 3, 4, 5, 6, 7, 8, Array(3)]
index.html:18 3 flatTest1 (11) [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, Array(2)]
index.html:19 4 flatTest1 (12) [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
index.html:20 Infinity flatTest1 (12) [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
index.html:30 empty flatTest2: (7) [1, 2, 3, 4, 5, 6, Array(4)]
index.html:31 1 flatTest2: (7) [1, 2, 3, 4, 5, 6, Array(4)]
index.html:32 2 flatTest2: (9) [1, 2, 3, 4, 5, 6, 7, 8, Array(4)]
index.html:33 3 flatTest2 (11) [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, Array(3)]0: 11: 22: 33: 44: 55: 66: 77: 88: 99: 1010: (3) [11, 空, 12]length: 11[[Prototype]]: Array(0)
index.html:34 4 flatTest2 (12) [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
index.html:35 Infinity flatTest2 (12) [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
index.html:36 ---------------flat end---------------
```

我这里测试了多维数组和稀疏数组的情况，基本可以说清楚了。

### 15. Array.prototype.flatMap

> flatMap() 方法对数组中的每个元素应用给定的回调函数，然后将结果展开一级，返回一个新数组。它等价于在调用 map() 方法后再调用深度为 1 的 flat() 方法（arr.map(...args).flat()），但比分别调用这两个方法稍微更高效一些。

```js
flatMap(callbackFn)
flatMap(callbackFn, thisArg)
```

简单说就是调用 Array.prototype.map 之后再调用 flat(1);

```
//flatMap
console.log(`---------------flatMap start---------------`);
const flatMapest1 = [1, 2, 3, 4, [5, 6, [7, 8, [9, 10, [11, 12]]]]];
console.log(`flatMapest1:`, flatMapest1.flatMap((n) => {
	console.log(n);
	return n;
}));
console.log(`---------------flatMap end---------------`);
```

一个很简单的例子，就说明情况了。

### 16. Array.prototype.forEach

常用的一种遍历方式，他有几个细节

```js
forEach(callbackFn)
forEach(callbackFn, thisArg)
```

1. 它按索引升序地为数组中的每个元素调用一次提供的 callbackFn 函数
2. 总是返回 undefined
3. 当调用 forEach() 时，callbackFn 不会访问超出数组初始长度的任何元素。
4. 已经访问过的索引的更改不会导致 callbackFn 再次调用它们。
5. 如果 callbackFn 更改了数组中已经存在但尚未访问的元素，则传递给 callbackFn 的值将是在访问该元素时的值。已经被删除的元素不会被访问。
6. 除了 throw error 不能中断 forEach
7. 不会访问稀疏数组

### 17. Array.from()

> 想要转换成数组的类数组或可迭代对象。

这个就是一个数组的静态方法，会返回一个新的数组实例。

这里需要知道什么是类数组，

* 索引：类数组对象使用数字索引来访问元素，就像数组一样。
* 长度：类数组对象具有 length 属性，表示它包含的元素数量。
* 迭代：类数组对象可以通过 for 循环或其他迭代方法进行遍历，就像遍历数组一样。
* 下标访问：类数组对象可以通过索引直接访问元素，例如 obj[0]。

还有就是可迭代对象，Symbol.iterator。

### 18. Array.fromAsync() 实验性质

我测试了一下，最新版本的 edge 是不支持的。

https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/fromAsync

详情看这个吧，不使用也是可以的，你先拿到在 Array.from.

### 19. Array.prototype.group() 实验性质

看名字就知道是一种数组的分组方法

```js
group(callbackFn)
group(callbackFn, thisArg)
```

下面是一个例子

```js
function myCallback({ quantity }) {
  return quantity > 5 ? "ok" : "restock";
}

const result2 = inventory.group(myCallback);

/* 结果是：
{
  restock: [
    { name: "asparagus", type: "vegetables", quantity: 5 },
    { name: "bananas", type: "fruit", quantity: 0 },
    { name: "cherries", type: "fruit", quantity: 5 }
  ],
  ok: [
    { name: "goat", type: "meat", quantity: 23 },
    { name: "fish", type: "meat", quantity: 22 }
  ]
}
*/
```

可以随意命名分组，在 callbackFn 中进行判断，根据返回值来命名组的名字。

需要值以的是，命名必须是 String or Symbol, 如果不是会被转为 String

### 20. Array.prototype.groupToMap() 实验性质

和 19 中， group 一样，只是返回值是一个 Map，那么 key 就灵活了。

### 21. Array.prototype.includes()

> includes() 方法用来判断一个数组是否包含一个指定的值，根据情况，如果包含则返回 true，否则返回 false。

```js
includes(searchElement)
includes(searchElement, fromIndex)
```

* fromIndex 可以支持负数，fromIndex + array.length， 
* 如果 fromIndex > array.length return false.
* 如果 fromIndex < -array.length fromIndex = 0

### 22. Array.prototype.indexOf()，Array.prototype.lastIndexOf()

其实 includes，find， indexOf 类似，只是 indexOf 是返回索引，也就是Index

```js
indexOf(searchElement)
indexOf(searchElement, fromIndex)
```

* fromIndex 可以支持负数，fromIndex + array.length， 
* 如果 fromIndex > array.length return -1.
* 如果 fromIndex < -array.length fromIndex = 0

那么lastIndexOf 差别就在于顺序，都知道 indexOf 是第一个出现就返回，那么 indexOf 是升序，lastIndexOf 是降序。

### 23. Array.isArray()

### 24. Array.prototype.join()

最常用的方法，没什么好讲的。

### 25. Array.prototype.keys()

> keys() 方法返回一个新的数组迭代器 (en-US)对象，其中包含数组中每个索引的键。

```js
const arr = ["a", , "c"];
const sparseKeys = Object.keys(arr);
const denseKeys = [...arr.keys()];
console.log(sparseKeys); // ['0', '2']
console.log(denseKeys); // [0, 1, 2]
```

差别就在稀疏数组。

### 26. Array.prototype.map()

> map() 方法创建一个新数组，这个新数组由原数组中的每个元素都调用一次提供的函数后的返回值组成。

```js
map(callbackFn)
map(callbackFn, thisArg)
callbackFn(element, index, arr)
```
其实就是根据现有数组，每次遍历调用 callbackFn 返回一个新数组。

好玩的是

```js
[1,,3].map(x => x + "1") //['11', undefined, '31'];
```

然而加上输出

```js
[1,,3].map(x => {
	console.log(x);
	return x + "1";
}) 

//1
//3
```

也就是不会遍历到，但是会输出..

### 27. Array.of

```js
Array.of()
Array.of(element0)
Array.of(element0, element1)
Array.of(element0, element1, /* … ,*/ elementN)
```

唯一的差别

```js
Array.of(7); // [7]
Array(7); // 由 7 个空槽组成的数组
```

### 28. Array.prototype.pop(), Array.prototype.shift(), Array.prototype.unshift()，Array.prototype.push()

pop 删除最后一个值，并且返回值。

push 方法将指定的元素添加到数组的末尾，并返回新的数组长度。

shift 删除最新的值，并且返回值

unshift 方法将指定元素添加到数组的开头，并返回数组的新长度。


### 29. Array.prototype.reduce()，Array.prototype.reduceRight()

> reduce() 方法对数组中的每个元素按序执行一个提供的 reducer 函数，每一次运行 reducer 会将先前元素的计算结果作为参数传入，最后将其结果汇总为单个返回值。

看了这个描述就应该知道这个方法的主要目的，球和。

```js
reduce(callbackFn)
reduce(callbackFn, initialValue)
callbackFn(accumulator,currentValue,currentIndex)
```

这里有个概念

> 每一次运行 reducer 会将先前元素的计算结果作为参数传入

那么第一次运行明显没有初始值，所以如果没有传入 initialValue ，索引0,就是初始值。

如果传入，那么 initalValue 就是初始值。

还有一个很重要的东西，就是 reduce 如果数组长度是1, 那么不会调用 callbackFn，如果有 initalValue, 数组没有长度，同上。

reduce 是一个递归函数，因为他会算出上一次的结果，求和对他来说是最简单的工作，他可以做很多事情，因为他会传入上一次的结果，所以你可以不用在外部新建一个参数，就可以直接做很多事情，而不用自己去写一个必包或者方法。

比如，我要把一个数组里面的奇数和偶数分开。

```js
let arr = [];
let arr1 = [];
array.forEach(v => { v % 2 === 0 ? arr.push(): arr1:push() });
```

如果用 reduce

```js
[1,2,3,4,5,6,7,8,9].reduce((a,b,i) => {
    b % 2 === 0 ? a[0].push(b) : a[1].push(b);
    return a;
}, [[],[]])
```

大概是这个意思。

reduceRight 就是从右到左。

### 30. Array.prototype.reverse()，Array.prototype.toReversed()

反转数组，没有其他参数。

> reverse() 方法就地反转数组中的元素，并返回同一数组的引用。数组的第一个元素会变成最后一个，数组的最后一个元素变成第一个。换句话说，数组中的元素顺序将被翻转，变为与之前相反的方向。

toReversed 产生新数组，浅拷贝。

### 31. Array.prototype.slice()

> slice() 方法返回一个新的数组对象，这一对象是一个由 start 和 end 决定的原数组的浅拷贝（包括 start，不包括 end），其中 start 和 end 代表了数组元素的索引。原始数组不会被改变。

类似于 `String.prototype.sub`. 截取一段

```js
slice()
slice(start)
slice(start, end)
```

start & end, 就是开始和结束，结束并不是长度。

然后 start 和 end 需要跟其他的数组内容一样，

* 允许负数，param + array.length
* param < -array.length = 0
* start >= array.length， 不截取
* end >= array.length, 提取到末尾的所有
* end < start, 不提取

### 32. Array.prototype.some()

> some() 方法测试数组中是否至少有一个元素通过了由提供的函数实现的测试。如果在数组中找到一个元素使得提供的函数返回 true，则返回 true；否则返回 false。它不会修改数组。

some 只要一个符合条件，就返回 true, 全部 false，才返回 false.

```js
some(callbackFn)
some(callbackFn, thisArg)
```

some() 不会在空槽上运行它的断言函数, 反正不管空槽，也就是不管稀疏数组。

### 33. Array.prototype.sort()

> sort() 方法就地对数组的元素进行排序，并返回对相同数组的引用。默认排序是将元素转换为字符串，然后按照它们的 UTF-16 码元值升序排序。

```js
sort()
sort(compareFn)
```

这里有2种情况

> 如果没有提供 compareFn，所有非 undefined 的数组元素都会被转换为字符串，并按照 UTF-16 码元顺序比较字符串进行排序

具体码可以参考这个链接 https://www.toolhelper.cn/Encoding/UTF16

所有的 undefined 元素都会被排序到数组的末尾，sort() 方法保留空槽。如果源数组是稀疏的，则空槽会被移动到数组的末尾，并始终排在所有 undefined 元素的后面。

这就是 sort 的逻辑。

第二种情况，通过 callbackFn 来进行对比

> 如果提供了 compareFn，所有非 undefined 的数组元素都会按照比较函数的返回值进行排序（所有的 undefined 元素都会被排序到数组的末尾，并且不调用 compareFn）。

```
> 0	a 在 b 后，如 [b, a]
< 0	a 在 b 前，如 [a, b]
=== 0	保持 a 和 b 原来的顺序
```

ok，在知道了这个条件以后，我们就可以开始排序了, 比如我们需要从低到高排序

```js
const sortArr = [1,3,8,0,19,2,4,7];
sortArr.sort((a, b) => {
	return a > b ? 1 : -1;
})
console.log(sortArr);
```

大概是这样。

在大量且性能要求高的地方需要知道究竟是怎么算的，详情看这里 https://segmentfault.com/a/1190000010648740 ，多看看算法和源码。

### 34. Array.prototype.toSorted()

> Array 实例的 toSorted() 方法是 sort() 方法的复制方法版本。它返回一个新数组，其元素按升序排列。

需要注意的是，依然是浅拷贝。

### 35. Array.prototype.splice()

> splice() 方法通过移除或者替换已存在的元素和/或添加新元素就地改变一个数组的内容。

slice 是截取，splice 是移除或者替换

```js
splice(start)
splice(start, deleteCount)
splice(start, deleteCount, item1)
splice(start, deleteCount, item1, item2, itemN)
```

start，遵循之前的其他数组的规则。

* 允许负数，param + array.length
* param < -array.length = 0
* start >= array.length， 不截取

deleteCount，0 或者不传入就不删除，类似于插入，如果传入，就从start开始计算，deleteCount的几位。

最后就是替换或者插入多少个, 写几个例子

```js
console.log([1, 3, 8, 0, 19, 2, 4, 7]);
const spliceArr = [1, 3, 8, 0, 19, 2, 4, 7];
spliceArr.splice(1, 2);
console.log(`删除`, spliceArr);

const splice1Arr = [1, 3, 8, 0, 19, 2, 4, 7];
spliceArr.splice(1, 0, 4, 4, 4);
console.log(`插入`, spliceArr);
```

替换就是删除+插入。

### 36. Array.prototype.toSpliced()

> Array 实例的 toSpliced() 方法是 splice() 方法的复制版本。它返回一个新数组，并在给定的索引处删除和/或替换了一些元素。

```js
toSpliced(start)
toSpliced(start, deleteCount)
toSpliced(start, deleteCount, item1)
toSpliced(start, deleteCount, item1, item2, itemN)
```

老规矩，浅拷贝。

### 37. Array.prototype.toLocaleString(), Array.prototype.toString()

> toLocaleString() 方法返回一个字符串，表示数组中的所有元素。每个元素通过调用它们自己的 toLocaleString 方法转换为字符串，并且使用特定于语言环境的字符串（例如逗号“,”）分隔开。

```js
toLocaleString()
toLocaleString(locales)
toLocaleString(locales, options)
```

locales 

https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Intl#locales_%E5%8F%82%E6%95%B0

https://juejin.cn/post/6844903863556767758

> BCP 47（Best Current Practice 47）是一个标准，用于表示语言标签，它规定了一种语言标记的格式和结构。BCP 47 最初由IETF（Internet Engineering Task Force）发布，并被广泛用于标识语言、地区和文化相关的信息，如语言代码、地区代码和区域设置等

toString 一样，分别调用每个 item 的 toString().

还有，两位都认稀疏数组。

### 38. Array.prototype.values()

> values() 方法返回一个新的数组迭代器 (en-US)对象，该对象迭代数组中每个元素的值。

之前讲了 Array.prototype.keys, 返回了索引， values 就是返回值

### 39. Array.prototype.with()

> Array 实例的 with() 方法是使用方括号表示法修改指定索引值的复制方法版本。它会返回一个新数组，其指定索引处的值会被新值替换。

```js
array.with(index, value)
```

其实和 splice 很像，不过 splice 功能更全

> with() 方法总会创建一个密集数组。

### link

- [Symbol.isConcatSpreadable](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Symbol/isConcatSpreadable)
- [Iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator)
- [迭代协议](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Iteration_protocols)
- [深入浅出 JavaScript 的 Array.prototype.sort 排序算法](https://segmentfault.com/a/1190000010648740)
- [UTF-16 编码表](https://www.toolhelper.cn/Encoding/UTF16)
- [locales 参数](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Intl#locales_%E5%8F%82%E6%95%B0)
- [locales 参数 BCP 47 语言标记 解析](https://juejin.cn/post/6844903863556767758)
