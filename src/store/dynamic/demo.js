import { generateMutationsByState } from './helper';
/**
 * 动态注册，动态销毁，store 属于模块内单例
 */

const state = () => {
  return {
    data: 1,
    page: 1,
  };
};

const getters = {};

const mutations = {
  ...generateMutationsByState(state()),
};

const actions = {};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
};
