# vue-peek README

## Features

1. `Ctrl + 鼠标左键` 点击跳转查看 vuex store 中定义的 state  
2. `选中 + 右键` 菜单中选择 Go to vuex store 可直接跳转，前提需要先进行第一步，才能触发跳转分析工作并缓存结果

## Requirements

支持 vue 文件和 js 文件，跳转能够正常运行的前提：

1. store 文件存放目录地址：`src/store/dynamic/`
2. store 的 state 定义规范：

```javascript
const state = () => {
  return {
    searchParams: {
      projectId: '',
    },
    permission: {},
    page: 1
  };
};
```

3. vue 文件中使用 state：
  
```javascript
computed: {
    ...dynamicStore.demo.statesToComputed([
      'searchParams',
      'searchParams.projectId',
      'permission',
      'page',
    ]),
}
```

## Release Notes

### 1.0.0

1. 发布 vuex peek

**Enjoy!**
