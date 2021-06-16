<template>
    <div
        :class="['witalk-contact', { 'witalk-contact-name-center': simple }]"
        :title="contact.displayName"
        @click="e => _handleClick(e, contact)"
    >
        <slot>
            <witalk-badge
                :count="!simple ? contact.unread : 0"
                class="witalk-contact-avatar"
            >
                <witalk-avatar :size="40" :src="contact.avatar" />
            </witalk-badge>
            <div class="witalk-contact-inner">
                <p class="witalk-contact-label">
                    <span class="witalk-contact-name">{{contact.displayName}}</span>
                    <span v-if="!simple" class="witalk-contact-time">
                        {{timeFormat(contact.lastSendTime)}}
                    </span>
                </p>
                <p v-if="!simple" class="witalk-contact-content">
                    <span v-if="isString(contact.lastContent)" v-html="contact.lastContent"></span>
                    <span v-else>{{contact.lastContent}}</span>
                </p>
            </div>
        </slot>
    </div>
</template>
<script>
import { isString, isToday } from '@/utils/validate';
import { timeFormat, useScopedSlot } from '@/utils';

// function useScopedSlot(slot, def, props) {
//     return slot ? slot(props) : def;
// }

export default {
    name: 'WitalkContact',
    components: {},
    inject: {
        IMUI: {
            from: 'IMUI',
            default() {
                return this;
            }
        }
    },
    props: {
        contact: Object,
        simple: Boolean,
        timeFormat: {
            type: Function,
            default(val) {
                return timeFormat(val, isToday(val) ? 'h:i' : 'y/m/d');
            }
        }
    },
    data() {
        return {
            isString
        };
    },
    computed: {},
    watch: {},
    created() {},
    mounted() {},
    methods: {
        _renderInner() {
            const { contact } = this;
            return [
                <witalk-badge
                    count={!this.simple ? contact.unread : 0}
                    class="witalk-contact-avatar"
                >
                    <witalk-avatar size={40} src={contact.avatar} />
                </witalk-badge>,
                <div class="witalk-contact-inner">
                    <p class="witalk-contact-label">
                        <span class="witalk-contact-name">{contact.displayName}</span>
                        {!this.simple && (
                            <span class="witalk-contact-time">
                              {this.timeFormat(contact.lastSendTime)}
                            </span>
                        )}
                    </p>
                    {!this.simple && (
                        <p class="witalk-contact-content">
                            {isString(contact.lastContent) ? (
                                <span domProps={{ innerHTML: contact.lastContent }} />
                            ) : (
                                contact.lastContent
                            )}
                        </p>
                    )}
                </div>
            ];
        },
        _handleClick(e, data) {
            this.$emit('click', data);
        }
    },
    render() {
        return (
            <div
                class={['witalk-contact', { 'witalk-contact-name-center': this.simple }]}
                title={this.contact.displayName}
                on-click={e => this._handleClick(e, this.contact)}
            >
                {useScopedSlot(
                    this.$scopedSlots.default,
                    this._renderInner(),
                    this.contact
                )}
            </div>
        );
    }
};
</script>
<style lang="less">
.witalk-contact {
  padding: 10px 14px;
  cursor: pointer;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  overflow: hidden;
  background: #efefef;
  text-align: left;
}
.witalk-contact p {
  margin: 0;
}
.witalk-contact-active {
  background: #bebdbd;
}
.witalk-contact:hover:not(.witalk-contact-active) {
  background: #e3e3e3;
}
.witalk-contact:hover:not(.witalk-contact-active) .el-badge-content {
  border-color: #ddd;
}
.witalk-contact-avatar {
  float: left;
  margin-right: 10px;
}
.witalk-contact-avatar img {
  display: block;
}
.witalk-contact-avatar .ant-badge-count {
  display: inline-block;
  padding: 0 4px;
  height: 18px;
  line-height: 18px;
  min-width: 18px;
  top: -4px;
  right: 7px;
}
.witalk-contact-label {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
}
.witalk-contact-time {
  font-size: 12px;
  line-height: 18px;
  padding-left: 6px;
  color: #999;
  white-space: nowrap;
}
.witalk-contact-name {
  display: block;
  width: 100%;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
.witalk-contact-content {
  font-size: 12px;
  color: #999;
  height: 18px;
  line-height: 18px;
  margin-top: 1px !important;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
.witalk-contact-content img {
  height: 14px;
  display: inline-block;
  vertical-align: middle;
  margin: 0 1px;
  position: relative;
  top: -1px;
}
.witalk-contact-name-center .witalk-contact-label {
  padding-bottom: 0;
  line-height: 38px;
}
</style>
