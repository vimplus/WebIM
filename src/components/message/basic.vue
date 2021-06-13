<script>
import { useScopedSlot } from '@/utils';

export default {
    name: 'lemonMessageBasic',
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
                    'lemon-message',
                    `lemon-message--status-${status}`,
                    {
                        'lemon-message--reverse': this.reverse,
                        'lemon-message--hide-title': hideTitle
                    }
                ]}
            >
                <div class="lemon-message__avatar">
                    <lemon-avatar
                        size={36}
                        shape="square"
                        src={fromUser.avatar}
                        onClick={(e) => {
                            this._emitClick(e, 'avatar');
                        }}
                    />
                </div>
                <div class="lemon-message__inner">
                    <div class="lemon-message__title">
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
                                class="lemon-message__time"
                                onClick={(e) => {
                                    this._emitClick(e, 'sendTime');
                                }}
                            >
                                {this.timeFormat(sendTime)}
                            </span>
                        )}
                    </div>
                    <div class="lemon-message__content-flex">
                        <div
                            v-lemon-contextmenu_message={this.IMUI.contextmenu}
                            class="lemon-message__content"
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
                        <div class="lemon-message__content-after">
                            {useScopedSlot(
                                this.IMUI.$scopedSlots['message-after'],
                                null,
                                this.message
                            )}
                        </div>
                        <div
                            class="lemon-message__status"
                            onClick={(e) => {
                                this._emitClick(e, 'status');
                            }}
                        >
                            <i class="lemon-icon-loading lemonani-spin" />
                            <i
                                class="lemon-icon-prompt"
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
.lemon-message {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    padding: 10px 0;
}
.lemon-message__time {
    color: #b9b9b9;
    padding: 0 5px;
}
.lemon-message__inner {
    position: relative;
}
.lemon-message__avatar {
    padding-right: 10px;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}
.lemon-message__avatar .lemon-avatar {
    cursor: pointer;
}
.lemon-message__title {
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
.lemon-message__content-flex {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
}
.lemon-message__content {
    font-size: 14px;
    line-height: 20px;
    padding: 8px 10px;
    background: #fff;
    border-radius: 4px;
    position: relative;
    margin: 0;
}
.lemon-message__content img,
.lemon-message__content video {
    background: #e9e9e9;
    height: 100px;
}
.lemon-message__content:before {
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
.lemon-message__content-after {
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
.lemon-message__status {
    position: absolute;
    top: 23px;
    right: 20px;
    color: #aaa;
    font-size: 20px;
}
.lemon-message__status .lemon-icon-loading,
.lemon-message__status .lemon-icon-prompt {
    display: none;
}
.lemon-message--status-going .lemon-icon-loading {
    display: inline-block;
}
.lemon-message--status-failed .lemon-icon-prompt {
    display: inline-block;
}
.lemon-message--status-succeed .lemon-message__content-after {
    visibility: visible;
}
.lemon-message--reverse {
    -webkit-box-orient: horizontal;
    -webkit-box-direction: reverse;
    -ms-flex-direction: row-reverse;
    flex-direction: row-reverse;
}
.lemon-message--reverse .lemon-message__content-flex {
    -webkit-box-orient: horizontal;
    -webkit-box-direction: reverse;
    -ms-flex-direction: row-reverse;
    flex-direction: row-reverse;
}
.lemon-message--reverse .lemon-message__content-after {
    padding-right: 6px;
    padding-left: 0;
    text-align: right;
}
.lemon-message--reverse .lemon-message__title {
    -webkit-box-orient: horizontal;
    -webkit-box-direction: reverse;
    -ms-flex-direction: row-reverse;
    flex-direction: row-reverse;
}
.lemon-message--reverse .lemon-message__status {
    left: 26px;
    right: auto;
}
.lemon-message--reverse .lemon-message__content {
    background: #35d863;
}
.lemon-message--reverse .lemon-message__content:before {
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
.lemon-message--reverse .lemon-message__title {
    text-align: right;
}
.lemon-message--reverse .lemon-message__avatar {
    padding-right: 0;
    padding-left: 10px;
}
.lemon-message--hide-title .lemon-message__avatar {
    padding-top: 10px;
}
.lemon-message--hide-title .lemon-message__status {
    top: 14px;
}
.lemon-message--hide-title .lemon-message__content {
    position: relative;
    top: -10px;
}
.lemon-message--hide-title .lemon-message__content:before {
    top: 14px;
}
</style>
