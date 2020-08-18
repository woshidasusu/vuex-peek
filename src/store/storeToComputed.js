import store from './index';

/**
 * 将 store 里指定的 state 转成计算属性 computed 的 set() get()
 * vue 里就可以直接类似操作 data 属性一样使用 state
 *
 * @param {String} moduleName state 所属的 store 的 module 名
 * @param {Array} states 待处理的 states e.g: ['project', 'searchParams.projectName'] 其中，
 * 挂载在 computed 上的属性名，默认等于 state，当 state 结构多层时，取最后一层的属性名
 *
 * ps: state 对应的 mutation 必须以 updateXXX 方式命名
 */
export function storeToComputed(moduleName, states) {
  if (!store) {
    throw new TypeError('store is null');
  }
  if (!moduleName) {
    throw new TypeError("state's module name is null");
  }
  if (!states || !Array.isArray(states) || states.length === 0) {
    throw new TypeError('states is null or not array');
  }
  let computed = {};
  states.forEach(state => {
    if (state.indexOf('.') !== -1) {
      let _states = state.split('.');
      let _key = _states[_states.length - 1];
      computed[_key] = {
        get() {
          let res = store.state[moduleName];
          for (let i = 0; i < _states.length; i++) {
            res = res[_states[i]];
          }
          return res;
        },
        set(value) {
          store.commit(
            `${moduleName}/update${_key[0].toUpperCase()}${_key.substr(1)}`,
            value
          );
        },
      };
    } else {
      computed[state] = {
        get() {
          return store.state[moduleName][state];
        },
        set(value) {
          store.commit(
            `${moduleName}/update${state[0].toUpperCase()}${state.substr(1)}`,
            value
          );
        },
      };
    }
  });

  return computed;
}
