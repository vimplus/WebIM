<script>
export default {
    name: 'WitalkTabs',
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
                    class="witalk-tabs-content-pane"
                    v-show={this.active === index}
                >
                    {vnode}
                </div>
            );
            nav.push(
                <div
                    class={[
                        'witalk-tabs-nav-item',
                        this.active === index && 'witalk-tabs-nav-item-active'
                    ]}
                    onClick={() => this._handleNavClick(index)}
                >
                    {tab}
                </div>
            );
            return true;
        });
        return (
            <div class="witalk-tabs">
                <div class="witalk-tabs-content">{pane}</div>
                <div class="witalk-tabs-nav">{nav}</div>
            </div>
        );
    }
};
</script>
<style lang="less">
.witalk-tabs {
    background: #f6f6f6;
}
.witalk-tabs-content {
    width: 100%;
    height: 100%;
    padding: 15px;
}
.witalk-tabs-content-pane {
    height: 100%;
    width: 100%;
}
.witalk-tabs-nav {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    background: #eee;
}
.witalk-tabs-nav-item {
    line-height: 38px;
    padding: 0 15px;
    cursor: pointer;
    -webkit-transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
    transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
}
.witalk-tabs-nav-item-active {
    background: #f6f6f6;
}
</style>
