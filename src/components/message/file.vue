<script>
import { formatByte } from '@/utils';

export default {
    name: 'lemonMessageFile',
    inheritAttrs: false,
    render() {
        return (
            <lemon-message-basic
                class="lemon-message-file"
                props={{ ...this.$attrs }}
                scopedSlots={{
                    content: props => [
                        <div class="lemon-message-file__inner">
                            <p class="lemon-message-file__name">
                                {props.fileName}
                            </p>
                            <p class="lemon-message-file__byte">
                                {formatByte(props.fileSize)}
                            </p>
                        </div>,
                        <div class="lemon-message-file__sfx">
                            <i class="lemon-icon-attah" />
                        </div>
                    ]
                }}
            />
        );
    }
};
</script>
<style lang="less">
.lemon-message-file .lemon-message__content {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    cursor: pointer;
    width: 200px;
    background: #fff;
    padding: 12px 18px;
    overflow: hidden;
}
.lemon-message-file .lemon-message__content p {
    margin: 0;
}
.lemon-message-file__tip {
    display: none;
}
.lemon-message-file__inner {
    -webkit-box-flex: 1;
    -ms-flex: 1;
    flex: 1;
}
.lemon-message-file__name {
    font-size: 14px;
}
.lemon-message-file__byte {
    font-size: 12px;
    color: #aaa;
}
.lemon-message-file__sfx {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center;
    font-weight: bold;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    font-size: 34px;
    color: #ccc;
}
</style>
