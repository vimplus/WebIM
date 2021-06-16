<script>
import { formatByte } from '@/utils';

export default {
    name: 'WitalkMessageFile',
    inheritAttrs: false,
    render() {
        return (
            <witalk-message-basic
                class="witalk-message-file"
                props={{ ...this.$attrs }}
                scopedSlots={{
                    content: props => [
                        <div class="witalk-message-file-inner">
                            <p class="witalk-message-file-name">
                                {props.fileName}
                            </p>
                            <p class="witalk-message-file-byte">
                                {formatByte(props.fileSize)}
                            </p>
                        </div>,
                        <div class="witalk-message-file-sfx">
                            <i class="witalk-icon-attah" />
                        </div>
                    ]
                }}
            />
        );
    }
};
</script>
<style lang="less">
.witalk-message-file .witalk-message-content {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    cursor: pointer;
    width: 200px;
    background: #fff;
    padding: 12px 18px;
    overflow: hidden;
}
.witalk-message-file .witalk-message-content p {
    margin: 0;
}
.witalk-message-file-tip {
    display: none;
}
.witalk-message-file-inner {
    -webkit-box-flex: 1;
    -ms-flex: 1;
    flex: 1;
}
.witalk-message-file-name {
    font-size: 14px;
}
.witalk-message-file-byte {
    font-size: 12px;
    color: #aaa;
}
.witalk-message-file-sfx {
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
