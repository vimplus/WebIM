<script>
import { useScopedSlot } from '@/utils';

export default {
    name: 'WitalkMessageBasic',
    inject: {
        IMUI: {
            from: 'IMUI',
            default() {
                return this;
            }
        }
    },
    props: {
        contextmenu: Array,
        message: {
            type: Object,
            default: () => ({})
        },
        timeFormat: {
            type: Function,
            default: () => ''
        },
        reverse: Boolean,
        hideName: Boolean,
        hideTime: Boolean
    },
    data() {
        return {};
    },
    computed: {},
    watch: {},
    created() {},
    mounted() {},
    methods: {
        _emitClick(e, key) {
            this.IMUI.$emit('message-click', e, key, this.message, this.IMUI);
        }
    },
    render() {
        const { fromUser, status, sendTime } = this.message;
        const hideTitle = this.hideName === true && this.hideTime === true;
        return (
            <div
                class={[
                    'witalk-message',
                    `witalk-message-status-${status}`,
                    {
                        'witalk-message-reverse': this.reverse,
                        'witalk-message-hide-title': hideTitle
                    }
                ]}
            >
                <div class="witalk-message-avatar">
                    <witalk-avatar
                        size={36}
                        shape="square"
                        src={fromUser.avatar}
                        onClick={(e) => {
                            this._emitClick(e, 'avatar');
                        }}
                    />
                </div>
                <div class="witalk-message-inner">
                    <div class="witalk-message-title">
                        {this.hideName === false && (
                            <span
                                onClick={(e) => {
                                    this._emitClick(e, 'displayName');
                                }}
                            >
                                {fromUser.displayName}
                            </span>
                        )}
                        {this.hideTime === false && (
                            <span
                                class="witalk-message-time"
                                onClick={(e) => {
                                    this._emitClick(e, 'sendTime');
                                }}
                            >
                                {this.timeFormat(sendTime)}
                            </span>
                        )}
                    </div>
                    <div class="witalk-message-content-flex">
                        <div
                            v-witalk-contextmenu_message={this.IMUI.contextmenu}
                            class="witalk-message-content"
                            onClick={(e) => {
                                this._emitClick(e, 'content');
                            }}
                        >
                            {useScopedSlot(
                                this.$scopedSlots.content,
                                null,
                                this.message
                            )}
                        </div>
                        <div class="witalk-message-content-after">
                            {useScopedSlot(
                                this.IMUI.$scopedSlots['message-after'],
                                null,
                                this.message
                            )}
                        </div>
                        <div
                            class="witalk-message-status"
                            onClick={(e) => {
                                this._emitClick(e, 'status');
                            }}
                        >
                            <i class="witalk-icon-loading witalk-anim-spin" />
                            <i
                                class="witalk-icon-prompt"
                                title="重发消息"
                                style={{
                                    color: '#ff2525',
                                    cursor: 'pointer'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
};
</script>
<style lang="less">
.witalk-message {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    padding: 10px 0;
}
.witalk-message-time {
    color: #b9b9b9;
    padding: 0 5px;
}
.witalk-message-inner {
    position: relative;
}
.witalk-message-avatar {
    padding-right: 10px;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}
.witalk-message-avatar .witalk-avatar {
    cursor: pointer;
}
.witalk-message-title {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    font-size: 12px;
    line-height: 16px;
    height: 16px;
    padding-bottom: 4px;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    color: #666;
}
.witalk-message-content-flex {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
}
.witalk-message-content {
    font-size: 14px;
    line-height: 20px;
    padding: 8px 10px;
    background: #fff;
    border-radius: 4px;
    position: relative;
    margin: 0;
}
.witalk-message-content img,
.witalk-message-content video {
    background: #e9e9e9;
    height: 100px;
}
.witalk-message-content:before {
    content: " ";
    position: absolute;
    top: 6px;
    width: 0;
    height: 0;
    border: 4px solid transparent;
    left: -4px;
    border-left: none;
    border-right-color: #fff;
}
.witalk-message-content-after {
    display: block;
    width: 48px;
    height: 36px;
    padding-left: 6px;
    -webkit-box-flex: 0;
    -ms-flex: none;
    flex: none;
    font-size: 12px;
    color: #aaa;
    overflow: hidden;
    visibility: hidden;
}
.witalk-message-status {
    position: absolute;
    top: 23px;
    right: 20px;
    color: #aaa;
    font-size: 20px;
}
.witalk-message-status .witalk-icon-loading,
.witalk-message-status .witalk-icon-prompt {
    display: none;
}
.witalk-message-status-going .witalk-icon-loading {
    display: inline-block;
}
.witalk-message-status-failed .witalk-icon-prompt {
    display: inline-block;
}
.witalk-message-status-succeed .witalk-message-content-after {
    visibility: visible;
}
.witalk-message-reverse {
    -webkit-box-orient: horizontal;
    -webkit-box-direction: reverse;
    -ms-flex-direction: row-reverse;
    flex-direction: row-reverse;
}
.witalk-message-reverse .witalk-message-content-flex {
    -webkit-box-orient: horizontal;
    -webkit-box-direction: reverse;
    -ms-flex-direction: row-reverse;
    flex-direction: row-reverse;
}
.witalk-message-reverse .witalk-message-content-after {
    padding-right: 6px;
    padding-left: 0;
    text-align: right;
}
.witalk-message-reverse .witalk-message-title {
    -webkit-box-orient: horizontal;
    -webkit-box-direction: reverse;
    -ms-flex-direction: row-reverse;
    flex-direction: row-reverse;
}
.witalk-message-reverse .witalk-message-status {
    left: 26px;
    right: auto;
}
.witalk-message-reverse .witalk-message-content {
    background: #35d863;
}
.witalk-message-reverse .witalk-message-content:before {
    content: " ";
    position: absolute;
    top: 6px;
    width: 0;
    height: 0;
    border: 4px solid transparent;
    left: auto;
    right: -4px;
    border-right: none;
    border-left-color: #35d863;
}
.witalk-message-reverse .witalk-message-title {
    text-align: right;
}
.witalk-message-reverse .witalk-message-avatar {
    padding-right: 0;
    padding-left: 10px;
}
.witalk-message-hide-title .witalk-message-avatar {
    padding-top: 10px;
}
.witalk-message-hide-title .witalk-message-status {
    top: 14px;
}
.witalk-message-hide-title .witalk-message-content {
    position: relative;
    top: -10px;
}
.witalk-message-hide-title .witalk-message-content:before {
    top: 14px;
}
</style>
