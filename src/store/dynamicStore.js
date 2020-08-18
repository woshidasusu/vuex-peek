import store from './index';
import demo from './demo';
import { storeToComputed } from './storeToComputed';

const KEY_DEMO = 'demo';

/**
 * 动态注册，动态销毁，store 属于模块内单例
 * 注意模块 store 的 state 需用函数返回对象，避免模块间污染
 */

function _register(moduleName, moduleStore) {
  if (store.state[moduleName]) {
    store.unregisterModule(moduleName);
  }
  store.registerModule(moduleName, moduleStore);
}

function _unregister(moduleName) {
  if (store.state[moduleName]) {
    store.unregisterModule(moduleName);
  }
}

const generateStoreOperate = (moduleName, moduleStore) => {
  return {
    name: moduleName,
    state: () => {
      return store.state[moduleName];
    },
    commit: (mutation, payload, options) => {
      store.commit(`${moduleName}/${mutation}`, payload, options);
    },
    statesToComputed: states => {
      return storeToComputed(moduleName, states);
    },
    register: () => {
      _register(moduleName, moduleStore);
    },
    unregister: () => {
      _unregister(moduleName);
    },
  };
};

export default {
  demo: {
    // demo
    ...generateStoreOperate(DELIVERY_DATA_SUMMARY, dataSummary),
  },
};
