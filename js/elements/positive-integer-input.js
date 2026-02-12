/**
 * 正整数输入框。
 * 
 * 参数options的属性决定属性选项：
 * className - 组件的类名
 * styles - 样式对象，如果存在，则使用Object.assign()复制到输入框对象的style属性中
 * max - 最大值限制，默认无上限
 * value - 初始值，默认0
 * eventListener - 事件监听器对象，该对象必须包含change(原值，当前值)方法。当输入值改变时，触发change函数
 */
class PositiveIntegerInput {
    /**
     * 构造函数，创建一个正整数输入框组件。
     * 
     * @param {Object} 
     * @param {Object} options - 组件选项
     */
    constructor(options) {
        // this.view 是该组件的实体元素
        this.view = document.createElement('input');
        if (options.className) this.view.className = options.className;
        // 输入框原值
        this.value = +options.value;
        if (!this.value) this.value = 0;
        // 设置最大值，max == max 用于检测是否为 NaN/undifined
        let max = +options.max;
        max = max == max ? Math.max(max, 1) : Infinity;
        this.max = max;
        // 设置样式
        if (options.styles) Object.assign(this.view.style, options.styles);
        // 设置类型和默认值
        this.view.setAttribute('type', 'number');
        this.view.setAttribute('value', this.value);
        // 监听键盘输入
        this.eventListener = options.eventListener;
        this._setupEventListeners();
    }

    /**
     * 设置输入事件监听器
     * @private
     */
    _setupEventListeners() {
        this.view.addEventListener('input', e => {
            let i, str;
            switch (e.inputType) {
                case 'insertText':
                    // 过滤非数字字符
                    if (e.data.charCodeAt() < 48 || e.data.charCodeAt() > 57) this.view.value = this.value;
                    // 将数字规范化并限定在范围内
                    this.view.value = Math.min(this.max, this.view.value);
                    break;
                case 'insertFromPaste':
                case 'historyUndo':
                    str = '';
                    // 过滤非数字字符
                    for (const item of this.view.value)
                        if (item.charCodeAt() >= 48 && item.charCodeAt() <= 57) str += item;
                        // 将数字规范化并限定在范围内
                    this.view.value = Math.min(this.max, str);
                    break;
                case 'deleteContentBackward':
                case 'deleteByCut':
                    if (this.view.value.length == 0) this.view.value = 0;
                    this.view.value = +this.view.value;
                    break;
                default:
                    if (+this.view.value < 0) this.view.value = 0;
                    if (+this.view.value > this.max) this.view.value = this.max;
                    break;
            }
            // 如果存在监听器，而且数值发生了改变，则调用change函数
            if (this.eventListener && this.eventListener.change && +this.value != +this.view.value) this.eventListener.change(+this.value, +this.view.value);
            this.value = this.view.value;
        });
    }

    /**
     * 获取输入框DOM元素
     * @returns {HTMLElement} 输入框元素
     */
    show() {
        return this.view;
    }

    /**
     * 设置输入框的值
     * @param {number} v - 要设置的值
     */
    setValue(v) {
        this.value = this.view.value = v;
    }

    /**
     * 获取输入框的当前值
     * @returns {number} 当前值
     */
    getValue() {
        return +this.view.value;
    }

    /**
     * 更新输入框的值（在当前值基础上增加指定数值）
     * @param {number} n - 要增加的数值
     */
    updateValue(n) {
        this.value = this.view.value = +this.view.value + +n;
    }

    /**
     * 设置输入框是否禁用，禁用时，添加disabled属性
     * @param {boolean} bool - true为禁用，false为启用
     */
    setDisabled(bool) {
        bool ? this.view.setAttribute('disabled', bool) : this.view.removeAttribute('disabled');
    }
}