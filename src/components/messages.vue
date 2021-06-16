<script>
import { hoursTimeFormat } from '@/utils';
import { isString } from '@/utils/validate';
import contextmenu from '../directives/contextmenu';

export default {
    name: 'WitalkMessages',
    components: {},
    props: {
        // 是否隐藏消息发送人昵称
        hideName: Boolean,
        // 是否隐藏显示消息时间
        hideTime: Boolean,
        reverseUserId: [String, Number],
        timeRange: {
            type: Number,
            default: 1
        },
        timeFormat: {
            type: Function,
            default(val) {
                return hoursTimeFormat(val);
            }
        },
        loadingText: {
            type: [String, Function]
        },
        loadendText: {
            type: [String, Function],
            default: '暂无更多消息'
        },
        messages: {
            type: Array,
            default: () => []
        }
    },
    data() {
        this._lockScroll = false;
        return {
            loading: false,
            loadend: false
        };
    },
    computed: {
        msecRange() {
            return this.timeRange * 1000 * 60;
        }
    },
    watch: {},
    created() {},
    mounted() {},
    methods: {
        loaded() {
            this.loadend = true;
            this.$forceUpdate();
        },
        resetLoadState() {
            this._lockScroll = true;
            this.loading = false;
            this.loadend = false;
            setTimeout(() => {
                this._lockScroll = false;
            }, 200);
        },
        async _handleScroll(e) {
            if (this._lockScroll) return;
            const { target } = e;
            contextmenu.hide();
            if (
                target.scrollTop === 0
                && this.loading === false
                && this.loadend === false
            ) {
                this.loading = true;
                await this.$nextTick();
                const hst = target.scrollHeight;

                this.$emit('reach-top', async (isEnd) => {
                    await this.$nextTick();
                    target.scrollTop = target.scrollHeight - hst;
                    this.loading = false;
                    this.loadend = !!isEnd;
                });
            }
        },
        async scrollToBottom() {
            await this.$nextTick();
            const { wrap } = this.$refs;
            if (wrap) {
                wrap.scrollTop = wrap.scrollHeight;
            }
        }
    },
    render() {
        return (
            <div class="witalk-messages" ref="wrap" on-scroll={this._handleScroll}>
                <div
                    class={[
                        'witalk-messages-load',
                        `witalk-messages-load-${this.loadend ? 'end' : 'ing'}`
                    ]}
                >
                <span class="witalk-messages-loadend">
                    {isString(this.loadendText) ? this.loadendText : this.loadendText()}
                </span>
                <span class="witalk-messages-loading">
                    {this.loadingText ? (
                        isString(this.loadingText) ? (
                            this.loadingText
                        ) : (
                            this.loadingText()
                        )
                    ) : (
                        <i class="witalk-icon-loading witalk-anim-spin" />
                    )}
                </span>
                </div>
                {this.messages.map((message, index) => {
                    const node = [];
                    const tagName = `witalk-message-${message.type}`;
                    const prev = this.messages[index - 1];
                    if (
                        prev
                        && this.msecRange
                        && message.sendTime - prev.sendTime > this.msecRange
                    ) {
                        node.push(
                            <witalk-message-event
                                attrs={{
                                    message: {
                                        id: '__time__',
                                        type: 'event',
                                        content: hoursTimeFormat(message.sendTime)
                                    }
                                }}
                            />
                        );
                    }

                    let attrs;
                    if (message.type === 'event') {
                        attrs = { message };
                    } else {
                        attrs = {
                            timeFormat: this.timeFormat,
                            message,
                            reverse: this.reverseUserId === message.fromUser.id,
                            hideTime: this.hideTime,
                            hideName: this.hideName
                        };
                    }
                    node.push(
                        <tagName ref="message" refInFor={true} attrs={attrs} />
                    );
                    return node;
                })}
            </div>
        );
    }
};
</script>
<style lang="less">
.witalk-messages {
  height: 400px;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 10px 15px;
}
.witalk-messages::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
.witalk-messages::-webkit-scrollbar-track-piece {
  background-color: transparent;
}
.witalk-messages::-webkit-scrollbar-thumb:vertical {
  height: 5px;
  background-color: #aaa;
}
.witalk-messages::-webkit-scrollbar-thumb:horizontal {
  width: 5px;
  background-color: transparent;
}
.witalk-messages-time {
  text-align: center;
  font-size: 12px;
}
.witalk-messages-load {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  font-size: 12px;
  text-align: center;
  color: #999;
  line-height: 30px;
}
.witalk-messages-load .witalk-messages-loading,
.witalk-messages-load .witalk-messages-loadend {
  display: none;
}
.witalk-messages-load-ing .witalk-icon-loading {
  font-size: 22px;
}
.witalk-messages-load-ing .witalk-messages-loading {
  display: block;
}
.witalk-messages-load-end .witalk-messages-loadend {
  display: block;
}
</style>
