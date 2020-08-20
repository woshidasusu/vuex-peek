/**
 * 根据 state 对象属性自动生成 mutations 更新属性的方法，如：
 * state: {
 *  dataId: '',
 *  searchParams: {
 *      id: ''
 *  }
 * }
 *
 * ===>
 *
 * {
 *  updateDataId: (state, payload) => { state.dataId = payLoad }
 *  updateSearchParams: (state, payload) => { state.searchParams = {...state.searchParams, ...payload} }
 *  updateId: (state, payload) => { state.searchParams.id = payload }
 * }
 *
 * 非对像类型的属性直接生成赋值操作，对象类型属性会通过扩展运算符重新生成对象
 * 且会递归处理内部对象的属性，扁平化的生成 updateXXX 方法挂载到 mutations 对象上
 * @param {Object} stateTemplate
 */
export function generateMutationsByState(stateTemplate) {
  let handleInnerObjState = (parentKeyPath, innerState, obj) => {
    Object.keys(innerState).forEach(key => {
      let value = innerState[key];
      let updateKey = `update${key[0].toUpperCase()}${key.substr(1)}`;
      if (typeof value === 'object' && value != null && !Array.isArray(value)) {
        obj[updateKey] = (state, payload) => {
          let target = state;
          for (let i = 0; i < parentKeyPath.length; i++) {
            target = target[parentKeyPath[i]];
          }
          target[key] = { ...target[key], ...payload };
        };
        handleInnerObjState([...parentKeyPath, key], value, obj);
      } else {
        obj[updateKey] = (state, payload) => {
          let target = state;
          for (let i = 0; i < parentKeyPath.length; i++) {
            target = target[parentKeyPath[i]];
          }
          target[key] = payload;
        };
      }
    });
  };
  let mutations = {};
  Object.keys(stateTemplate).forEach(key => {
    let obj = {};
    let value = stateTemplate[key];
    let updateKey = `update${key[0].toUpperCase()}${key.substr(1)}`;
    if (typeof value === 'object' && value != null && !Array.isArray(value)) {
      obj[updateKey] = (state, payload) => {
        state[key] = { ...state[key], ...payload };
      };
      handleInnerObjState([key], value, obj);
    } else {
      obj[updateKey] = (state, payload) => {
        state[key] = payload;
      };
    }
    Object.assign(mutations, obj);
  });
  return mutations;
}
