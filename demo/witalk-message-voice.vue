<script>
export default {
    name: 'WitalkMessageVoice',
    inject: ['IMUI'],
    inheritAttrs: false,
    render() {
        return (
            <witalk-message-basic
                class="witalk-message-voice"
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
.witalk-message.witalk-message-voice {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}
.witalk-message.witalk-message-voice .witalk-message-content {
    border: 2px solid #000;
    font-size: 12px;
    cursor: pointer;
}
.witalk-message.witalk-message-voice .witalk-message-content::before {
    display: none;
}
</style>
