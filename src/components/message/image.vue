<script>
export default {
    name: 'lemonMessageImage',
    inheritAttrs: false,
    render() {
        return (
            <lemon-message-basic
                class="lemon-message-image"
                props={{ ...this.$attrs }}
                scopedSlots={{
                    content: props => <img src={props.content} />
                }}
            />
        );
    }
};
</script>
<style lang="less">
.lemon-message-image .lemon-message-content {
    padding: 0;
    cursor: pointer;
    overflow: hidden;
}
.lemon-message-image .lemon-message-content img {
    max-width: 100%;
    min-width: 100px;
    display: block;
}
</style>
