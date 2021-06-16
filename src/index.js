import Contextmenu from './directives/contextmenu';
import WitalkTabs from './components/tabs';
import WitalkPopover from './components/popover';
import WitalkButton from './components/button';
import WitalkBadge from './components/badge';
import WitalkAvatar from './components/avatar';
import WitalkContact from './components/contact';
import WitalkEditor from './components/editor';
import WitalkMessages from './components/messages';
import WitalkMessageBasic from './components/message/basic';
import WitalkMessageText from './components/message/text';
import WitalkMessageImage from './components/message/image';
import WitalkMessageFile from './components/message/file';
import WitalkMessageEvent from './components/message/event';

import WitalkIMUI from './components/index';
import './styles/common/index.less';

const version = '1.4.2';
const components = [
    WitalkIMUI,
    WitalkContact,
    WitalkMessages,
    WitalkEditor,
    WitalkAvatar,
    WitalkBadge,
    WitalkButton,
    WitalkPopover,
    WitalkTabs,
    WitalkMessageBasic,
    WitalkMessageText,
    WitalkMessageImage,
    WitalkMessageFile,
    WitalkMessageEvent
];
const install = (Vue) => {
    Vue.directive('WitalkContextmenu', Contextmenu);
    components.forEach((component) => {
        Vue.component(component.name, component);
    });
};

if (typeof window !== 'undefined' && window.Vue) {
    install(window.Vue);
}

export default {
    version,
    install
};
