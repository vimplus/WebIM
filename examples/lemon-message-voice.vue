<script>
export default {
    name: 'lemonMessageVoice',
    inject: ['IMUI'],
    inheritAttrs: false,
    render() {
        return (
            <lemon-message-basic
                class="lemon-message-voice"
                props={{ ...this.$attrs }}
                scopedSlots={{
                    content: props => <span>{props.content}&nbsp;🔈</span>
                }}
            />
        );
    }
};
</script>
<style lang="less">
.lemon-message.lemon-message-voice {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}
.lemon-message.lemon-message-voice .lemon-message-content {
    border: 2px solid #000;
    font-size: 12px;
    cursor: pointer;
}
.lemon-message.lemon-message-voice .lemon-message-content::before {
    display: none;
}
</style>
