---

title: Tree-Sharking, rollup解析，vue
date: 2025-07-20 22:47:01
tags: 
    - Tree-Sharking
    - Vue2
    - Vue3
    - Commonjs

---



# Tree-Sharking, rollup解析，vue



### 01. 什么是 Tree-Sharking



> Tree Shaking 是一种通过静态分析来消除 JavaScript 中未使用代码的技术。它的名字来源于"摇树"的比喻 - 就像摇动一棵树来让成熟的果实掉落一样，Tree Shaking 会"摇掉"那些没有被使用的代码。



上面是ai说的



简单说就是你代码中有很多不用的东西，不管是第三方的，还是自己的写，通过 Tree-Sharking 的方式，让他不打包在最终代码中，从而达到减少体积的作用。



```javascript
// math.js
export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}

export function multiply(a, b) {
  return a * b;
}
```



```javascript
// main.js
import { add } from './math.js';

console.log(add(1, 2));
```



这样一个代码，希望的结果就是只打包 `add` 而不是所有 math.js 都打包。



### 02. 应用场景

肯定是需要对体积敏感的地方，比如说浏览器端。

相比之下比如electron之类的地方确实不是很敏感，我都本地了，我都用electron了。

随便吧。 只要不是大到离谱。



### 03. 如何实现的

拿 **Vue3** 举例



> Vue Template -> (Vue Compiler + AST) -> 优化的 JavaScript 渲染函数 (带 import) -> (Rollup/Vite) -> Tree Shaking -> 最终的、最小化的 JS 包



需要注意 (Rollup/Vite) 就是说这种打包工具他多做一件事情，就是去标记 "活代码" 或者 "死代码". 

为最终的 **Tree Shaking** 做准备



### 04. rollup思路解析

**vite** 实现 **Tree Shaking** 的方式是使用 **rollup** , 所以简单查了下





##### 04.01 词法解析

通过 **Acorn** 遍历出 **token**，也就是词法分析



```json
* { "type": "Keyword", "value": "import" }

* { "type": "Punctuator", "value": "{" }

* { "type": "Identifier", "value": "add" }

* { "type": "Punctuator", "value": "}" }

* { "type": "Identifier", "value": "from" }

* { "type": "String", "value": "'./utils'" }

* { "type": "Punctuator", "value": ";" }
```





这一步的目的是留下一个没有空格，换行等等，结构化的节点。



##### 04.02 语法分析

```json
{
  "type": "ImportDeclaration",
  "start": 0,
  "end": 28,
  "specifiers": [
    {
      "type": "ImportSpecifier",
      "start": 9,
      "end": 12,
      "imported": {
        "type": "Identifier",
        "name": "add"
      },
      "local": {
        "type": "Identifier",
        "name": "add"
      }
    }
  ],
  "source": {
    "type": "Literal",
    "value": "./utils"
  }
}
```

基于 **token** 而来，形成一个  **ESTree** 规范 的抽象语法树，也就是 **AST**

上面的都是基于  **Acorn** 来做的，他是一个词法/语法解析器

这个时候有了层级，有了类型。

##### 04.03 递归解析

比如我是一个 **main.js**



我做好前两步，然后开始递归。

用一个自定义的对象去存储AST对象。（对象你可以自己定义，总之就是描述清楚）

当遍历完成。



就开始梳理。

有没有引用？有就继续 词法，语法解析，往里走，继续目前这个步骤

最后开始标记，哪些是**死**的，哪些是**活**的 

不停的更新



最后就有一个完成的构图，你知道哪些是死的，哪些是活的代码。

当然中间有很多细节。

比如你遍历的算法？ rollup 用的是深度优先。

有些全局变量怎么处理？有没有其他恶心的地方可以改变他？

比如有些变量现在看起来没用，实际上很深的层次才有引用？

是否有缓存？一样的东西是否判断？

等等等等，我只是说了一个简单的过程.

理论上他是一个不停的更新过程，这个对象需要不停的更新，直到最后一个文件遍历完成.



##### 04.04 构建

如果只是对于 **tree shaking** 来说这一步已经完成大部分工作了。

编译来说就是每次编译的时候，访问一下我们生成的对象，知道死和活就行了



#### 04.05 rollup 流程图



