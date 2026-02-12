class Canvas {
    /** 画布中的 TileSlot 对象集合 */
    tileSlots = {
        /** @type {TileSlot} 选中区槽位 */
        selectedArea: null,
        /** @type {TileSlot[][]} 工厂槽位[n][4]数组 */
        factories: [],
        /** 堆槽位map，通过 tile0 到 tile4 或 first-tile 字段获取对应类型的堆槽位 */
        stacks: {},
        /** 玩家面板槽位数组，每个元素是一个玩家面板对象，每个对象包含 lines:[5][i]、wall:[25] 和 floor:[7] 三个属性 */
        players: [],
        /** @type {TileSlot} 溢出槽位，存放溢出的瓷砖 */
        overflow: null
    };
    /** @type {Tile} 先手瓷砖对象 */
    firstTile = null;

    /**
     * 创建画布。
     */
    constructor() {
        // 创建选中区槽位
        this.tileSlots.selectedArea = new TileSlot(document.getElementById('selected-tiles-area'));

        // 创建工厂槽位
        document.querySelectorAll('#factories .factory').forEach(factory => {
            let factorySlots = [];
            // 在工厂中插入瓷砖槽位
            for (let i = 4; i--;) {
                let slot = new TileSlot(factory);
                slot.group = factorySlots;
                // 插入工厂时的对瓷砖进行动画，并绑定事件
                slot.beforePush = tile => {
                    tile.element.style.transform = 'translate(0,0)';
                    rotateElement(tile.element, CONFIG.xcss.factoryTileRotateLimit);
                    tile.element.onclick = APP.tileEvent.factory;
                };
                factorySlots.push(slot);
            }
            // 存储工厂及槽位
            this.tileSlots.factories.push(factorySlots);
        });

        // 创建堆积区槽位
        let stackAreaList = document.querySelectorAll('#tile-stack-area .tile-area');
        // 创建先手瓷砖槽位
        let firstTileSlot = new TileSlot(stackAreaList[5]);
        // 先手瓷砖插入动效
        firstTileSlot.beforePush = function(tile) {
            if (tile.slot === this) return;
            tile.element.style.transform = 'translate(0,0) rotate(' + (Math.random() * 90 - 45) + 'deg)';
        };
        // 创建先手瓷砖
        let firstTile = new Tile('first-tile', firstTileSlot);
        this.tileSlots.stacks['first-tile'] = firstTile.slot;
        firstTile.element.classList.add('only-editing');
        this.firstTile = firstTile;
        // 添加先手瓷砖点击事件
        firstTile.element.onclick = function(event) {
            // only-editing
            if (STORE.appMode !== 'editing') return;
            // 阻止事件冒泡，不触发槽位事件
            event.stopPropagation();
            // 如果当前槽位不是预备槽，则回归预备槽
            let tile = this.getTile();
            let firstTileSlot = APP.canvas.tileSlots.stacks['first-tile'];
            if (tile.slot !== firstTileSlot) tile.move(firstTileSlot);
            // 否则，选中槽位
            else APP.game.selectStackInEditing(tile);
        };

        // 插入并保存其他堆槽位，插入瓷砖前随机位移及旋转
        for (let i = 5; i--;) {
            let slot = new TileSlot(stackAreaList[i]);
            // 插入堆时的对瓷砖进行动画，并绑定事件
            slot.beforePush = tile => {
                if (STORE.appMode === 'deduce') {
                    let r1 = Math.random() * 2 - 1;
                    let r2 = Math.random() * 2 - 1;
                    let limit = CONFIG.css.tileWidth * .4;
                    tile.element.style.transform = 'translate(' + (r1 < 0 ? -Math.pow(-r1, 1 / 9) * limit : Math.pow(r1, 1 / 9) * limit) + 'px,' +
                        (r2 < 0 ? -Math.pow(-r2, 1 / 9) * limit : Math.pow(r2, 1 / 9) * limit) + 'px) rotate(' + (Math.random() * 360 - 180) + 'deg)';
                }
                tile.element.onclick = APP.tileEvent.stack;
            };
            this.tileSlots.stacks['tile' + i] = slot;
        }

        // 保存玩家面板中的槽位
        let boardList = document.querySelectorAll('.playerboard');
        let wallMaskList = document.querySelectorAll('.wall-mask');
        for (let i = 0; i < CONFIG.game.playerNumber; i++) {
            // 保存该玩家面板上的所有槽位
            let slots = {
                lines: [],
                floor: [],
                wall: []
            };
            this.tileSlots.players.push(slots);
            // 添加行槽位
            for (let j = 0; j < 5; j++) {
                let lineSlots = [];
                slots.lines.push(lineSlots);
                // 创建并存储槽位
                for (let k = 0; k <= j; k++) {
                    let slot = new TileSlot(boardList[i], 'cursor-pointer', function() { APP.game.clickLineSlot(this.getSlot()) });
                    slot.beforePush = tile => {
                        tile.element.style.transform = 'translate(0,0)';
                        rotateElement(tile.element, CONFIG.xcss.lineTileRotateLimit);
                        tile.element.onclick = APP.tileEvent.line;
                    };
                    // 保存槽位所在的槽位组及对应下标
                    lineSlots.push(slot);
                    slot.group = lineSlots;
                    slot.groupIndex = k;
                    // 重置 getGroupTileCount 方法
                    slot.getGroupTileCount = function() {
                        for (let i = lineSlots.length; i--;)
                            if (lineSlots[i].tiles[0]) return i + 1;
                        return 0;
                    };
                }
            }
            // 添加地板槽位。点击玩家面板的地板槽位时，如果当前是编辑模式且已选中砖块，则将砖块移动到玩家面板中
            for (let j = 0; j < 7; j++) {
                let slot = new TileSlot(boardList[i], 'cursor-pointer', function() { APP.game.clickFloorSlot(this.getSlot()) });
                slot.beforePush = tile => {
                    tile.element.style.transform = 'translate(0,0)';
                    rotateElement(tile.element, CONFIG.xcss.floorTileRotateLimit);
                    // 重绑定除了先手瓷砖外的其他瓷砖的点击函数
                    if (tile !== APP.canvas.firstTile) tile.element.onclick = APP.tileEvent.floor;
                };
                // 保存槽位所在的槽位组及对应下标
                slots.floor.push(slot);
                slot.group = slots.floor;
                slot.groupIndex = j;
            }
            // 在墙面蒙版中添加 5×5 的 cell，并内置tile，它的fill属性决定是否填上砖块
            for (let j = 0; j < 25; j++) {
                // 创建 slot 对象。点击玩家面板的墙面蒙版“槽位”时，如果是编辑模式，切换其充填状态。
                let slot = new TileSlot(wallMaskList[i], 'cursor-pointer only-editing', function() {
                    if (STORE.appMode === 'editing') {
                        let slot = this.getSlot();
                        let tileElement = slot.tiles[0].element;
                        // 从 STORE 中读取玩家墙面数据
                        let playerData = STORE.playerData[this.getPlayerIndex()];
                        if (playerData.wallCode & (1 << slot.groupIndex)) {
                            playerData.wallCode -= 1 << slot.groupIndex;
                            tileElement.style.transform = 'scale(0)';
                        } else {
                            playerData.wallCode |= 1 << slot.groupIndex;
                            tileElement.style.transform = 'scale(1)';
                            rotateElement(tileElement, CONFIG.xcss.wallTileRotateLimit);
                        }
                    }
                });
                slot.element.getPlayerIndex = () => i;
                slot.groupIndex = j;
                // 将槽位拉升超过瓷砖，保证能被点击
                slot.element.style.zIndex = 9;
                slots.wall.push(slot);
                // 创建 tile 对象并随机扰动角度
                let tile = new Tile('tile' + (j - Math.floor(j / 5)) % 5, slot);
                tile.element.style.transform = 'scale(0)';
            }
        }
        // 在第一个玩家面板的空间内置入溢出槽位
        this.tileSlots.overflow = new TileSlot(boardList[0]);
    }

    /**
     * 基于指定的瓷砖宽度，设置所有 slot 的位置。
     * @param {number} tileWidth 瓷砖宽度
     */
    setSlotsPosition(tileWidth) {
        // 重置工厂槽位
        let factorySlots = this.tileSlots.factories;
        for (let i = 0; i < factorySlots.length; i++)
            for (let j = 0; j < 4; j++)
                factorySlots[i][j].setPosition(tileWidth * (0.6 + (j & 1) * 1.3), tileWidth * (0.6 + (j >> 1) * 1.3));
        // 重置玩家面板槽位
        let players = this.tileSlots.players;
        for (let i = 0; i < players.length; i++) {
            // 重置行槽位
            for (let j = 0; j < 5; j++)
                for (let k = 0; k <= j; k++)
                    players[i].lines[j][k].setPosition(tileWidth * (4.6 + (k - j) * 1.11), tileWidth * (.24 + j * 1.12));
            // 重置地板槽位
            for (let j = 0; j < 7; j++) players[i].floor[j].setPosition(tileWidth * (.14 + j * 1.21), tileWidth * 6.66);
            // 重置墙槽位
            for (let j = 0; j < 5; j++)
                for (let k = 0; k < 5; k++) {
                    let slot = players[i].wall[j * 5 + k];
                    slot.setPosition(tileWidth * k * 1.12, tileWidth * j * 1.12);
                    // 重定位内置瓷砖
                    slot.tiles[0].move(slot);
                }
        }
        // 重置溢出槽位
        this.tileSlots.overflow.setPosition(tileWidth * 8, tileWidth * -4);
    }

    /**
     * 将选中瓷砖区内的瓷砖展开。
     */
    expandSelectedArea() {
        let tiles = this.tileSlots.selectedArea.tiles;
        // 不足 9 个就排成一行
        if (tiles.length < 9) {
            for (let i = tiles.length, base = (1 - i) / 2; i--;) {
                tiles[i].element.style.transform = 'translate(' + ((base + i) * CONFIG.css.tileWidth * 1.1) + 'px,0)';
            }
        } else {
            for (let i = tiles.length, base = (1 - (i + 1 >> 1)) / 2; i--;) {
                tiles[i].element.style.transform = 'translate(' + ((base + (i >> 1)) * CONFIG.css.tileWidth * 1.1) + 'px,' +
                    (CONFIG.css.tileWidth * 1.1 * (i % 2 - 0.5)) + 'px)';
            }
        }
    }

    /**
     * 创建工厂中的瓷砖，创建后在堆中生成，然后移动至工厂中。
     * @param {string} type 瓷砖类型
     * @param {TileSlot} slot 要移动至的槽位
     */
    createFactoryTile(type, slot) {
        let tile = new Tile(type, APP.canvas.tileSlots.stacks[type]);
        tile.move(slot);
    }

    /**
     * 在堆槽位中，创建指定类型及指定数量的瓷砖。
     * 
     * @param {string} type 瓷砖类型
     * @param {number} amount 瓷砖数量
     */
    createStackTiles(type, amount) {
        let slot = this.tileSlots.stacks[type];
        while (amount--) {
            let tile = new Tile(type, slot);
            // 延时1毫秒产生动画效果
            setTimeout(() => slot.beforePush(tile), 1);
        }
    }

    /**
     * 批量创建 line 上的瓷砖，创建时在堆中生成，然后移动至 line 中。
     * @param {string} type 瓷砖类型
     * @param {TileSlot} slot 最后一个瓷砖所在的槽位
     */
    createLineTiles(type, slot) {
        for (let i = 0, group = slot.group; i <= slot.groupIndex; i++) {
            // 创建瓷砖并绑定点击函数，然后延时移动瓷砖
            let tile = new Tile(type, APP.canvas.tileSlots.stacks[type]);
            setTimeout(() => { tile.move(group[i]) }, 15 * i);
        }
    }

    /**
     * 创建地板上的瓷砖，创建后在堆中生成，然后移动至地板槽位中。
     * @param {string} type 瓷砖类型
     * @param {TileSlot} slot 要移动至的槽位
     */
    createFloorTile(type, slot) {
        // 如果是先手瓷砖，直接移动
        if (type === 'first-tile') return APP.canvas.firstTile.move(slot);
        // 如果是普通瓷砖，则创建砖块并绑定点击函数
        let tile = new Tile(type, APP.canvas.tileSlots.stacks[type]);
        tile.move(slot);
    }

    /**
     * 修整地板瓷砖，将地板瓷砖向左对齐。
     */
    trimFloorTiles() {
        APP.canvas.tileSlots.players.forEach(player => {
            // 记录当前最左侧的空位是第几格（从0开始）
            let cursor = 0;
            let floor = player.floor;
            for (let i = 0; i < 7; i++) {
                let tile = floor[i].tiles[0];
                if (tile) {
                    if (cursor !== i) tile.move(floor[cursor]);
                    cursor++;
                }
            }
        });
    }
}