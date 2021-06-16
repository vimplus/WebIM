<script>
import {
    useScopedSlot,
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
import contextmenu from '../directives/contextmenu';
import lastContentRender from '../lastContentRender';


let allMessages = {};
const emojiMap = {};
const toPx = val => (isString(val) ? val : `${val}px`);
const toPoint = str => str.replace('%', '') / 100;

let renderDrawerContent = () => {};

export default {
    name: 'WitalkImui',
    provide() {
        return {
            IMUI: this
        };
    },
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
        user: {
            type: Object,
            default: () => ({})
        }
    },
    data() {
        this.CacheContactContainer = new MemoryCache();
        this.CacheMenuContainer = new MemoryCache();
        this.CacheMessageLoaded = new MemoryCache();
        this.CacheDraft = new MemoryCache();
        return {
            drawerVisible: !this.hideDrawer,
            currentContactId: null,
            currentMessages: [],
            activeSidebar: DEFAULT_MENU_LASTMESSAGES,
            contacts: [],
            menus: [],
            editorTools: []
        };
    },
    computed: {
        currentContact() {
            return this.contacts.find(item => item.id === this.currentContactId) || {};
        },
        currentMenu() {
            return this.menus.find(item => item.name === this.activeSidebar) || {};
        },
        currentIsDefSidebar() {
            return DEFAULT_MENUS.includes(this.activeSidebar);
        },
        lastMessages() {
            const data = this.contacts.filter(item => !isEmpty(item.lastContent));
            data.sort((a1, a2) => a2.lastSendTime - a1.lastSendTime);
            return data;
        }
    },
    watch: {
        activeSidebar() {}
    },
    created() {
        this.initMenus();
    },
    async mounted() {
        await this.$nextTick();
    },
    methods: {
        _menuIsContacts() {
            return this.activeSidebar === DEFAULT_MENU_CONTACTS;
        },
        _menuIsMessages() {
            return this.activeSidebar === DEFAULT_MENU_LASTMESSAGES;
        },
        _createMessage(message) {
            return {
                ...{
                    id: generateUUID(),
                    type: 'text',
                    status: 'going',
                    sendTime: new Date().getTime(),
                    toContactId: this.currentContactId,
                    fromUser: {
                        ...this.user
                    }
                },
                ...message
            };
        },
        /**
         * 新增一条消息
         */
        appendMessage(message, scrollToBottom = false) {
            if (!allMessages[message.toContactId]) {
                this.updateContact({
                    id: message.toContactId,
                    unread: '+1',
                    lastSendTime: message.sendTime,
                    lastContent: this.lastContentRender(message)
                });
            } else {
                this._addMessage(message, message.toContactId, 1);
                const updateContact = {
                    id: message.toContactId,
                    lastContent: this.lastContentRender(message),
                    lastSendTime: message.sendTime
                };
                if (message.toContactId === this.currentContactId) {
                    if (scrollToBottom === true) {
                        this.messageViewToBottom();
                    }
                    this.CacheDraft.remove(message.toContactId);
                } else {
                    updateContact.unread = '+1';
                }
                this.updateContact(updateContact);
            }
        },
        _emitSend(message, next, file) {
            this.$emit(
                'send',
                message,
                (replaceMessage = { status: 'succeed' }) => {
                    next();
                    this.updateMessage(Object.assign(message, replaceMessage));
                },
                file
            );
        },
        _handleSend(text) {
            const message = this._createMessage({ content: text });
            this.appendMessage(message, true);
            this._emitSend(message, () => {
                this.updateContact({
                    id: message.toContactId,
                    lastContent: this.lastContentRender(message),
                    lastSendTime: message.sendTime
                });
                this.CacheDraft.remove(message.toContactId);
            });
        },
        _handleUpload(file) {
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
            const message = this._createMessage(joinMessage);
            this.appendMessage(message, true);
            this._emitSend(
                message,
                () => {
                    this.updateContact({
                        id: message.toContactId,
                        lastContent: this.lastContentRender(message),
                        lastSendTime: message.sendTime
                    });
                },
                file
            );
        },
        _emitPullMessages(next) {
            this._changeContactLock = true;
            this.$emit(
                'pull-messages',
                this.currentContact,
                (messages = [], isEnd = false) => {
                    this._addMessage(messages, this.currentContactId, 0);
                    this.CacheMessageLoaded.set(this.currentContactId, isEnd);
                    if (isEnd === true) this.$refs.messages.loaded();
                    this.updateCurrentMessages();
                    this._changeContactLock = false;
                    next(isEnd);
                },
                this
            );
        },
        clearCacheContainer(name) {
            this.CacheContactContainer.remove(name);
            this.CacheMenuContainer.remove(name);
        },
        _renderWrapper(children) {
            return (
                <div
                    style={{
                        width: toPx(this.width),
                        height: toPx(this.height)
                    }}
                    ref="wrapper"
                    class={[
                        'witalk-wrapper',
                        `witalk-wrapper-theme-${this.theme}`,
                        { 'witalk-wrapper-simple': this.simple },
                        this.drawerVisible && 'witalk-wrapper-drawer-show'
                    ]}
                >
                    {children}
                </div>
            );
        },
        _renderMenu() {
            const menuItem = this._renderMenuItem();
            return (
                <div class="witalk-menu" v-show={!this.hideMenu}>
                    {
                        <witalk-avatar
                            v-show={!this.hideMenuAvatar}
                            onClick={(e) => {
                                this.$emit('menu-avatar-click', e);
                            }}
                            class="witalk-menu-avatar"
                            src={this.user.avatar}
                        />
                    }
                    {menuItem.top}
                    {this.$slots.menu}
                    <div class="witalk-menu-bottom">
                        {this.$slots['menu-bottom']}
                        {menuItem.bottom}
                    </div>
                </div>
            );
        },
        _renderMenuAvatar() {

        },
        _renderMenuItem() {
            const top = [];
            const bottom = [];
            this.menus.forEach((item) => {
                const {
                    name, title, unread, render, click
                } = item;
                const node = (
                    <div
                        class={[
                            'witalk-menu-item',
                            { 'witalk-menu-item-active': this.activeSidebar === name }
                        ]}
                        onClick={() => {
                            funCall(click, () => {
                                if (name) this.changeMenu(name);
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
        },
        _renderSidebarMessage() {
            return this._renderSidebar(
                [
                    useScopedSlot(this.$scopedSlots['sidebar-message-top'], null, this),
                    this.lastMessages.map(contact => this._renderContact(
                        {
                            contact,
                            timeFormat: this.contactTimeFormat
                        },
                        () => this.changeContact(contact.id),
                        this.$scopedSlots['sidebar-message']
                    ))
                ],
                DEFAULT_MENU_LASTMESSAGES,
                useScopedSlot(
                    this.$scopedSlots['sidebar-message-fixedtop'],
                    null,
                    this
                )
            );
        },
        _renderContact(props, onClick, slot) {
            const {
                click: customClick,
                renderContainer,
                id: contactId
            } = props.contact;
            const click = () => {
                funCall(customClick, () => {
                    onClick();
                    this._customContainerReady(
                        renderContainer,
                        this.CacheContactContainer,
                        contactId
                    );
                });
            };

            return (
                <witalk-contact
                    class={{
                        'witalk-contact-active': this.currentContactId === props.contact.id
                    }}
                    v-witalk-contextmenu_contact={this.contactContextmenu}
                    props={props}
                    onClick={click}
                    scopedSlots={{ default: slot }}
                />
            );
        },
        _renderSidebarContact() {
            let prevIndex;
            // console.log('this.$scopedSlots:', this.$scopedSlots);
            return this._renderSidebar(
                [
                    useScopedSlot(this.$scopedSlots['sidebar-contact-top'], null, this),
                    this.contacts.map((contact) => {
                        if (!contact.index) return;
                        contact.index = contact.index.replace(/\[[0-9]*\]/, '');
                        const node = [
                            contact.index !== prevIndex && (
                                <p class="witalk-sidebar-label">{contact.index}</p>
                            ),
                            this._renderContact(
                                {
                                    contact,
                                    simple: true
                                },
                                () => {
                                    this.changeContact(contact.id);
                                },
                                this.$scopedSlots['sidebar-contact']
                            )
                        ];
                        prevIndex = contact.index;
                        return node;
                    })
                ],
                DEFAULT_MENU_CONTACTS,
                useScopedSlot(
                    this.$scopedSlots['sidebar-contact-fixedtop'],
                    null,
                    this
                )
            );
        },
        _renderSidebar(children, name, fixedtop) {
            return (
                <div
                    class="witalk-sidebar"
                    v-show={this.activeSidebar === name}
                    on-scroll={this._handleSidebarScroll}
                >
                    <div class="witalk-sidebar-fixed-top">{fixedtop}</div>
                    <div class="witalk-sidebar-scroll">{children}</div>
                </div>
            );
        },
        _renderDrawer() {
            return this._menuIsMessages() && this.currentContactId ? (
              <div class="witalk-drawer" ref="drawer">
                {renderDrawerContent(this.currentContact)}
                {useScopedSlot(this.$scopedSlots.drawer, '', this.currentContact)}
              </div>) : ('');
        },
        _isContactContainerCache(name) {
            return name.startsWith('contact#');
        },
        _renderContainer() {
            const nodes = [];
            const cls = 'witalk-container';
            const curact = this.currentContact;
            let defIsShow = true;
            const cacheContactContainer = this.CacheContactContainer.get();
            // eslint-disable-next-line no-restricted-syntax
            for (const name in cacheContactContainer) {
                if (Object.prototype.hasOwnProperty.call(cacheContactContainer, name)) {
                    const show = curact.id === name && this.currentIsDefSidebar;
                    defIsShow = !show;
                    nodes.push(
                        <div class={cls} v-show={show}>
                            {this.CacheContactContainer.get(name)}
                        </div>
                    );
                }
            }

            const cacheMenuContainer = this.CacheMenuContainer.get();
            // eslint-disable-next-line no-restricted-syntax
            for (const name in this.CacheMenuContainer.get()) {
                if (Object.prototype.hasOwnProperty.call(cacheMenuContainer, name)) {
                    nodes.push(
                        <div
                            class={cls}
                            v-show={this.activeSidebar === name && !this.currentIsDefSidebar}
                        >
                            {this.CacheMenuContainer.get(name)}
                        </div>
                    );
                }
            }

            nodes.push(
                <div class={cls} v-show={this._menuIsMessages() && defIsShow && curact.id}>
                    <div class="witalk-container-title">
                        {useScopedSlot(
                            this.$scopedSlots['message-title'],
                            <div class="witalk-container-displayname">
                                {curact.displayName}
                            </div>,
                            curact
                        )}
                    </div>
                    <div class="witalk-vessel">
                        <div class="witalk-vessel-left">
                            <witalk-messages
                                ref="messages"
                                loading-text={this.loadingText}
                                loadend-text={this.loadendText}
                                hide-time={this.hideMessageTime}
                                hide-name={this.hideMessageName}
                                time-format={this.messageTimeFormat}
                                reverse-user-id={this.user.id}
                                on-reach-top={this._emitPullMessages}
                                messages={this.currentMessages}
                            />
                            <witalk-editor
                                ref="editor"
                                tools={this.editorTools}
                                sendText={this.sendText}
                                sendKey={this.sendKey}
                                onSend={this._handleSend}
                                onUpload={this._handleUpload}
                                // scopedSlots={{
                                //     editorFooter: this.$scopedSlots.editorFooter
                                // }}
                            />
                        </div>
                        <div class="witalk-vessel-right">
                            {useScopedSlot(this.$scopedSlots['message-side'], null, curact)}
                        </div>
                    </div>
                </div>
            );
            nodes.push(
                <div class={cls} v-show={!curact.id && this.currentIsDefSidebar}>
                    {this.$slots.cover}
                </div>
            );
            nodes.push(
                <div
                    class={cls}
                    v-show={this._menuIsContacts() && defIsShow && curact.id}
                >
                {useScopedSlot(
                    this.$scopedSlots['contact-info'],
                    <div class="witalk-contact-info">
                        <witalk-avatar src={curact.avatar} size={90} />
                        <h4>{curact.displayName}</h4>
                        <witalk-button
                            onClick={() => {
                                if (isEmpty(curact.lastContent)) {
                                    this.updateContact({
                                        id: curact.id,
                                        lastContent: ' '
                                    });
                                }
                                this.changeContact(curact.id, DEFAULT_MENU_LASTMESSAGES);
                            }}
                        >
                            发送消息
                        </witalk-button>
                    </div>,
                    curact
                )}
                </div>
            );
            return nodes;
        },
        _handleSidebarScroll() {
            contextmenu.hide();
        },
        _addContact(data, t) {
            const type = {
                0: 'unshift',
                1: 'push'
            }[t];
            this.contacts[type](data);
        },
        _addMessage(data, contactId, t) {
            const type = {
                0: 'unshift',
                1: 'push'
            }[t];
            if (!Array.isArray(data)) data = [data];
            allMessages[contactId] = allMessages[contactId] || [];
            allMessages[contactId][type](...data);
        },
        /**
         * 设置最新消息DOM
         * @param {String} messageType 消息类型
         * @param {Function} render 返回消息 vnode
         */
        setLastContentRender(messageType, render) {
            lastContentRender[messageType] = render;
        },
        lastContentRender(message) {
            if (!isFunction(lastContentRender[message.type])) {
                console.error(
                    `not found '${message.type}' of the latest message renderer,try to use ‘setLastContentRender()’`
                );
                return '';
            }
            return lastContentRender[message.type].call(this, message);
        },
        /**
         * 将字符串内的 EmojiItem.name 替换为 img
         * @param {String} str 被替换的字符串
         * @return {String} 替换后的字符串
         */
        emojiNameToImage(str) {
            // eslint-disable-next-line no-shadow
            return str.replace(/\[!(\w+)\]/gi, (str, match) => {
                const file = match;
                return emojiMap[file]
                    ? `<img emoji-name="${match}" src="${emojiMap[file]}" />`
                    : `[!${match}]`;
            });
        },
        emojiImageToName(str) {
            // eslint-disable-next-line no-useless-escape
            return str.replace(/<img emoji-name=\"([^\"]*?)\" [^>]*>/gi, '[!$1]');
        },
        updateCurrentMessages() {
            if (!allMessages[this.currentContactId]) { allMessages[this.currentContactId] = []; }
            this.currentMessages = allMessages[this.currentContactId];
        },
        /**
         * 将当前聊天窗口滚动到底部
         */
        messageViewToBottom() {
            this.$refs.messages.scrollToBottom();
        },
        /**
         * 设置联系人的草稿信息
         */
        setDraft(cid, editorValue) {
            if (isEmpty(cid) || isEmpty(editorValue)) return false;
            const contact = this.findContact(cid);
            let lastContent = contact.lastContent;
            if (isEmpty(contact)) return false;
            if (this.CacheDraft.has(cid)) {
                lastContent = this.CacheDraft.get(cid).lastContent;
            }
            this.CacheDraft.set(cid, {
                editorValue,
                lastContent
            });
            this.updateContact({
                id: cid,
                lastContent: `<span style="color:red;">[草稿]</span><span>${this.lastContentRender(
                    { type: 'text', content: editorValue }
                )}</span>`
            });
        },
        /**
         * 清空联系人草稿信息
         */
        clearDraft(contactId) {
            const draft = this.CacheDraft.get(contactId);
            if (draft) {
                const currentContent = this.findContact(contactId).lastContent;
                if (
                    currentContent.indexOf('<span style="color:red;">[草稿]</span>') === 0
                ) {
                    this.updateContact({
                        id: contactId,
                        lastContent: draft.lastContent
                    });
                }
                this.CacheDraft.remove(contactId);
            }
        },
        /**
         * 改变聊天对象
         * @param contactId 联系人 id
         */
        async changeContact(contactId, menuName) {
            if (menuName) {
                this.changeMenu(menuName);
            } else if (this._changeContactLock || this.currentContactId === contactId) { return false; }

            // 保存上个聊天目标的草稿
            if (this.currentContactId) {
                const editorValue = clearHtmlExcludeImg(this.getEditorValue()).trim();
                if (editorValue) {
                    this.setDraft(this.currentContactId, editorValue);
                    this.setEditorValue();
                } else {
                    this.clearDraft(this.currentContactId);
                }
            }

            this.currentContactId = contactId;
            if (!this.currentContactId) return false;

            this.$emit('change-contact', this.currentContact, this);
            if (
                isFunction(this.currentContact.renderContainer)
                || this.activeSidebar === DEFAULT_MENU_CONTACTS
            ) {
                return;
            }
            // 填充草稿内容
            const draft = this.CacheDraft.get(contactId);
            if (draft) this.setEditorValue(draft.editorValue);

            if (this.CacheMessageLoaded.has(contactId)) {
                this.$refs.messages.loaded();
            } else {
                this.$refs.messages.resetLoadState();
            }

            if (!allMessages[contactId]) {
                this.updateCurrentMessages();
                // eslint-disable-next-line no-unused-vars
                this._emitPullMessages((isEnd) => {
                    this.messageViewToBottom();
                });
            } else {
                setTimeout(() => {
                    this.updateCurrentMessages();
                    this.messageViewToBottom();
                }, 0);
            }
        },
        /**
         * 删除一条聊天消息
         * @param messageId 消息 id
         * @param contactId 联系人 id
         */
        removeMessage(messageId) {
            const message = this.findMessage(messageId);
            if (!message) return false;
            const index = allMessages[message.toContactId].findIndex(
                ({ id }) => id === messageId
            );
            allMessages[message.toContactId].splice(index, 1);
            return true;
        },
        /**
         * 修改聊天一条聊天消息
         * @param {Message} data 根据 data.id 查找聊天消息并覆盖传入的值
         * @param contactId 联系人 id
         */
        updateMessage(message) {
            if (!message.id) return false;
            let historyMessage = this.findMessage(message.id);
            if (!historyMessage) return false;
            historyMessage = Object.assign(historyMessage, message, {
                toContactId: historyMessage.toContactId
            });
            return true;
        },
        /**
         * 手动更新对话消息
         * @param {String} messageId 消息ID，如果为空则更新当前聊天窗口的所有消息
         */
        forceUpdateMessage(messageId) {
            if (!messageId) {
                this.$refs.messages.$forceUpdate();
            } else {
                const components = this.$refs.messages.$refs.message;
                if (components) {
                    const messageComponent = components.find(
                        com => com.$attrs.message.id === messageId
                    );
                    if (messageComponent) messageComponent.$forceUpdate();
                }
            }
        },
        _customContainerReady(render, cacheDrive, key) {
            if (isFunction(render) && !cacheDrive.has(key)) {
                cacheDrive.set(key, render.call(this));
            }
        },
        /**
         * 切换左侧按钮
         * @param {String} name 按钮 name
         */
        changeMenu(name) {
            this.$emit('change-menu', name);
            this.activeSidebar = name;
        },
        /**
         * 初始化编辑框的 Emoji 表情列表，是 Witalk-editor.initEmoji 的代理方法
         * @param {Array<Emoji,EmojiItem>} data emoji 数据
         * Emoji = {label: 表情,children: [{name: wx,title: 微笑,src: url}]} 分组
         * EmojiItem = {name: wx,title: 微笑,src: url} 无分组
         */
        initEmoji(data) {
            let flatData = [];
            this.$refs.editor.initEmoji(data);
            if (data[0].label) {
                data.forEach((item) => {
                    flatData.push(...item.children);
                });
            } else {
                flatData = data;
            }
            // eslint-disable-next-line no-return-assign
            flatData.forEach(({ name, src }) => (emojiMap[name] = src));
        },
        initEditorTools(data) {
            this.editorTools = data;
            this.$refs.editor.initTools(data);
        },
        /**
         * 初始化左侧按钮
         * @param {Array<Menu>} data 按钮数据
         */
        initMenus(data) {
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
            let menus = [];
            if (Array.isArray(data)) {
                const indexMap = {
                    messages: 0,
                    contacts: 1
                };
                const indexKeys = Object.keys(indexMap);
                menus = data.map((item) => {
                    if (indexKeys.includes(item.name)) {
                        return {
                            ...defaultMenus[indexMap[item.name]],
                            ...item,
                            ...{ renderContainer: null }
                        };
                    }

                    if (item.renderContainer) {
                        this._customContainerReady(
                            item.renderContainer,
                            this.CacheMenuContainer,
                            item.name
                        );
                    }

                    return item;
                });
            } else {
                menus = defaultMenus;
            }

            this.menus = menus;
        },
        /**
         * 初始化联系人数据
         * @param {Array<Contact>} data 联系人列表
         */
        initContacts(data) {
            this.contacts = data;
            this.sortContacts();
        },
        /**
         * 使用 联系人的 index 值进行排序
         */
        sortContacts() {
            this.contacts.sort((a, b) => {
                if (!a.index) return;
                return a.index.localeCompare(b.index);
            });
        },
        appendContact(contact) {
            if (isEmpty(contact.id) || isEmpty(contact.displayName)) {
                console.error('id | displayName cant be empty');
                return false;
            }
            if (this.hasContact(contact.id)) return true;
            this.contacts.push(
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
        },
        removeContact(id) {
            const index = this.findContactIndexById(id);
            if (index === -1) return false;
            this.contacts.splice(index, 1);
            this.CacheDraft.remove(id);
            this.CacheMessageLoaded.remove(id);
            return true;
        },
        /**
         * 修改联系人数据
         * @param {Contact} data 修改的数据，根据 Contact.id 查找联系人并覆盖传入的值
         */
        updateContact(data) {
            const contactId = data.id;
            delete data.id;

            const index = this.findContactIndexById(contactId);
            if (index !== -1) {
                const { unread } = data;
                if (isString(unread)) {
                    if (unread.indexOf('+') === 0 || unread.indexOf('-') === 0) {
                        data.unread = parseInt(unread) + parseInt(this.contacts[index].unread);
                    }
                }
                this.$set(this.contacts, index, {
                    ...this.contacts[index],
                    ...data
                });
            }
        },
        /**
         * 根据 id 查找联系人的索引
         * @param contactId 联系人 id
         * @return {Number} 联系人索引，未找到返回 -1
         */
        findContactIndexById(contactId) {
            return this.contacts.findIndex(item => item.id === contactId);
        },
        /**
         * 根据 id 查找判断是否存在联系人
         * @param contactId 联系人 id
         * @return {Boolean}
         */
        hasContact(contactId) {
            return this.findContactIndexById(contactId) !== -1;
        },
        findMessage(messageId) {
            // eslint-disable-next-line no-restricted-syntax
            for (const key in allMessages) {
                if (Object.prototype.hasOwnProperty.call(allMessages, key)) {
                    const message = allMessages[key].find(({ id }) => id === messageId);
                    if (message) return message;
                }
            }
        },
        findContact(contactId) {
            return this.getContacts().find(({ id }) => id === contactId);
        },
        /**
         * 返回所有联系人
         * @return {Array<Contact>}
         */
        getContacts() {
            return this.contacts;
        },
        // 返回当前聊天窗口联系人信息
        getCurrentContact() {
            return this.currentContact;
        },
        getCurrentMessages() {
            return this.currentMessages;
        },
        setEditorValue(val = '') {
            if (!isString(val)) return false;
            this.$refs.editor.setValue(this.emojiNameToImage(val));
        },
        getEditorValue() {
            return this.$refs.editor.getFormatValue();
        },
        /**
         * 清空某个联系人的消息，切换到该联系人时会重新触发pull-messages事件
         */
        clearMessages(contactId) {
            if (contactId) {
                delete allMessages[contactId];
                this.CacheMessageLoaded.remove(contactId);
                this.CacheDraft.remove(contactId);
            } else {
                allMessages = {};
                this.CacheMessageLoaded.remove();
                this.CacheDraft.remove();
            }
            return true;
        },
        /**
         * 返回所有消息
         * @return {Object<Contact.id,Message>}
         */
        getMessages(contactId) {
            return (contactId ? allMessages[contactId] : allMessages) || [];
        },
        changeDrawer(params) {
            this.drawerVisible = !this.drawerVisible;
            if (this.drawerVisible === true) this.openDrawer(params);
        },
        // openDrawer(data) {
        //   renderDrawerContent = data || new Function();
        //   this.drawerVisible = true;
        // },
        openDrawer(params) {
            renderDrawerContent = isFunction(params)
                ? params
                : params.render || function () {};
            const wrapperWidth = this.$refs.wrapper.clientWidth;
            const wrapperHeight = this.$refs.wrapper.clientHeight;
            let width = params.width || 200;
            let height = params.height || wrapperHeight;
            let offsetX = params.offsetX || 0;
            let offsetY = params.offsetY || 0;
            const position = params.position || 'right';
            if (isString(width)) width = wrapperWidth * toPoint(width);
            if (isString(height)) height = wrapperHeight * toPoint(height);
            if (isString(offsetX)) offsetX = wrapperWidth * toPoint(offsetX);
            if (isString(offsetY)) offsetY = wrapperHeight * toPoint(offsetY);

            this.$refs.drawer.style.width = `${width}px`;
            this.$refs.drawer.style.height = `${height}px`;

            let left = 0;
            let top = 0;
            let shadow = '';
            if (position === 'right') {
                left = wrapperWidth;
            } else if (position === 'rightInside') {
                left = wrapperWidth - width;
                shadow = '-15px 0 16px -14px rgba(0,0,0,0.08)';
            } else if (position === 'center') {
                left = wrapperWidth / 2 - width / 2;
                top = wrapperHeight / 2 - height / 2;
                shadow = '0 0 20px rgba(0,0,0,0.08)';
            }
            left += offsetX;
            top += offsetY + -1;
            this.$refs.drawer.style.top = `${top}px`;
            this.$refs.drawer.style.left = `${left}px`;
            this.$refs.drawer.style.boxShadow = shadow;

            this.drawerVisible = true;
        },
        closeDrawer() {
            this.drawerVisible = false;
        }
    },

    render() {
        return this._renderWrapper([
            this._renderMenu(),
            this._renderSidebarMessage(),
            this._renderSidebarContact(),
            this._renderContainer(),
            this._renderDrawer()
        ]);
    }
};
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
