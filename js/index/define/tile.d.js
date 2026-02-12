class Tile {

    /** @type {string} 瓷砖类型，tile0 到 tile4 表示普通瓷砖，first-tile 表示先手瓷砖 */
    type;
    /** @type {HTMLElement} 瓷砖对应的 DOM 元素，该元素拥有 getTile() 方法，该方法返回该瓷砖对象 */
    element;
    /** @type {TileSlot} 瓷砖当前所在的槽位，且 slot 中存储该 tile 对象 */
    slot;
    /** @type {Function} 瓷砖从当前位置移出时，执行此函数 */
    moveOut;

    /**
     * 创建动态瓷砖对象。
     * @param {string} type 该参数会加入到元素的class中，也会存为 tile 的属性。用 tile0 到 tile4 表示普通瓷砖，用 first-tile 表示先手瓷砖
     * @param {TileSlot} slot 用于定位瓷砖初始位置的槽位元素
     * @param {Function} moveOut 该瓷砖从当前位置移出时，执行该回调函数
     */
    constructor(type, slot, moveOut) {
        if (!Tile.canvas) Tile.canvas = document.getElementById('main-area');
        // 创建瓷砖元素
        const element = document.createElement('div');
        element.className = 'cursor-pointer tile ' + type;
        // 指定初始位置
        let rect = getRelativePosition(slot.element, Tile.canvas);
        element.style.left = rect.left + 'px';
        element.style.top = rect.top + 'px';
        element.style.position = 'absolute';
        Tile.canvas.appendChild(element);
        // 绑定属性
        this.type = type;
        this.moveOut = moveOut;
        // 双向绑定
        element.getTile = () => this;
        this.element = element;
        slot.tiles.push(this);
        this.slot = slot;
    }

    /**
     * 移动瓷砖到指定槽位。
     * @param {TileSlot} slot 瓷砖要移动到的槽位
     */
    move(slot) {
        // 移动前触发瓷砖的移出函数和槽位的移入函数
        if (this.moveOut) {
            this.moveOut();
            this.moveOut = null;
        }
        slot.beforePush(this);
        // 移动
        let rect = getRelativePosition(slot.element, Tile.canvas);
        this.element.style.left = rect.left + 'px';
        this.element.style.top = rect.top + 'px';
        // 删除旧位置并与新槽位双向绑定
        this.slot.remove(this);
        slot.tiles.push(this);
        this.slot = slot;
    }

    remove() {
        this.moveOut && this.moveOut();
        this.slot.remove(this);
        Tile.canvas.removeChild(this.element);
    }
}