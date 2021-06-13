<script>
export default {
    name: 'lemonMessageEvent',
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
            <div class="lemon-message lemon-message-event">
                <span
                    class="lemon-message-event__content"
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
.lemon-message-event__content {
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
