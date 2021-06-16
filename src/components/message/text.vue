<script>
// <template>
//     <witalk-message-basic
//         class="witalk-message-text"
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
//     </witalk-message-basic>
// </template>

export default {
    name: 'WitalkMessageText',
    inject: ['IMUI'],
    inheritAttrs: false,
    render() {
        return (
            <witalk-message-basic
                class="witalk-message-text"
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
.witalk-message-text .witalk-message-content img {
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
