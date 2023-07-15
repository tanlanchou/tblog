

### Vue3 watch

```html
<div id="app">
    <h2>Counter: {{ counter }}</h2>
    <button @click="incrementCounter">Increment</button>
    <button @click="decrementCounter">Decrement</button>
    <h2>Double Counter: {{ doubleCounter }}</h2>
</div>

<script>
    const app = Vue.createApp({
        setup() {
            // 响应式数据
            const counter = Vue.ref(0);

            // 监听counter的变化
            Vue.watch(counter, (newValue, oldValue) => {
                console.log(`Counter changed: ${oldValue} => ${newValue}`);
            });

            // 计算属性
            const doubleCounter = Vue.computed(() => counter.value * 2);

            // 方法
            function incrementCounter() {
                counter.value++;
            }

            function decrementCounter() {
                counter.value--;
            }

            return {
                counter,
                doubleCounter,
                incrementCounter,
                decrementCounter
            };
        }
    });

    app.mount('#app');
</script>
```

这就是基本的用法，传入响应式的对象，然后监控。