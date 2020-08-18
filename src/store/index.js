import Vue from "vue";
import Vuex from "vuex";
import createLogger from "vuex/dist/logger";

Vue.use(Vuex);

let env = "dev";

let options = {
  modules,
  strict: env === "dev",
  plugins: env === "dev" ? [createLogger()] : [],
};
console.log("[Vuex]", options);

export default new Vuex.Store(options);
