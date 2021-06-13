<template>
    <span class="lemon-badge">
        <slot></slot>
        <span v-if="count" :class="['lemon-badge-label', isDot && 'lemon-badge-label-dot']">{{label}}</span>
    </span>
</template>
<script>
export default {
    name: 'LemonBadge',
    props: {
        count: [Number, Boolean],
        overflowCount: {
            type: Number,
            default: 99
        }
    },
    computed: {
        isDot() {
            return this.count === true;
        },
        label() {
            if (this.isDot) return '';
            return this.count > this.overflowCount
                ? `${this.overflowCount}+`
                : this.count;
        }
    },
    methods: {}
    // render() {
    //     return (
    //         <span class="lemon-badge">
    //             {this.$slots.default}
    //             {this.count !== 0 && this.count && (
    //                 <span class={['lemon-badge-label', this.isDot && 'lemon-badge-label-dot']}>{this.label}</span>
    //             )}
    //         </span>
    //     );
    // }
};
</script>
<style lang="less">
.lemon-badge {
  position: relative;
  display: inline-block;
}
.lemon-badge-label {
  border-radius: 10px;
  background: #f5222d;
  color: #fff;
  text-align: center;
  font-size: 12px;
  font-weight: normal;
  white-space: nowrap;
  -webkit-box-shadow: 0 0 0 1px #fff;
  box-shadow: 0 0 0 1px #fff;
  z-index: 10;
  position: absolute;
  -webkit-transform: translateX(50%);
  transform: translateX(50%);
  -webkit-transform-origin: 100%;
  transform-origin: 100%;
  display: inline-block;
  padding: 0 4px;
  height: 18px;
  line-height: 17px;
  min-width: 10px;
  top: -4px;
  right: 6px;
}
.lemon-badge-label-dot {
  width: 10px;
  height: 10px;
  min-width: auto;
  padding: 0;
  top: -3px;
  right: 2px;
}
</style>
