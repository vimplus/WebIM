<script>
export default {
    name: 'WitalkMessageImage',
    inheritAttrs: false,
    render() {
        return (
            <witalk-message-basic
                class="witalk-message-image"
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
.witalk-message-image .witalk-message-content {
    padding: 0;
    cursor: pointer;
    overflow: hidden;
}
.witalk-message-image .witalk-message-content img {
    max-width: 100%;
    min-width: 100px;
    display: block;
}
</style>
