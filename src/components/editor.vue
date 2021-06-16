<script>
import { useScopedSlot, clearHtmlExcludeImg } from '@/utils';

const exec = (val, command = 'insertHTML') => {
    document.execCommand(command, false, val);
};
const selection = window.getSelection();
let lastSelectionRange;
let emojiData = [];
// const isInitTool = false;
export default {
    name: 'WitalkEditor',
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
        tools: {
            type: Array,
            default: () => []
        },
        sendText: {
            type: String,
            default: '发 送'
        },
        sendKey: {
            type: Function,
            default(e) {
                return e.keyCode === 13 && e.ctrlKey === true;
            }
        }
    },
    data() {
        this.clipboardBlob = null;
        return {
            // 剪切板图片URL
            clipboardUrl: '',
            submitDisabled: true,
            proxyTools: [],
            accept: '',
            tipText: this.IMUI.$scopedSlots.editorFooter
        };
    },
    created() {
        this.$scopedSlots = this.IMUI.$scopedSlots;
        // debugger
        if (this.tools && this.tools.length > 0) {
            this.initTools(this.tools);
        } else {
            this.initTools([
                { name: 'emoji' },
                { name: 'uploadFile' },
                { name: 'uploadImage' }
            ]);
        }
        this.IMUI.$on('change-contact', () => {
            this.closeClipboardImage();
        });
    },
    mounted() {
        this.$scopedSlots = this.IMUI.$scopedSlots;
        // debugger
    },
    methods: {
        closeClipboardImage() {
            this.clipboardUrl = '';
            this.clipboardBlob = null;
        },
        sendClipboardImage() {
            if (!this.clipboardBlob) return;
            this.$emit('upload', this.clipboardBlob);
            this.closeClipboardImage();
        },
        /**
         * 初始化工具栏
         */
        initTools(data) {
            if (!data) return;
            const defaultTools = [
                {
                    name: 'emoji',
                    title: '表情',
                    click: null,
                    render: () => <i class="witalk-icon-emoji" />
                },
                {
                    name: 'uploadFile',
                    title: '文件上传',
                    click: () => this.selectFile('*'),
                    render: () => <i class="witalk-icon-folder" />
                },
                {
                    name: 'uploadImage',
                    title: '图片上传',
                    click: () => this.selectFile('image/*'),
                    render: () => <i class="witalk-icon-image" />
                }
            ];
            let tools = [];
            if (Array.isArray(data)) {
                const indexMap = {
                    emoji: 0,
                    uploadFile: 1,
                    uploadImage: 2
                };
                const indexKeys = Object.keys(indexMap);
                tools = data.map((item) => {
                    if (indexKeys.includes(item.name)) {
                        return {
                            ...defaultTools[indexMap[item.name]],
                            ...item
                        };
                    }
                    return item;
                });
            } else {
                tools = defaultTools;
            }
            this.proxyTools = tools;
        },
        _saveLastRange() {
            lastSelectionRange = selection.getRangeAt(0);
        },
        _focusLastRange() {
            this.$refs.textarea.focus();
            if (lastSelectionRange) {
                selection.removeAllRanges();
                selection.addRange(lastSelectionRange);
            }
        },
        _handleClick() {
            this._saveLastRange();
        },
        _renderEmojiTabs() {
            const renderImageGrid = items => items.map(item => (
                <img
                    src={item.src}
                    title={item.title}
                    class="witalk-editor-emoji-item"
                    onClick={() => this._handleSelectEmoji(item)}
                />
            ));
            if (emojiData[0].label) {
                const nodes = emojiData.map((item, index) => (
                    <div slot="tab-pane" index={index} tab={item.label}>
                        {renderImageGrid(item.children)}
                    </div>
                ));
                return <witalk-tabs style="width: 412px">{nodes}</witalk-tabs>;
            }
            return (
                <div class="witalk-tabs-content" style="width:406px">
                    {renderImageGrid(emojiData)}
                </div>
            );
        },
        _handleSelectEmoji(item) {
            this._focusLastRange();
            exec(`<img emoji-name="${item.name}" src="${item.src}"></img>`);
            this._checkSubmitDisabled();
            this._saveLastRange();
        },
        async selectFile(accept) {
            this.accept = accept;
            await this.$nextTick();
            this.$refs.fileInput.click();
        },
        _handlePaste(e) {
            e.preventDefault();
            const clipboardData = e.clipboardData || window.clipboardData;
            const text = clipboardData.getData('Text');
            if (text) {
                if (window.clipboardData) {
                    this.$refs.textarea.innerHTML = text;
                } else {
                    exec(text, 'insertText');
                }
            } else {
                const { blob, blobUrl } = this._getClipboardBlob(clipboardData);
                this.clipboardBlob = blob;
                this.clipboardUrl = blobUrl;
            }
        },
        _getClipboardBlob(clipboard) {
            let blob;
            let blobUrl;
            for (let i = 0; i < clipboard.items.length; ++i) {
                if (
                    clipboard.items[i].kind === 'file'
                    && clipboard.items[i].type.indexOf('image/') !== -1
                ) {
                    blob = clipboard.items[i].getAsFile();
                    blobUrl = (window.URL || window.webkitURL).createObjectURL(
                        blob
                    );
                }
            }
            return { blob, blobUrl };
        },
        _handleKeyup() {
            this._saveLastRange();
            this._checkSubmitDisabled();
        },
        _handleKeydown(e) {
            if (this.submitDisabled === false && this.sendKey(e)) {
                this._handleSend();
            }
        },
        getFormatValue() {
            // return toEmojiName(
            //   this.$refs.textarea.innerHTML
            //     .replace(/<br>|<\/br>/, "")
            //     .replace(/<div>|<p>/g, "\r\n")
            //     .replace(/<\/div>|<\/p>/g, "")
            // );
            return this.IMUI.emojiImageToName(this.$refs.textarea.innerHTML);
        },
        _checkSubmitDisabled() {
            this.submitDisabled = !clearHtmlExcludeImg(
                this.$refs.textarea.innerHTML.trim()
            );
        },
        _handleSend() {
            const text = this.getFormatValue();
            this.$emit('send', text);
            this.clear();
            this._checkSubmitDisabled();
        },
        _handleChangeFile() {
            const { fileInput } = this.$refs;
            Array.from(fileInput.files).forEach((file) => {
                this.$emit('upload', file);
            });
            fileInput.value = '';
        },
        clear() {
            this.$refs.textarea.innerHTML = '';
        },
        initEmoji(data) {
            emojiData = data;
            this.$forceUpdate();
        },
        setValue(val) {
            this.$refs.textarea.innerHTML = this.IMUI.emojiNameToImage(val);
            this._checkSubmitDisabled();
        }
    },
    render() {
        const toolLeft = [];
        const toolRight = [];
        this.proxyTools.forEach(({
            name, title, render, click, isRight
        }) => {
            click = click || function () {};
            const classes = [
                'witalk-editor-tool-item',
                { 'witalk-editor-tool-item-right': isRight }
            ];
            let node;
            if (name === 'emoji') {
                node = emojiData.length === 0 ? (
                    ''
                ) : (
                    <witalk-popover class="witalk-editor-emoji">
                        <template slot="content">
                            {this._renderEmojiTabs()}
                        </template>
                        <div class={classes} title={title}>
                            {render()}
                        </div>
                    </witalk-popover>
                );
            } else {
                node = (
                    <div class={classes} onClick={click} title={title}>
                        {render()}
                    </div>
                );
            }
            if (isRight) {
                toolRight.push(node);
            } else {
                toolLeft.push(node);
            }
        });

        return (
            <div class="witalk-editor">
                {this.clipboardUrl && (
                    <div class="witalk-editor-clipboard-image">
                        <img src={this.clipboardUrl} />
                        <div>
                            <witalk-button
                                style={{ marginRight: '10px' }}
                                onClick={this.closeClipboardImage}
                                color="grey"
                            >
                                取消
                            </witalk-button>
                            <witalk-button onClick={this.sendClipboardImage}>
                                发送图片
                            </witalk-button>
                        </div>
                    </div>
                )}
                <input
                    style="display:none"
                    type="file"
                    multiple="multiple"
                    ref="fileInput"
                    accept={this.accept}
                    onChange={this._handleChangeFile}
                />
                <div class="witalk-editor-tool">
                    <div class="witalk-editor-tool-left">{toolLeft}</div>
                    <div class="witalk-editor-tool-right">{toolRight}</div>
                </div>
                <div class="witalk-editor-inner">
                    <div
                        class="witalk-editor-input"
                        ref="textarea"
                        contenteditable="true"
                        onKeyup={this._handleKeyup}
                        onKeydown={this._handleKeydown}
                        onPaste={this._handlePaste}
                        onClick={this._handleClick}
                        spellcheck="false"
                    />
                </div>
                <div class="witalk-editor-footer">
                    <div class="witalk-editor-tip">
                        {useScopedSlot(
                            this.IMUI.$scopedSlots['editor-footer'],
                            '使用 ctrl + enter 快捷发送消息'
                        )}
                    </div>
                    <div class="witalk-editor-submit">
                        <witalk-button
                            disabled={this.submitDisabled}
                            onClick={this._handleSend}
                        >
                            {this.sendText}
                        </witalk-button>
                    </div>
                </div>
            </div>
        );
    }
};
</script>
<style lang="less">
.witalk-editor {
    height: 200px;
    position: relative;
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
    -ms-flex-direction: column;
    flex-direction: column;
}
.witalk-editor-tool {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    height: 40px;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    -webkit-box-pack: justify;
    -ms-flex-pack: justify;
    justify-content: space-between;
    padding: 0 5px;
    border-top: 1px solid #ebebeb;
}
.witalk-editor-tool-left {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
}
.witalk-editor-tool-right {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
}
.witalk-editor-tool-item {
    cursor: pointer;
    padding: 4px 10px;
    height: 28px;
    line-height: 24px;
    color: #999;
    -webkit-transition: all ease 0.3s;
    transition: all ease 0.3s;
    font-size: 12px;
}
.witalk-editor-tool-item [class^="witalk-icon-"] {
    line-height: 26px;
    font-size: 22px;
}
.witalk-editor-tool-item:hover {
    color: #333;
}
.witalk-editor-tool-item-right {
    margin-left: auto;
}
.witalk-editor-inner {
    -webkit-box-flex: 1;
    -ms-flex: 1;
    flex: 1;
    overflow-x: hidden;
    overflow-y: auto;
}
.witalk-editor-inner::-webkit-scrollbar {
    width: 5px;
    height: 5px;
}
.witalk-editor-inner::-webkit-scrollbar-track-piece {
    background-color: transparent;
}
.witalk-editor-inner::-webkit-scrollbar-thumb:vertical {
    height: 5px;
    background-color: #aaa;
}
.witalk-editor-inner::-webkit-scrollbar-thumb:horizontal {
    width: 5px;
    background-color: transparent;
}
.witalk-editor-clipboard-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
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
    background: #f4f4f4;
    z-index: 1;
}
.witalk-editor-clipboard-image img {
    max-height: 66%;
    max-width: 80%;
    background: #e9e9e9;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    cursor: pointer;
    border-radius: 4px;
    margin-bottom: 10px;
    border: 3px dashed #ddd !important;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
}
.witalk-editor-clipboard-image .clipboard-popover-title {
    font-size: 14px;
    color: #333;
}
.witalk-editor-input {
    height: 100%;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    border: none;
    outline: none;
    padding: 0 10px;
}
.witalk-editor-input::-webkit-scrollbar {
    width: 5px;
    height: 5px;
}
.witalk-editor-input::-webkit-scrollbar-track-piece {
    background-color: transparent;
}
.witalk-editor-input::-webkit-scrollbar-thumb:vertical {
    height: 5px;
    background-color: #aaa;
}
.witalk-editor-input::-webkit-scrollbar-thumb:horizontal {
    width: 5px;
    background-color: transparent;
}
.witalk-editor-input p,
.witalk-editor-input div {
    margin: 0;
}
.witalk-editor-input img {
    height: 20px;
    padding: 0 2px;
    pointer-events: none;
    position: relative;
    top: -1px;
    vertical-align: middle;
}
.witalk-editor-footer {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    height: 52px;
    -webkit-box-pack: end;
    -ms-flex-pack: end;
    justify-content: flex-end;
    padding: 0 10px;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
}
.witalk-editor-tip {
    margin-right: 10px;
    font-size: 12px;
    color: #999;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}
.witalk-editor-emoji {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}
.witalk-editor-emoji .witalk-popover {
    background: #f6f6f6;
}
.witalk-editor-emoji .witalk-popover-content {
    padding: 0;
}
.witalk-editor-emoji .witalk-popover-arrow {
    background: #f6f6f6;
}
.witalk-editor-emoji .witalk-tabs-content {
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    padding: 8px;
    height: 200px;
    overflow-x: hidden;
    overflow-y: auto;
    margin-bottom: 8px;
}
.witalk-editor-emoji .witalk-tabs-content::-webkit-scrollbar {
    width: 5px;
    height: 5px;
}
.witalk-editor-emoji .witalk-tabs-content::-webkit-scrollbar-track-piece {
    background-color: transparent;
}
.witalk-editor-emoji .witalk-tabs-content::-webkit-scrollbar-thumb:vertical {
    height: 5px;
    background-color: #aaa;
}
.witalk-editor-emoji .witalk-tabs-content::-webkit-scrollbar-thumb:horizontal {
    width: 5px;
    background-color: transparent;
}
.witalk-editor-emoji-item {
    cursor: pointer;
    width: 22px;
    padding: 4px;
    border-radius: 4px;
}
.witalk-editor-emoji-item:hover {
    background: #e9e9e9;
}
</style>
