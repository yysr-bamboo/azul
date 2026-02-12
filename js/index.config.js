const PAGE_CONFIG = {
    playerNumber: 2,
    factoryNumber: 5,
};

const CONFIG = {
    /** 全局CSS变量 */
    css: {
        tileWidth: 32, // 单位px
        transitionDuration: 300, // 单位毫秒
    },
    xcss: {
        factoryTileRotateLimit: 20, // 工厂瓷砖旋转角度上限，单位deg
        lineTileRotateLimit: 3,
        wallTileRotateLimit: 3,
        floorTileRotateLimit: 3,
    },
    game: {
        playerNumber: 2,
        factoryNumber: 5,
    }
}

/**
 * 统一存储应用中所有使用到的顶级对象。
 */
class Application {
    /** @type {Page} 页面对象，在全部数据加载完毕后，从 index.html 中初始化 */
    page = null;
    /** @type {TileEvent} 瓷砖事件处理对象 */
    tileEvent = new TileEvent();
    /** @type {Canvas} 页面画布，需要等页面渲染完成后，在 index.page.js 中初始化 */
    canvas = null;
    /** @type {Game} 沙盘逻辑 */
    game = new Game();
    /** @type {Operator} 交互逻辑处理器 */
    operator = new Operator();
    /** @type {Checker} 沙盘合理性校验器 */
    checker = new Checker();
}

class Store {
    /** @type {string} 布局模式 */
    layoutMode = 'PC';
    /** @type {Tile} 编辑状态下，选中瓷砖 */
    selectedEditingTile = null;
    /** @type {TileSlot[]} 推演模式下，选中瓷砖组的原槽位集合。根据第一个槽位是否有 group 属性来判断来源是工厂（有group属性）还是 stack（无group属性） */
    selectedTileSlots = [];
    /** @type {boolean} 推演模式下，选中瓷砖组的来源是否为 stack */
    selectedTileFromStack = false;
    /** @type {Number[][]} n*4的数组，第一层数组表示工厂，第二层数组表示瓷砖颜色。 */
    factoryData = [];

    /** 存储游戏操作记录，每个元素有个 undo() 方法，告知系统如何撤销回上一步。 */
    gameRecord = [];
    /**
     * @type {{wallCode: number}[]} wallCode 用位串表示墙上瓷砖的充填状态，最低位表示左上角，最高位表示右下角，共25位。
     */
    playerData = [];

    currPlayer = 0;
    appMode = 'editing';
}

const APP = new Application();
const STORE = new Store();