graph TD;
    subgraph "Graph (总协调器)"
        A["开始: build('main.js')"] --> B{"获取或解析模块('main.js')"};
    end
    subgraph "获取或解析模块(文件路径)"
        C{"模块是否在缓存中?"} -- 是 --> D[返回缓存的模块];
        C -- 否 --> E["创建新模块(文件路径)"];
        E --> F["模块读取文件并<br/>用 Acorn 解析成 AST"];
        F --> G["模块分析 AST 寻找 import 语句"];
        G -- "对于每个 'import' 的依赖路径" --> H{"获取或解析模块(依赖路径)<br/><b>(递归调用)</b>"};
        H --> I["将依赖链接到父模块"];
        I --> G; 
        G -- "分析完成" --> J["将新模块添加到缓存"];
        J --> D;
    end
    B --> C;
    D --> K["模块依赖图构建完成"];
    style H fill:#e6f3ff,stroke:#333,stroke-width:2px,font-weight:bold
    style B fill:#ccffcc,stroke:#333,stroke-width:2px

### 05. 为什么vue2 => vue3 tree shaking 变好了？



首先就得对比代码了。

```javascript
import Vue from 'vue';

new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue 2!'
  },
  methods: {
    // ...
  },
  mounted() {
    this.$nextTick(() => {
      // ...
    });
  }
});
```

根据我们刚才的流程这个代码就已经很有问题了。

他是全部引入的，普通 **tree shaking** 根本没用。

只能做专门的，他很多东西都是全局绑定的， `Vue.set, Vue.nextTick`

这就是为什么 `vue2` **tree shaking** 基本没用的原因



当然也不是说完全不能做，改一下 rollup， 做一些专门处理，对变量做专门的处理。



再看看 **vue3**

```javascript
import { createApp, ref, computed, nextTick } from 'vue';

const app = createApp({
  setup() {
    const message = ref('Hello Vue 3!');
    const double = computed(() => message.value.length * 2);

    return { message, double };
  }
});

app.mount('#app');

nextTick(() => {
  // ...
});
```

美丽。



### 06. 疑问，为什么commonjs 或者 import 全部不能 tree shaking

> **CommonJS** 是一种 JavaScript 模块规范，最早是为 **Node.js** 和服务器端 JavaScript 应用设计的。它的核心目标是为 JavaScript 提供一个标准的模块系统，让开发者可以像在其他语言中那样，使用 `require()` 导入模块、使用 `module.exports` 导出模块。



他和 

```javascript
import vue from 'vue'
```

一样，本质上也是全部导入。

我产生了一个疑问

为什么全部导入无法 **tree shaking** ?



理论上来说，

```javascript
import { ref } from 'vue'


import vue from 'vue'
vue.ref
```

·`vue.ref` 是可以收集的啊



于是我到处查了下。

主要是要处理太多情况了。理论上其实没问题，如果将来有精准的**AI**，那么其实是可行的。

```javascript
import Vue from 'vue';

// 写法一：静态分析器能看懂
Vue.set({ a: 1 }, 'b', 2);

// 写法二：静态分析器彻底懵了
const myMethod = 'set';
Vue[myMethod]({ a: 1 }, 'b', 2); 
```



`myMethod` 可以是任何方式，`function` 传入，全局变量等等

分析器不可能应对所有情况。



```javascript
import Vue from 'vue';

function initializePlugin(framework) {
  // 在这个函数内部，Rollup 怎么知道 framework 就是 Vue？
  // 追踪对象的别名是一项非常复杂且耗性能的工作。
  framework.nextTick(() => { /* ... */ });
}

initializePlugin(Vue);

// 更糟糕的情况：修改对象
const MyFramework = { ...Vue }; // 创建了一个副本
MyFramework.version = 'custom'; // 修改了它
// 接下来对 MyFramework.set 的调用，Rollup 很难再把它和原始的 Vue 关联起来

```



```javascript
// MyComponent.vue
export default {
  mounted() {
    this.$nextTick(() => {
      // ...
    });
  }
}
```

这些情况分析器都不好处理





所以为什么不能分析全部导入？因为变数太多太多了。

除非你能完全控制自己的代码，为自己的代码专门做一套。





### 07 总结

今天大概了解了下 **tree shaking** 的概念

以及为什么 **Vue2** 不能做 **tree shaking**

**Vue3** 好做 **tree shaking**

为什么 **commonjs** 不能做 **tree shaking**



有空自己写一个吧


