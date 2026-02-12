/**
 * 获取一个子代元素在父代元素中的相对位置。
 * @param {Element} child 子代元素
 * @param {Element} parent 父代元素
 * @returns {{left:string, top:string}} 相对位置对象，包含left和top属性
 */
function getRelativePosition(child, parent) {
    if (!child) {
        console.error('获取元素相对位置时出错，子代元素为空。');
        return { left: 0, top: 0 };
    };
    if (!parent) {
        console.error('获取元素相对位置时出错，父代元素为空。');
        return { left: 0, top: 0 };
    };
    const childRect = child.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    let left = childRect.left - parentRect.left;
    let top = childRect.top - parentRect.top;

    // const {
    //     includeScroll = false, // 是否包含滚动偏移
    //     includeBorder = true, // 是否包含边框
    //     includeMargin = false // 是否包含外边距
    // } = options;

    // // 如果需要考虑滚动
    // if (includeScroll) {
    //     left += parent.scrollLeft;
    //     top += parent.scrollTop;
    // }

    // // 如果不需要边框，添加边框宽度
    // if (!includeBorder) {
    //     const parentStyle = window.getComputedStyle(parent);
    //     left += parseInt(parentStyle.borderLeftWidth) || 0;
    //     top += parseInt(parentStyle.borderTopWidth) || 0;
    // }

    // // 如果需要包含margin，减去child的margin
    // if (includeMargin) {
    //     const childStyle = window.getComputedStyle(child);
    //     left -= parseInt(childStyle.marginLeft) || 0;
    //     top -= parseInt(childStyle.marginTop) || 0;
    // }
    return { left, top };
}

/**
 * 使指定元素旋转随机角度。
 * @param {HTMLElement} element 要旋转的元素
 * @param {number} deg 最大随机旋转角度
 */
function rotateElement(element, deg) {
    // 移除原有的 rotate
    element.style.transform = element.style.transform.replace(/rotate\([^)]*\)/g, '');
    element.style.transform += ` rotate(${Math.random() * deg * 2 - deg}deg)`;
}