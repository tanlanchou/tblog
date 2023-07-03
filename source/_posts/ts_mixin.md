---
title: mixin
date: 2023-07-03 22:46:51
tags: 
    - typescript
description: 原型链继承
---

### 官方例子

```
// Disposable Mixin
class Disposable {
    isDisposed: boolean;
    dispose() {
        this.isDisposed = true;
    }

}

// Activatable Mixin
class Activatable {
    isActive: boolean;
    activate() {
        this.isActive = true;
    }
    deactivate() {
        this.isActive = false;
    }
}

class SmartObject implements Disposable, Activatable {
    constructor() {
        setInterval(() => console.log(this.isActive + " : " + this.isDisposed), 500);
    }

    interact() {
        this.activate();
    }

    // Disposable
    isDisposed: boolean = false;
    dispose: () => void;
    // Activatable
    isActive: boolean = false;
    activate: () => void;
    deactivate: () => void;
}
applyMixins(SmartObject, [Disposable, Activatable]);

let smartObj = new SmartObject();
setTimeout(() => smartObj.interact(), 1000);

////////////////////////////////////////
// In your runtime library somewhere
////////////////////////////////////////

function applyMixins(derivedCtor: any, baseCtors: any[]) {
    baseCtors.forEach(baseCtor => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
            derivedCtor.prototype[name] = baseCtor.prototype[name];
        });
    });
}
```

官方例子关于 mixin 的解释有点类似于原型链的继承，单纯的复制原型链。

后续的原型链覆盖之前的原型链, 核心代码如下

```
function applyMixins(derivedCtor: any, baseCtors: any[]) {
    baseCtors.forEach(baseCtor => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
            derivedCtor.prototype[name] = baseCtor.prototype[name];
        });
    });
}
```

这个没什么难以理解的，知识让我疑惑的点在于明明就是一个原型链的复制，为什么要专门开一章来说明，并且其一个名字叫 mixin.

### 02. 其他地方定义的mixin

> 「混合」是一个函数：
> 
> 传入一个构造函数；
> 创建一个带有新功能，并且扩展构造函数的新类；
> 返回这个新类。

```
// 所有 mixins 都需要
type Constructor<T = {}> = new (...args: any[]) => T;

/////////////
// mixins 例子
////////////

// 添加属性的混合例子
function Timestamped<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    timestamp = Date.now();
  };
}

// 添加属性和方法的混合例子
function Activatable<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    isActivated = false;

    activate() {
      this.isActivated = true;
    }

    deactivate() {
      this.isActivated = false;
    }
  };
}
```
他这个例子其实类似于高解组件的写法，高解组件是在后续调用原有的组件，而这个例子是继承

其实和前面官方例子当中复制原型链的方式其实差不多，extends 本质上也是原型链继承，只是细微上有差别。

### 03. 什么是typescript mixin

其实就是继承，从效果上来看也算是 mixin

### 04. link

1. [Mixins](https://www.tslang.cn/docs/handbook/mixins.html)
2. [深入理解 typescript 混合](https://jkchao.github.io/typescript-book-chinese/typings/mixins.html#%E5%88%9B%E5%BB%BA%E4%B8%80%E4%B8%AA%E6%9E%84%E9%80%A0%E5%87%BD%E6%95%B0)
3. [setPrototypeOf 与 Object.create区别](https://juejin.cn/post/6844903527941144589)