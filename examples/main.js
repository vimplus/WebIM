import Vue from 'vue';
import App from './App';
import LemonIMUI from '../src';

Vue.use(LemonIMUI);

Vue.config.productionTip = false;

new Vue({
    render: h => h(App)
}).$mount('#app');

// Vue3
// import { createApp } from 'vue';
// import App from './App';
// import LemonMessageVoice from './lemon-message-voice';
// import QQIMUI from './qq';
// import LemonIMUI from '../src';

// const app = createApp(App);

// app.component(LemonMessageVoice.name, LemonMessageVoice);
// app.component(QQIMUI.name, QQIMUI);

// app.use(LemonIMUI);
// app.mount('#app');
