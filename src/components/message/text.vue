<script>
// <template>
//     <lemon-message-basic
//         class="lemon-message-text"
//         :props="$attrs"
//         scopedSlots={{
//             content: (props) => {
//                 const content = this.IMUI.emojiNameToImage(
//                     props.content
//                 );
//                 return <span domProps={{ innerHTML: content }} />;
//             }
//         }}
//     >
//         <template #content>
//             <span domProps={{ innerHTML: props.content }} />
//         </template>
//     </lemon-message-basic>
// </template>

export default {
    name: 'lemonMessageText',
    inject: ['IMUI'],
    inheritAttrs: false,
    render() {
        return (
            <lemon-message-basic
                class="lemon-message-text"
                props={{ ...this.$attrs }}
                scopedSlots={{
                    content: (props) => {
                        const content = this.IMUI.emojiNameToImage(
                            props.content
                        );
                        return <span domProps={{ innerHTML: content }} />;
                    }
                }}
            />
        );
    }
};
</script>
<style lang="less">
.lemon-message-text .lemon-message__content img {
    width: 18px;
    height: 18px;
    display: inline-block;
    background: transparent;
    position: relative;
    top: -1px;
    padding: 0 2px;
    vertical-align: middle;
}
</style>
