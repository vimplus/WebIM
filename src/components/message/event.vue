<script>
export default {
    name: 'WitalkMessageEvent',
    inject: ['IMUI'],
    inheritAttrs: false,
    methods: {
        _emitClick(e, key) {
            this.IMUI.$emit(
                'message-click',
                e,
                key,
                this.$attrs.message,
                this.IMUI
            );
        }
    },
    render() {
        const { content } = this.$attrs.message;
        return (
            <div class="witalk-message witalk-message-event">
                <span
                    class="witalk-message-event-content"
                    onClick={e => this._emitClick(e, 'content')}
                >
                    {content}
                </span>
            </div>
        );
    }
};
</script>
<style lang="less">
.witalk-message-event-content {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    display: inline-block;
    background: #e9e9e9;
    color: #aaa;
    font-size: 12px;
    margin: 0 auto;
    padding: 5px 10px;
    border-radius: 4px;
}
</style>
