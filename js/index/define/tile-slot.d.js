class TileSlot {

    /** @type {HTMLElement} 槽位对应的 DOM 元素，该元素拥有 getSlot() 方法，该方法返回该槽位对象 */
    element;
    /** @type {Tile[]} */
    tiles = [];
    /** @type {TileSlot[]} 与该槽位在同一区块的槽位组。仅“工厂、线、地板”有该属性 */
    group;
    /** @type {number} 该槽位在同一区块的槽位组中的下标 */
    groupIndex;

    /**
     * 在指定元素中创建一个槽位并对其定位。
     * @param {HTMLElement} parent 存放槽位的父级元素
     * @param {string} className 槽位追加的类名
     * @param {Function} onclick 如果传入该参数，则点击槽位时触发该函数
     */
    constructor(parent, className, onclick) {
        this.element = document.createElement('div');
        this.element.className = 'tile-slot' + (className ? ' ' + className : '');
        if (onclick) this.element.onclick = onclick;
        parent.appendChild(this.element);
        this.element.getSlot = () => this;
    }

    setPosition(left, top) {
        this.element.style.left = left + 'px';
        this.element.style.top = top + 'px';
    }

    /**
     * 获取槽位所在组中与该槽位同类型的或所有的瓷砖数量，若当前槽位为空，则返回 0
     * @param {boolean} matchType 如果为 true，则返回槽位所在组中同类型的瓷砖数量；否则返回槽位所在组中的所有瓷砖数量
     * @returns {number} 返回槽位所在组中的符合要求的瓷砖数量
     */
    getGroupTileCount(matchType) {
        if (!this.tiles.length) return 0;
        let count = 0;
        let thisType = this.tiles[0].type;
        for (const slot of this.group) {
            let tile = slot.getTile(0);
            if (tile) {
                if (matchType) {
                    if (tile.type === thisType) count++;
                } else count++;
            }
        }
        return count;
    }

    getTile(index) {
        return this.tiles[index];
    }

    /**
     * 在添加瓷砖之前运行。
     * 
     * @param {Tile} tile 被添加的瓷砖对象
     */
    beforePush(tile) {}

    /**
     * 从 slot.tiles 数组中移除指定的 tile 对象。
     * @param {Tile} tile 要移除的对象
     */
    remove(tile) {
        let index = this.tiles.indexOf(tile);
        if (index >= 0) this.tiles.splice(index, 1);
    }

    clear() {
        while (this.tiles.length) this.tiles[0].remove();
    }
}