<script>
// eslint-disable-next-line import/no-cycle
import contextmenu from '../directives/contextmenu';

const popoverCloseQueue = [];
const triggerEvents = {
    hover() {},
    focus(el) {
        el.addEventListener('focus', () => {
            this.changeVisible();
        });
        el.addEventListener('blur', () => {
            this.changeVisible();
        });
    },
    click(el) {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            contextmenu.hide();
            this.changeVisible();
        });
    },
    contextmenu(el) {
        el.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.changeVisible();
        });
    }
};
export default {
    name: 'WitalkPopover',
    props: {
        trigger: {
            type: String,
            default: 'click',
            validator(val) {
                return Object.keys(triggerEvents).includes(val);
            }
        }
    },
    data() {
        return {
            popoverStyle: {},
            visible: false
        };
    },
    computed: {},
    watch: {
        async visible(val) {
            if (val) {
                await this.$nextTick();
                const defaultEl = this.$slots.default[0].elm;
                const contentEl = this.$refs.popover;

                this.popoverStyle = {
                    top: `-${contentEl.offsetHeight + 10}px`,
                    left: `${defaultEl.offsetWidth / 2 - contentEl.offsetWidth / 2}px`
                };
            }
        }
    },
    created() {
        document.addEventListener('click', this._documentClickEvent);
        popoverCloseQueue.push(this.close);
    },
    mounted() {
        triggerEvents[this.trigger].call(this, this.$slots.default[0].elm);
    },
    destroyed() {
        document.removeEventListener('click', this._documentClickEvent);
    },
    methods: {
        _documentClickEvent(e) {
            e.stopPropagation();
            if (this.visible) this.close();
        },
        changeVisible() {
            this.visible ? this.close() : this.open();
        },
        open() {
            this.closeAll();
            this.visible = true;
        },
        closeAll() {
            popoverCloseQueue.forEach(callback => callback());
        },
        close() {
            this.visible = false;
        }
    },
    render() {
        return (
            <span style="position:relative">
                <transition name="witalk-slide-top">
                    {this.visible && (
                        <div
                            class="witalk-popover"
                            ref="popover"
                            style={this.popoverStyle}
                            onClick={e => e.stopPropagation()}
                        >
                            <div class="witalk-popover-content">{this.$slots.content}</div>
                            <div class="witalk-popover-arrow" />
                        </div>
                    )}
                </transition>
                {this.$slots.default}
            </span>
        );
    }
};
</script>
<style lang="less">
.witalk-popover {
  border: 1px solid #eee;
  border-radius: 4px;
  font-size: 14px;
  font-variant: tabular-nums;
  line-height: 1.5;
  color: rgba(0, 0, 0, 0.65);
  z-index: 10;
  background-color: #fff;
  border-radius: 4px;
  -webkit-box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: absolute;
  -webkit-transform-origin: 50% 150%;
  transform-origin: 50% 150%;
}
.witalk-popover-content {
  padding: 15px;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  position: relative;
  z-index: 1;
}
.witalk-popover-arrow {
  left: 50%;
  -webkit-transform: translateX(-50%) rotate(45deg);
  transform: translateX(-50%) rotate(45deg);
  position: absolute;
  z-index: 0;
  bottom: -4px;
  -webkit-box-shadow: 3px 3px 7px rgba(0, 0, 0, 0.07);
  box-shadow: 3px 3px 7px rgba(0, 0, 0, 0.07);
  width: 8px;
  height: 8px;
  background: #fff;
}
.witalk-slide-top-leave-active,
.witalk-slide-top-enter-active {
  -webkit-transition: all 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
  transition: all 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
}
.witalk-slide-top-enter,
.witalk-slide-top-leave-to {
  -webkit-transform: translateY(-10px) scale(0.8);
  transform: translateY(-10px) scale(0.8);
  opacity: 0;
}
</style>
