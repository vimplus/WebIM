<script>
export default {
    name: 'LemonTabs',
    props: {
        activeIndex: String
    },
    data() {
        return {
            active: this.activeIndex
        };
    },
    mounted() {
        if (!this.active) {
            this.active = this.$slots['tab-pane'][0].data.attrs.index;
        }
    },
    methods: {
        _handleNavClick(index) {
            this.active = index;
        }
    },
    render() {
        const pane = [];
        const nav = [];
        this.$slots['tab-pane'].map((vnode) => {
            const { tab, index } = vnode.data.attrs;
            pane.push(
                <div
                    class="lemon-tabs-content__pane"
                    v-show={this.active === index}
                >
                    {vnode}
                </div>
            );
            nav.push(
                <div
                    class={[
                        'lemon-tabs-nav__item',
                        this.active === index && 'lemon-tabs-nav__item--active'
                    ]}
                    onClick={() => this._handleNavClick(index)}
                >
                    {tab}
                </div>
            );
            return true;
        });
        return (
            <div class="lemon-tabs">
                <div class="lemon-tabs-content">{pane}</div>
                <div class="lemon-tabs-nav">{nav}</div>
            </div>
        );
    }
};
</script>
<style lang="less">
.lemon-tabs {
    background: #f6f6f6;
}
.lemon-tabs-content {
    width: 100%;
    height: 100%;
    padding: 15px;
}
.lemon-tabs-content__pane {
    height: 100%;
    width: 100%;
}
.lemon-tabs-nav {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    background: #eee;
}
.lemon-tabs-nav__item {
    line-height: 38px;
    padding: 0 15px;
    cursor: pointer;
    -webkit-transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
    transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
}
.lemon-tabs-nav__item--active {
    background: #f6f6f6;
}
</style>
