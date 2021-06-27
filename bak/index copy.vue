<script>
import {
    computed, defineComponent, getCurrentInstance, onMounted, nextTick, reactive, provide, ref, toRefs, watch, watchEffect, useContext
} from 'vue';
import {
    renderSlot,
    funCall,
    generateUUID,
    clearHtmlExcludeImg
} from '@/utils';
import { isFunction, isString, isEmpty } from '@/utils/validate';
import {
    DEFAULT_MENUS,
    DEFAULT_MENU_LASTMESSAGES,
    DEFAULT_MENU_CONTACTS
} from '@/utils/constant';
import MemoryCache from '@/utils/cache/memory';
import contextmenu from '../src/directives/contextmenu';
import lastContentRender from '../src/lastContentRender';

// const allMessages = {};
const emojiMap = {};
const toPx = val => (isString(val) ? val : `${val}px`);
const toPoint = str => str.replace('%', '') / 100;

let renderDrawerContent = () => {};

export default defineComponent({
    name: 'WitalkImui',
    props: {
        width: {
            type: [String, Number],
            default: 850
        },
        height: {
            type: [String, Number],
            default: 580
        },
        theme: {
            type: String,
            default: 'default'
        },
        simple: {
            type: Boolean,
            default: false
        },
        loadingText: [String, Function],
        loadendText: [String, Function],
        /**
         * 消息时间格式化规则
         */
        messageTimeFormat: Function,
        /**
         * 联系人最新消息时间格式化规则
         */
        contactTimeFormat: Function,
        /**
         * 初始化时是否隐藏抽屉
         */
        hideDrawer: {
            type: Boolean,
            default: true
        },
        /**
         * 是否隐藏导航按钮上的头像
         */
        hideMenuAvatar: Boolean,
        hideMenu: Boolean,
        /**
         * 是否隐藏消息列表内的联系人名字
         */
        hideMessageName: Boolean,
        /**
         * 是否隐藏消息列表内的发送时间
         */
        hideMessageTime: Boolean,
        sendKey: Function,
        sendText: String,
        contextmenu: Array,
        contactContextmenu: Array,
        avatarCricle: Boolean,
        currentContactId: Number,
        user: {
            type: Object,
            default: () => ({})
        },
        contacts: {
            type: Array,
            default: () => ([])
        },
        menus: {
            type: Array,
            default: () => ([])
        }
    },
    setup(props, context) {
        const { slots, emit } = context;
        const { ctx: _this } = getCurrentInstance();
        // const { expose } = useContext();

        const CacheContactContainer = new MemoryCache();
        const CacheMenuContainer = new MemoryCache();
        const CacheMessageLoaded = new MemoryCache();
        const CacheDraft = new MemoryCache();
        // debugger
        const editorRef = ref(null);
        const messagesRef = ref(null);
        const wrapperRef = ref(null);
        const drawerRef = ref(null);
        // const currentMessages = ref([]);
        const state = reactive({
            drawerVisible: !props.hideDrawer,
            currentContactId: null,
            currentMessages: [],
            activeSidebar: DEFAULT_MENU_LASTMESSAGES
        });

        let propsContacts = ref([]);
        let menus = reactive([]);
        const allMessages = ref({});
        const editorTools = reactive([]);
        
        // watch(propsContacts, () => {
        //     console.log('contactsProps update')
        // });
        const currentContact = computed(() => propsContacts.value.find(item => item.id === state.currentContactId) || {});
        const currentIsDefSidebar = computed(() => DEFAULT_MENUS.includes(state.activeSidebar));
        const lastMessages = computed(() => {
            const list = propsContacts.value.filter(item => !isEmpty(item.lastContent));
            list.sort((a1, a2) => a2.lastSendTime - a1.lastSendTime);
            return list;
        });

        const _customContainerReady = (render, cacheDrive, key) => {
            if (isFunction(render) && !cacheDrive.has(key)) {
                cacheDrive.set(key, render.call(this));
            }
        };

        // 初始化最左侧菜单按钮
        const initMenus = () => {
            const defaultMenus = [
                {
                    name: DEFAULT_MENU_LASTMESSAGES,
                    title: '聊天',
                    unread: 0,
                    click: null,
                    render: () => <i class="witalk-icon-message" />,
                    isBottom: false
                },
                {
                    name: DEFAULT_MENU_CONTACTS,
                    title: '通讯录',
                    unread: 0,
                    click: null,
                    render: () => <i class="witalk-icon-addressbook" />,
                    isBottom: false
                }
            ];
            let _menus = [];
            if (Array.isArray(props.menus) && props.menus.length > 0) {
                const indexMap = {
                    messages: 0,
                    contacts: 1
                };
                const indexKeys = Object.keys(indexMap);
                _menus = props.menus.map((item) => {
                    if (indexKeys.includes(item.name)) {
                        return {
                            ...defaultMenus[indexMap[item.name]],
                            ...item,
                            ...{ renderContainer: null }
                        };
                    }

                    if (item.renderContainer) {
                        _customContainerReady(
                            item.renderContainer,
                            CacheMenuContainer,
                            item.name
                        );
                    }

                    return item;
                });
            } else {
                _menus = defaultMenus;
            }
            menus = _menus;
            return menus;
        }

        // 使用 联系人的 index 值进行排序
        const sortContacts = () => {
            propsContacts.value.sort((a, b) => {
                if (!a.index) return;
                return a.index.localeCompare(b.index);
            });
        };

        const initContacts = () => {
            propsContacts.value = props.contacts;
            // debugger
            sortContacts();
        };

        initContacts();
        

        /**
         * 初始化编辑框的 Emoji 表情列表，是 Witalk-editor.initEmoji 的代理方法
         * @param {Array<Emoji,EmojiItem>} data emoji 数据
         * Emoji = {label: 表情,children: [{name: wx,title: 微笑,src: url}]} 分组
         * EmojiItem = {name: wx,title: 微笑,src: url} 无分组
         */
        const initEmoji = (data) => {
            let flatData = [];
            editorRef.value.initEmoji(data);
            if (data[0].label) {
                data.forEach((item) => {
                    flatData.push(...item.children);
                });
            } else {
                flatData = data;
            }
            // eslint-disable-next-line no-return-assign
            flatData.forEach(({ name, src }) => (emojiMap[name] = src));
        };

        const initEditorTools = (data) => {
            editorTools.value = data;
            editorRef.value.initTools(data);
        }

        /**
         * 切换左侧按钮
         * @param {String} name 按钮 name
         */
        const changeMenu = (name) => {
            emit('change-menu', name);
            state.activeSidebar = name;
        };


        const _menuIsContacts = () => state.activeSidebar === DEFAULT_MENU_CONTACTS;
        const _menuIsMessages = () => state.activeSidebar === DEFAULT_MENU_LASTMESSAGES;

        const _isContactContainerCache = name => name.startsWith('contact#');

        const _handleSidebarScroll = () => {
            contextmenu.hide();
        };

        // 获取编辑器的值
        const getEditorValue = () => editorRef.value.getFormatValue();

        // 返回所有联系人
        const getContacts = () => propsContacts.value;

        // 返回当前聊天窗口联系人信息
        const getCurrentContact = () => {
            return currentContact.value;
        }

        // 查找联系人
        const findContact = contactId => getContacts().find(({ id }) => id === contactId);

        /**
         * 根据 id 查找联系人的索引
         * @param contactId 联系人 id
         * @return {Number} 联系人索引，未找到返回 -1
         */
        const findContactIndexById = contactId => propsContacts.value.findIndex(item => item.id === contactId);

        const findMessage = (messageId) => {
            // eslint-disable-next-line no-restricted-syntax
            for (const key in allMessages.value) {
                if (Object.prototype.hasOwnProperty.call(allMessages.value, key)) {
                    const message = allMessages.value[key].find(({ id }) => id === messageId);
                    if (message) return message;
                }
            }
        };

        /**
         * 根据 id 查找判断是否存在联系人
         * @param contactId 联系人 id
         * @return {Boolean}
         */
        const hasContact = (contactId) => {
            return findContactIndexById(contactId) !== -1;
        };

        const _addContact = (data, t) => {
            const type = {
                0: 'unshift',
                1: 'push'
            }[t];
            propsContacts.value[type](data);
        };

        const appendContact = (contact) => {
            if (isEmpty(contact.id) || isEmpty(contact.displayName)) {
                console.error('id | displayName cant be empty');
                return false;
            }
            if (hasContact(contact.id)) return true;
            propsContacts.value.push(
                Object.assign(
                    {
                        id: '',
                        displayName: '',
                        avatar: '',
                        index: '',
                        unread: 0,
                        lastSendTime: '',
                        lastContent: ''
                    },
                    contact
                )
            );
            return true;
        };

        // 移除联系人
        const removeContact = (id) => {
            const index = findContactIndexById(id);
            if (index === -1) return false;
            propsContacts.value.splice(index, 1);
            CacheDraft.remove(id);
            CacheMessageLoaded.remove(id);
            return true;
        };

        /**
         * 修改联系人数据
         * @param {Contact} contact 修改的数据，根据 contact.id 查找联系人并覆盖传入的值
         */
        const updateContact = (contact) => {
            const contactId = contact.id;
            delete contact.id;

            const index = findContactIndexById(contactId);
            if (index !== -1) {
                const { unread } = contact;
                if (isString(unread)) {
                    if (unread.indexOf('+') === 0 || unread.indexOf('-') === 0) {
                        contact.unread = parseInt(unread) + parseInt(propsContacts.value[index].unread);
                    }
                }
                propsContacts.value[index] = {
                    ...propsContacts.value[index],
                    ...contact
                };
                // debugger
                // this.$set(contacts, index, {
                //     ...contacts[index],
                //     ...contact
                // });
            }
        };

        /**
         * 删除一条聊天消息
         * @param messageId 消息 id
         * @param contactId 联系人 id
         */
        const removeMessage = (messageId) => {
            const message = findMessage(messageId);
            if (!message) return false;
            const index = allMessages.value[message.toContactId].findIndex(
                ({ id }) => id === messageId
            );
            allMessages.value[message.toContactId].splice(index, 1);
            return true;
        };

        /**
         * 修改聊天一条聊天消息
         * @param {Message} message 根据 message.id 查找聊天消息并覆盖传入的值
         * @param contactId 联系人 id
         */
        const updateMessage = (message) => {
            if (!message.id) return false;
            debugger
            let historyMessage = findMessage(message.id);
            if (!historyMessage) return false;
            historyMessage = Object.assign(historyMessage, message, {
                toContactId: historyMessage.toContactId
            });
            return true;
        };

        /**
         * 手动更新对话消息
         * @param {String} messageId 消息ID，如果为空则更新当前聊天窗口的所有消息
         */
        const forceUpdateMessage = (messageId) => {
            if (!messageId) {
                messagesRef.value.$forceUpdate();
            } else {
                // const components = this.$refs.messagesRef.$refs.message;
                const components = messagesRef.value.$refs.message;
                if (components) {
                    const messageComponent = components.find(
                        com => com.$attrs.message.id === messageId
                    );
                    if (messageComponent) messageComponent.$forceUpdate();
                }
            }
        };


        /**
         * 将字符串内的 EmojiItem.name 替换为 img
         * @param {String} str 被替换的字符串
         * @return {String} 替换后的字符串
         */
        const emojiNameToImage = str => str.replace(/\[!(\w+)\]/gi, (_str, match) => {
            const file = match;
            return emojiMap[file]
                ? `<img emoji-name="${match}" src="${emojiMap[file]}" />`
                : `[!${match}]`;
        });

        /**
         * 设置最新消息DOM
         * @param {String} messageType 消息类型
         * @param {Function} render 返回消息 vnode
         */
        const setLastContentRender = (messageType, render) => {
            lastContentRender[messageType] = render;
        };

        const _lastContentRender = (message) => {
            if (!isFunction(lastContentRender[message.type])) {
                console.error(
                    `not found '${message.type}' of the latest message renderer,try to use ‘setLastContentRender()’`
                );
                return '';
            }
            return lastContentRender[message.type].call({ emojiNameToImage }, message);
        };

        // 设置联系人的草稿信息
        const setDraft = (cid, editorValue) => {
            if (isEmpty(cid) || isEmpty(editorValue)) return false;
            const contact = findContact(cid);
            if (isEmpty(contact)) return false;

            let lastContent = contact.lastContent;
            if (CacheDraft.has(cid)) {
                lastContent = CacheDraft.get(cid).lastContent;
            }
            CacheDraft.set(cid, {
                editorValue,
                lastContent
            });
            updateContact({
                id: cid,
                lastContent: `<span style="color:red;">[草稿]</span><span>${_lastContentRender({ type: 'text', content: editorValue })}</span>`,
                lastSendTime: Date.now()
            });
        };

        // 创建消息
        const _createMessage = message => ({
            ...{
                id: generateUUID(),
                type: 'text',
                status: 'going',
                sendTime: Date.now(),
                toContactId: state.currentContactId,
                fromUser: {
                    ...props.user
                }
            },
            ...message
        });

        const updateCurrentMessages = () => {
            if (!allMessages.value[state.currentContactId]) { allMessages.value[state.currentContactId] = []; }
            // currentMessages.value = [...allMessages[state.currentContactId]]
            state.currentMessages = allMessages.value[state.currentContactId];
            // debugger
        };

        watch(state.currentMessages, () => {
            console.log('---------------------currentMessages-----------------------')
            // updateCurrentMessages();
        })

        const getCurrentMessages = () => {
            // return currentMessages.value;
            return state.currentMessages;
        }

        const _addMessage = (message, contactId, t) => {
            const type = {
                0: 'unshift',
                1: 'push'
            }[t];
            // debugger
            if (!Array.isArray(message)) message = [message];
            allMessages.value[contactId] = allMessages.value[contactId] || [];
            debugger
            allMessages.value[contactId][type](...message);
            debugger
        };

        // 当前聊天窗口滚动到底部
        const messageViewToBottom = () => {
            messagesRef.value.scrollToBottom();
        };

        // 新增一条消息
        const appendMessage = (message, scrollToBottom = false) => {
            if (!allMessages.value[message.toContactId]) {
                updateContact({
                    id: message.toContactId,
                    unread: '+1',
                    lastSendTime: message.sendTime,
                    lastContent: _lastContentRender(message)
                });
            } else {
                _addMessage(message, message.toContactId, 1);
                const updateContactInfo = {
                    id: message.toContactId,
                    lastContent: _lastContentRender(message),
                    lastSendTime: message.sendTime
                };
                if (message.toContactId === state.currentContactId) {
                    if (scrollToBottom === true) {
                        messageViewToBottom();
                    }
                    CacheDraft.remove(message.toContactId);
                } else {
                    updateContactInfo.unread = '+1';
                }
                updateContact(updateContactInfo);
            }
        };

        const _emitSend = (message, next, file) => {
            emit('send', message, (replaceMessage = { status: 'succeed' }) => {
                next();
                debugger
                updateMessage(Object.assign(message, replaceMessage));
            }, file);
        };

        // 处理发送消息
        const _handleSend = (text) => {
            const message = _createMessage({ content: text });
            debugger
            appendMessage(message, true);
            _emitSend(message, () => {
                updateContact({
                    id: message.toContactId,
                    lastContent: _lastContentRender(message),
                    lastSendTime: message.sendTime
                });
                CacheDraft.remove(message.toContactId);
            });
        };
        // 处理上传
        const _handleUpload = (file) => {
            const imageTypes = ['image/gif', 'image/jpeg', 'image/png'];
            let joinMessage;
            if (imageTypes.includes(file.type)) {
                joinMessage = {
                    type: 'image',
                    content: URL.createObjectURL(file)
                };
            } else {
                joinMessage = {
                    type: 'file',
                    fileSize: file.size,
                    fileName: file.name,
                    content: ''
                };
            }
            const message = _createMessage(joinMessage);
            appendMessage(message, true);
            _emitSend(
                message,
                () => {
                    updateContact({
                        id: message.toContactId,
                        lastContent: this.lastContentRender(message),
                        lastSendTime: message.sendTime
                    });
                },
                file
            );
        };

        // 拉取消息
        const _emitPullMessages = (next) => {
            state._changeContactLock = true;
            emit(
                'pull-messages',
                currentContact.value,
                (messagesList = [], isEnd = false) => {
                    _addMessage(messagesList, state.currentContactId, 0);
                    CacheMessageLoaded.set(state.currentContactId, isEnd);
                    if (isEnd === true) messagesRef.value.loaded();
                    updateCurrentMessages();
                    state._changeContactLock = false;
                    next(isEnd);
                },
                props
            );
        };

        const setEditorValue = (val = '') => {
            if (!isString(val)) return false;
            editorRef.value.setValue(emojiNameToImage(val));
        };

        /**
         * 清空联系人草稿信息
         */
        const clearDraft = (contactId) => {
            const draft = CacheDraft.get(contactId);
            if (draft) {
                const currentContent = findContact(contactId).lastContent;
                if (
                    currentContent.indexOf('<span style="color:red;">[草稿]</span>') === 0
                ) {
                    updateContact({
                        id: contactId,
                        lastContent: draft.lastContent,
                        lastSendTime: Date.now()
                    });
                }
                CacheDraft.remove(contactId);
            }
        };

        const clearCacheContainer = (name) => {
            CacheContactContainer.remove(name);
            CacheMenuContainer.remove(name);
        };

        /**
         * 改变聊天对象
         * @param contactId 联系人 id
         */
        const changeContact = async (contactId, menuName) => {
            if (menuName) {
                changeMenu(menuName);
            } else if (state._changeContactLock || state.currentContactId === contactId) {
                return false;
            }

            // 保存上个聊天目标的草稿
            if (state.currentContactId) {
                const editorValue = clearHtmlExcludeImg(getEditorValue()).trim();
                // debugger
                if (editorValue) {
                    setDraft(state.currentContactId, editorValue);
                    setEditorValue();
                } else {
                    clearDraft(state.currentContactId);
                }
            }
            state.currentContactId = contactId;
            if (!state.currentContactId) return false;

            emit('change-contact', currentContact.value, props);
            if (isFunction(currentContact.value.renderContainer) || state.activeSidebar === DEFAULT_MENU_CONTACTS) return;

            // 填充草稿内容
            const draft = CacheDraft.get(contactId);
            if (draft) setEditorValue(draft.editorValue);

            if (CacheMessageLoaded.has(contactId)) {
                messagesRef.value.loaded();
            } else {
                messagesRef.value.resetLoadState();
            }

            // debugger
            if (!allMessages.value[contactId]) {
                updateCurrentMessages();
                // eslint-disable-next-line no-unused-vars
                _emitPullMessages((isEnd) => {
                    messageViewToBottom();
                });
            } else {
                setTimeout(() => {
                    updateCurrentMessages();
                    messageViewToBottom();
                }, 0);
            }
        };

        /**
         * 返回所有消息
         * @return {Object<Contact.id,Message>}
         */
        const getMessages = contactId => (contactId ? allMessages.value[contactId] : allMessages.value) || [];


        /**
         * 清空某个联系人的消息，切换到该联系人时会重新触发 pull-messages 事件
         */
        const clearMessages = (contactId) => {
            if (contactId) {
                delete allMessages.value[contactId];
                CacheMessageLoaded.remove(contactId);
                CacheDraft.remove(contactId);
            } else {
                allMessages.value = {};
                CacheMessageLoaded.remove();
                CacheDraft.remove();
            }
            return true;
        };

        // 打开抽屉
        const openDrawer = (params) => {
            renderDrawerContent = isFunction(params)
                ? params
                : params.render || function () {};
            const wrapperWidth = wrapperRef.value.clientWidth;
            const wrapperHeight = wrapperRef.value.clientHeight;
            let drawerWidth = params.width || 200;
            let drawerHeight = params.height || wrapperHeight;
            let offsetX = params.offsetX || 0;
            let offsetY = params.offsetY || 0;
            const position = params.position || 'right';
            if (isString(drawerWidth)) drawerWidth = wrapperWidth * toPoint(drawerWidth);
            if (isString(drawerHeight)) drawerHeight = wrapperHeight * toPoint(drawerHeight);
            if (isString(offsetX)) offsetX = wrapperWidth * toPoint(offsetX);
            if (isString(offsetY)) offsetY = wrapperHeight * toPoint(offsetY);

            drawerRef.value.style.width = `${drawerWidth}px`;
            drawerRef.value.style.height = `${drawerHeight}px`;

            let left = 0;
            let top = 0;
            let shadow = '';
            if (position === 'right') {
                left = wrapperWidth;
            } else if (position === 'rightInside') {
                left = wrapperWidth - drawerWidth;
                shadow = '-15px 0 16px -14px rgba(0,0,0,0.08)';
            } else if (position === 'center') {
                left = wrapperWidth / 2 - drawerWidth / 2;
                top = wrapperHeight / 2 - drawerHeight / 2;
                shadow = '0 0 20px rgba(0,0,0,0.08)';
            }
            left += offsetX;
            top += offsetY + -1;
            drawerRef.value.style.top = `${top}px`;
            drawerRef.value.style.left = `${left}px`;
            drawerRef.value.style.boxShadow = shadow;

            state.drawerVisible = true;
        };

        // 关闭抽屉
        const closeDrawer = () => {
            state.drawerVisible = false;
        };

        // 抽屉变化
        const changeDrawer = (params) => {
            state.drawerVisible = !state.drawerVisible;
            if (state.drawerVisible === true) openDrawer(params);
        };

        // 初始化当前联系人
        const initCurrentContact = (contactId) => {
            // debugger
            changeContact(contactId)
        }

        // 渲染包裹容器
        const _renderWrapper = children => {
            return () => (
                <div
                    style={{
                        width: toPx(props.width),
                        height: toPx(props.height)
                    }}
                    ref={wrapperRef}
                    class={[
                        'witalk-wrapper',
                        `witalk-wrapper-theme-${props.theme}`,
                        { 'witalk-wrapper-simple': props.simple },
                        state.drawerVisible && 'witalk-wrapper-drawer-show'
                    ]}
                >
                    {children.map(item => item())}
                </div>
            )
        };

        // 渲染菜单子项
        const _renderMenuItem = () => {
            const top = [];
            const bottom = [];
            menus.forEach((item) => {
                const {
                    name, title, unread, render, click
                } = item;
                const node = (
                    <div
                        class={[
                            'witalk-menu-item',
                            { 'witalk-menu-item-active': state.activeSidebar === name }
                        ]}
                        onClick={() => {
                            funCall(click, () => {
                                if (name) changeMenu(name);
                            });
                        }}
                        title={title}
                    >
                        <witalk-badge count={unread}>{render(item)}</witalk-badge>
                    </div>
                );
                item.isBottom === true ? bottom.push(node) : top.push(node);
            });
            return {
                top,
                bottom
            };
        };

        // 渲染菜单
        const _renderMenu = () => {
            const menuItem = _renderMenuItem();
            return (
                <div class="witalk-menu" v-show={!props.hideMenu}>
                    <witalk-avatar
                        v-show={!props.hideMenuAvatar}
                        onClick={(e) => {
                            emit('menu-avatar-click', e);
                        }}
                        class="witalk-menu-avatar"
                        src={props.user.avatar}
                    />
                    {menuItem.top}
                    {slots.menu?.menu()}
                    <div class="witalk-menu-bottom">
                        {slots['menu-bottom']?.()}
                        {menuItem.bottom}
                    </div>
                </div>
            );
        };

        const _renderSidebar = (children, name, fixedtop) => {
            return (
                <div
                    class="witalk-sidebar"
                    v-show={state.activeSidebar === name}
                    onScroll={_handleSidebarScroll}
                >
                    <div class="witalk-sidebar-fixed-top">{fixedtop}</div>
                    <div class="witalk-sidebar-scroll">{children}</div>
                </div>
            );
        }

        const _renderContact = (_props, onClick, slot) => {
            const { id: contactId, click: customClick, renderContainer } = _props.contact;
            // debugger
            const click = () => {
                funCall(customClick, () => {
                    onClick();
                    _customContainerReady(
                        renderContainer,
                        CacheContactContainer,
                        contactId
                    );
                });
            };

            return (
                <witalk-contact
                    class={{
                        'witalk-contact-active': state.currentContactId === contactId
                    }}
                    v-witalk-contextmenu_contact={props.contactContextmenu}
                    {..._props}
                    onClick={click}
                    v-slots={{ default: slot }}
                />
            );
        };

        // 渲染侧边栏最近消息列表（最近联系人）
        const _renderSidebarMessage = () => _renderSidebar(
            [
                renderSlot(slots['sidebar-message-top'], null, props),
                lastMessages.value.map(contact => _renderContact(
                    { contact, timeFormat: props.contactTimeFormat },
                    () => changeContact(contact.id),
                    slots['sidebar-message']
                ))
            ],
            DEFAULT_MENU_LASTMESSAGES,
            renderSlot(slots['sidebar-message-fixedtop'], null, props)
        );

        // 渲染侧边栏通讯录列表
        const _renderSidebarContact = () => {
            let prevIndex;
            return _renderSidebar(
                [
                    renderSlot(slots['sidebar-contact-top'], null, props),
                    propsContacts.value.map((contact) => {
                        if (!contact.index) return;
                        contact.index = contact.index.replace(/\[[0-9]*\]/, '');
                        const node = [
                            contact.index !== prevIndex && (
                                <p class="witalk-sidebar-label">{contact.index}</p>
                            ),
                            _renderContact(
                                { contact, simple: true },
                                () => changeContact(contact.id),
                                slots['sidebar-contact']
                            )
                        ];
                        prevIndex = contact.index;
                        return node;
                    })
                ],
                DEFAULT_MENU_CONTACTS,
                renderSlot(slots['sidebar-contact-fixedtop'], null, props)
            );
        };


        const _renderContainer = () => {
            const nodes = [];

            const cls = 'witalk-container';
            const currContact = currentContact.value;
            let defIsShow = true;
            const _cacheContactContainer = CacheContactContainer.get();
            // eslint-disable-next-line no-restricted-syntax
            for (const name in _cacheContactContainer) {
                if (Object.prototype.hasOwnProperty.call(_cacheContactContainer, name)) {
                    const show = currContact.id === name && currentIsDefSidebar.value;
                    defIsShow = !show;
                    nodes.push(
                        <div class={cls} v-show={show}>
                            {CacheContactContainer.get(name)}
                        </div>
                    );
                }
            }

            const _cacheMenuContainer = CacheMenuContainer.get();
            // eslint-disable-next-line no-restricted-syntax
            for (const name in _cacheMenuContainer) {
                if (Object.prototype.hasOwnProperty.call(_cacheMenuContainer, name)) {
                    nodes.push(
                        <div
                            class={cls}
                            v-show={state.activeSidebar === name && !currentIsDefSidebar.value}
                        >
                            {CacheMenuContainer.get(name)}
                        </div>
                    );
                }
            }
            // debugger
            nodes.push(
                <div class={cls} v-show={_menuIsMessages() && defIsShow && currContact.id}>
                    <div class="witalk-container-title">
                        {renderSlot(
                            slots['message-title'],
                            <div class="witalk-container-displayname">
                                {currContact.displayName}
                            </div>,
                            currContact
                        )}
                    </div>
                    <div class="witalk-vessel">
                        <div class="witalk-vessel-left">
                            <witalk-messages
                                ref={messagesRef}
                                loadingText={props.loadingText}
                                loadendText={props.loadendText}
                                hideTime={props.hideMessageTime}
                                hideName={props.hideMessageName}
                                timeFormat={props.messageTimeFormat}
                                reverseUserId={props.user.id}
                                onReachTop={_emitPullMessages}
                                messages={state.currentMessages}
                            />
                            <witalk-editor
                                ref={editorRef}
                                tools={editorTools}
                                sendText={props.sendText}
                                sendKey={props.sendKey}
                                onSend={_handleSend}
                                onUpload={_handleUpload}
                                // scopedSlots={{
                                //     editorFooter: this.$slots.editorFooter
                                // }}
                            />
                        </div>
                        <div class="witalk-vessel-right">
                            {renderSlot(slots['message-side'], null, currContact)}
                        </div>
                    </div>
                </div>
            );
            nodes.push(
                <div class={cls} v-show={!currContact.id && currentIsDefSidebar.value}>
                    {slots.cover?.()}
                </div>
            );
            nodes.push(
                <div
                    class={cls}
                    v-show={_menuIsContacts() && defIsShow && currContact.id}
                >
                {renderSlot(
                    slots['contact-info'],
                    <div class="witalk-contact-info">
                        <witalk-avatar src={currContact.avatar} size={90} />
                        <h4>{currContact.displayName}</h4>
                        <witalk-button
                            onClick={() => {
                                debugger
                                if (isEmpty(currContact.lastContent)) {
                                    updateContact({
                                        id: currContact.id,
                                        lastContent: ' ',
                                        lastSendTime: Date.now()
                                    });
                                }
                                changeContact(currContact.id, DEFAULT_MENU_LASTMESSAGES);
                            }}
                        >
                            发送消息
                        </witalk-button>
                    </div>,
                    currContact
                )}
                </div>
            );
            return nodes;
        };

        const _renderDrawer = () => (_menuIsMessages() && state.currentContactId ? (
              <div class="witalk-drawer" ref={drawerRef}>
                  {renderDrawerContent(currentContact.value)}
                  {renderSlot(slots.drawer, '', currentContact.value)}
              </div>) : (''));

        
        initMenus();
        initContacts();

        provide('IMUI', {
            ...context,
            emojiNameToImage
        });

        // 
        onMounted(async () => {
            // initMenus();
            initCurrentContact(props.currentContactId);
            console.log('messagesRef:', messagesRef.value)

            await nextTick();
        });

        return _renderWrapper([
            _renderMenu,
            _renderSidebarMessage,
            _renderSidebarContact,
            _renderContainer,
            _renderDrawer
        ]);
    },
    // watch: {
    //     activeSidebar() {}
    // },
});
</script>
<style lang="less">
.witalk-wrapper {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  font-size: 14px;
  font-family: "Microsoft YaHei";
  background: #efefef;
  -webkit-transition: all 0.4s cubic-bezier(0.645, 0.045, 0.355, 1);
  transition: all 0.4s cubic-bezier(0.645, 0.045, 0.355, 1);
  position: relative;
}
.witalk-wrapper p {
  margin: 0;
}
.witalk-wrapper img {
  vertical-align: middle;
  border-style: none;
}
.witalk-menu {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -ms-flex-direction: column;
  flex-direction: column;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  width: 60px;
  background: #1d232a;
  padding: 15px 0;
  position: relative;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
.witalk-menu-bottom {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -ms-flex-direction: column;
  flex-direction: column;
  position: absolute;
  bottom: 0;
}
.witalk-menu-avatar {
  margin-bottom: 20px;
  cursor: pointer;
}
.witalk-menu-item {
  color: #999;
  cursor: pointer;
  padding: 14px 10px;
  max-width: 100%;
  word-break: break-all;
  word-wrap: break-word;
  white-space: pre-wrap;
}
.witalk-menu-item-active {
  color: #0fd547;
}
.witalk-menu-item:hover:not(.witalk-menu-item-active) {
  color: #eee;
}
.witalk-menu-item > * {
  font-size: 24px;
}
.witalk-menu-item .ant-badge-count {
  display: inline-block;
  padding: 0 4px;
  height: 18px;
  line-height: 16px;
  min-width: 18px;
}
.witalk-menu-item .ant-badge-count,
.witalk-menu-item .ant-badge-dot {
  -webkit-box-shadow: 0 0 0 1px #1d232a;
  box-shadow: 0 0 0 1px #1d232a;
}
.witalk-sidebar {
  width: 250px;
  background: #efefef;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -ms-flex-direction: column;
  flex-direction: column;
}
.witalk-sidebar-scroll {
  overflow-y: auto;
}
.witalk-sidebar-scroll::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
.witalk-sidebar-scroll::-webkit-scrollbar-track-piece {
  background-color: transparent;
}
.witalk-sidebar-scroll::-webkit-scrollbar-thumb:vertical {
  height: 5px;
  background-color: #aaa;
}
.witalk-sidebar-scroll::-webkit-scrollbar-thumb:horizontal {
  width: 5px;
  background-color: transparent;
}
.witalk-sidebar-label {
  padding: 6px 14px 6px 14px;
  color: #666;
  font-size: 12px;
  margin: 0;
  text-align: left;
}
.witalk-sidebar .witalk-contact-active {
  background: #d9d9d9;
}
.witalk-container {
  -webkit-box-flex: 1;
  -ms-flex: 1;
  flex: 1;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -ms-flex-direction: column;
  flex-direction: column;
  background: #f4f4f4;
  word-break: break-all;
  word-wrap: break-word;
  white-space: pre-wrap;
  position: relative;
  z-index: 10;
}
.witalk-container-title {
  padding: 15px 15px;
}
.witalk-container-displayname {
  font-size: 16px;
}
.witalk-vessel {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-flex: 1;
  -ms-flex: 1;
  flex: 1;
  min-height: 100px;
}
.witalk-vessel-left {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -ms-flex-direction: column;
  flex-direction: column;
  -webkit-box-flex: 1;
  -ms-flex: 1;
  flex: 1;
}
.witalk-vessel-right {
  -webkit-box-flex: 0;
  -ms-flex: none;
  flex: none;
}
.witalk-messages {
  -webkit-box-flex: 1;
  -ms-flex: 1;
  flex: 1;
  height: auto;
}
.witalk-drawer {
  position: absolute;
  top: 0;
  overflow: hidden;
  background: #f6f6f6;
  z-index: 11;
  display: none;
}
.witalk-wrapper-drawer-show .witalk-drawer {
  display: block;
}
.witalk-contact-info {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -ms-flex-direction: column;
  flex-direction: column;
  -webkit-box-pack: center;
  -ms-flex-pack: center;
  justify-content: center;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  height: 100%;
}
.witalk-contact-info h4 {
  font-size: 16px;
  font-weight: normal;
  margin: 10px 0 20px 0;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
.witalk-wrapper-theme-blue .witalk-message-content {
  background: #f3f3f3;
}
.witalk-wrapper-theme-blue .witalk-message-content::before {
  border-right-color: #f3f3f3;
}
.witalk-wrapper-theme-blue .witalk-message-reverse .witalk-message-content {
  background: #e6eeff;
}
.witalk-wrapper-theme-blue
  .witalk-message-reverse
  .witalk-message-content::before {
  border-left-color: #e6eeff;
}
.witalk-wrapper-theme-blue .witalk-container {
  background: #fff;
}
.witalk-wrapper-theme-blue .witalk-sidebar {
  background: #f9f9f9;
}
.witalk-wrapper-theme-blue .witalk-sidebar .witalk-contact {
  background: #f9f9f9;
}
.witalk-wrapper-theme-blue
  .witalk-sidebar
  .witalk-contact:hover:not(.witalk-contact-active) {
  background: #f1f1f1;
}
.witalk-wrapper-theme-blue .witalk-sidebar .witalk-contact-active {
  background: #e9e9e9;
}
.witalk-wrapper-theme-blue .witalk-menu {
  background: #096bff;
}
.witalk-wrapper-theme-blue .witalk-menu-item {
  color: rgba(255, 255, 255, 0.4);
}
.witalk-wrapper-theme-blue
  .witalk-menu-item:hover:not(.witalk-menu-item-active) {
  color: rgba(255, 255, 255, 0.6);
}
.witalk-wrapper-theme-blue .witalk-menu-item-active {
  color: #fff;
  text-shadow: 0 0 10px rgba(2, 48, 118, 0.4);
}
.witalk-wrapper-simple .witalk-menu,
.witalk-wrapper-simple .witalk-sidebar {
  display: none;
}
.witalk-wrapper-simple .witalk-menu,
.witalk-wrapper-simple .witalk-sidebar {
  display: none;
}
.witalk-contextmenu {
  border-radius: 4px;
  font-size: 14px;
  font-variant: tabular-nums;
  line-height: 1.5;
  color: rgba(0, 0, 0, 0.65);
  z-index: 9999;
  background-color: #fff;
  border-radius: 6px;
  -webkit-box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: absolute;
  -webkit-transform-origin: 50% 150%;
  transform-origin: 50% 150%;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  overflow: hidden;
  min-width: 120px;
}
.witalk-contextmenu-item {
  font-size: 14px;
  line-height: 16px;
  padding: 10px 15px;
  cursor: pointer;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  color: #333;
}
.witalk-contextmenu-item > span {
  display: inline-block;
  -webkit-box-flex: 0;
  -ms-flex: none;
  flex: none;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
.witalk-contextmenu-item:hover {
  background: #f3f3f3;
  color: #000;
}
.witalk-contextmenu-item:active {
  background: #e9e9e9;
}
.witalk-contextmenu-icon {
  font-size: 16px;
  margin-right: 4px;
}
</style>
