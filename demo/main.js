import Vue from 'vue';
import App from './App';
import WitalkIMUI from '../src';

Vue.use(WitalkIMUI);

Vue.config.productionTip = false;

new Vue({
    render: h => h(App)
}).$mount('#app');

// Vue3
// import { createApp } from 'vue';
// import App from './App';
// import WitalkMessageVoice from './witalk-message-voice';
// import QQIMUI from './qq';
// import WitalkIMUI from '../src';

// const app = createApp(App);

// app.component(WitalkMessageVoice.name, WitalkMessageVoice);
// app.component(QQIMUI.name, QQIMUI);

// app.use(WitalkIMUI);
// app.mount('#app');
