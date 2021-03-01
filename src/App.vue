<template>
  <div id="app"></div>
</template>

<script>
import dynamicStore from "@/store/dynamicStore";
export default {
  name: "App",
  components: {},
  data() {
    return {};
  },
  computed: {
    // 映射 this.$store.demo.xxx => this.xxx
    ...dynamicStore.demo.statesToComputed("count", "page"),
  },
  created() {
    // ctrl + 鼠标 可查看 count 声明和点击快速跳转
    console.error(this.count);
  },
  methods: {},
};
</script>

<style>
</style>
