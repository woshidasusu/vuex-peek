import { generateMutationsByState } from "./helper";

const state = () => {
  return {
    data: 1,
    page: 1,
    count: 1
  };
};

const getters = {};

const mutations = {
  // 自动生成 updateXXX 方法
  ...generateMutationsByState(state())
};

const actions = {};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
};
