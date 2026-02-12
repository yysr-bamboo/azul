class OpreationRecord {

    // /** @type {string} 两种记录类型：move 表示该操作变动较小，可通过移动完成；change 表示该操作变动较大，需要通过加载生成 */
    // type;
    /** @type {boolean} 是否为移动操作 */
    isMove;
    /** @type {Array<OpreationRecordItem>} 瓷砖操作记录项 */
    items = [];
    /** @type {number} 操作前的当前玩家下标 */
    originalPlayer;
    /** @type {number} 操作后的当前玩家下标 */
    newPlayer;
    /** @type {string} 操作前的局面代码 */
    originalCode;
    /** @type {string} 操作后的局面代码。任何模式下都要存储该数据 */
    newCode;

    constructor(isMove) {
        // this.type = isMove ? 'move' : 'change';
        this.isMove = isMove;
    }
}

class OpreationRecordItem {

    /** @type {TileSlot} 移动前砖块所在的槽位 */
    from;
    /** @type {TileSlot} 移动后砖块所在的槽位 */
    to;
    /** @type {string} 瓷砖类型 */
    type;
    /** @type {Tile} 移动的砖块 */
    tile;

    /**
     * 创建一个最小移动记录项的实例。
     * 
     * @param {TileSlot} from - 移动前该瓷砖所在的槽位
     * @param {TileSlot} to - 移动后该瓷砖所在的槽位
     * @param {string} type - 瓷砖类型
     * @param {Tile} tile - 被移动的瓷砖对象
     */
    constructor(from, to, type, tile) {
        this.from = from;
        this.to = to;
        this.type = type;
        this.tile = tile;
    }
}