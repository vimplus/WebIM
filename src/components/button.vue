<template>
    <button
        :class="['lemon-button', `lemon-button-color-${color}`]"
        :disabled="disabled"
        type="button"
        @click="_handleClick"
    >
        <slot></slot>
    </button>
</template>
<script>
export default {
    name: 'LemonButton',
    props: {
        color: {
            type: String,
            default: 'default'
        },
        disabled: Boolean
    },
    methods: {
        _handleClick(e) {
            this.$emit('click', e);
        }
    }
    // render() {
    //     return (
    //         <button
    //           class={['lemon-button', `lemon-button-color-${this.color}`]}
    //           disabled={this.disabled}
    //           type="button"
    //           on-click={this._handleClick}
    //         >
    //           {this.$slots.default}
    //         </button>
    //     );
    // }
};
</script>
<style lang="less">
.lemon-button {
    outline: none;
    line-height: 1.499;
    display: inline-block;
    font-weight: 400;
    text-align: center;
    -ms-touch-action: manipulation;
    touch-action: manipulation;
    cursor: pointer;
    background-image: none;
    border: 1px solid #ddd;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    white-space: nowrap;
    padding: 0 15px;
    font-size: 14px;
    border-radius: 4px;
    height: 32px;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    -webkit-transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
    transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
    color: rgba(0, 0, 0, 0.65);
    background-color: #fff;
    -webkit-box-shadow: 0 2px 0 rgba(0, 0, 0, 0.015);
    box-shadow: 0 2px 0 rgba(0, 0, 0, 0.015);
    text-shadow: 0 -1px 0 rgba(0, 0, 0, 0.12);
}
.lemon-button-color-default:hover:not([disabled]) {
    border-color: #666;
    color: #333;
}
.lemon-button-color-default:active {
    background-color: #ddd;
}
.lemon-button-color-default[disabled] {
    cursor: not-allowed;
    color: #aaa;
    background: #eee;
}
.lemon-button-color-grey {
    background: #e1e1e1;
    border-color: #e1e1e1;
    color: #666;
}
.lemon-button-color-grey:hover:not([disabled]) {
    border-color: #bbb;
}
</style>
