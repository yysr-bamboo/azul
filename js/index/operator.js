class Operator {

    /** @type {OpreationRecord[]} 操作记录列表 */
    recordList = [];
    /** @type {number} 当前操作记录索引，即当前的局面是执行完哪一条记录的结果 */
    currentIndex = 0;

    constructor() {
        let record = new OpreationRecord(false);
        record.newCode = '0';
        this.recordList = [record];
    }

    /**
     * 执行一项移动操作并记录。
     * 
     * @param {TileSlot[]} floorSlots 地板槽位组
     * @param {TileSlot[]} lineSlots 行槽位组
     */
    action(floorSlots, lineSlots) {
        let record = new OpreationRecord(true);
        let tileSlots = APP.canvas.tileSlots;
        // 从系统获取当前选中的瓷砖组
        let tiles = APP.canvas.tileSlots.selectedArea.tiles;
        let originalSlots = STORE.selectedTileSlots;
        // 如果原槽位有对应的槽位组，说明是工厂，将工厂剩余的瓷砖移入堆中
        originalSlots[0].group && originalSlots[0].group.forEach(slot => {
            let tile = slot.tiles[0];
            tile && record.items.push(new OpreationRecordItem(slot, tileSlots.stacks[tile.type], tile.type));
        });
        // 获取地板最前端的空位下标
        let floorIndex = floorSlots.findIndex(slot => !slot.tiles[0]);

        // 如果传入了行槽位组，则优先移动到行槽位
        if (lineSlots) {
            // 计算该行的空位数量
            let emptyCount = lineSlots.length;
            for (let i = 0; i < lineSlots.length && lineSlots[i].tiles[0]; i++) emptyCount--;
            let fillCount = lineSlots.length - emptyCount;
            // 如果空位足够容纳tiles
            if (emptyCount >= tiles.length) {
                let last = tiles.length - 1;
                for (let i = last; i--;) record.items.push(new OpreationRecordItem(originalSlots[i], lineSlots[i + fillCount], tiles[i].type));
                // 单独检查最后一个原始槽位是否为先手瓷砖槽位
                record.items.push(new OpreationRecordItem(originalSlots[last],
                    originalSlots[last] === tileSlots.stacks['first-tile'] ? floorSlots[floorIndex] : lineSlots[last + fillCount],
                    tiles[last].type));
            }
            // 如果空位不足，优先填满行
            else {
                for (let i = emptyCount; i--;) record.items.push(new OpreationRecordItem(originalSlots[i], lineSlots[i + fillCount], tiles[i].type));
                for (let i = emptyCount; i < tiles.length; i++) record.items.push(new OpreationRecordItem(originalSlots[i], floorSlots[floorIndex++], tiles[i].type));
            }
        }
        // 如果没有行槽位组，则将瓷砖全部移动到地板中
        else
            for (let i = tiles.length; i--;) record.items.push(new OpreationRecordItem(originalSlots[i], floorSlots[floorIndex++], tiles[i].type));

        // 检查记录中是否有地砖下标超过6的项（该记录的槽位为 undefined ）
        let amendFirstTile = -1;
        record.items.forEach((item, index) => {
            if (!item.to) {
                // 如果先手瓷砖溢出了，则改为末格地板，并记录当前下标
                if (item.type === 'first-tile') {
                    item.to = floorSlots[6];
                    amendFirstTile = index;
                } else item.to = tileSlots.overflow;
            }
        });
        // 如果有先手瓷砖溢出，则在溢出前插入一步移出末格地板的记录
        if (amendFirstTile >= 0) {
            let type = 0;
            if (floorSlots[6].tiles[0]) type = floorSlots[6].tiles[0].type;
            // 从之前的记录中找到将要移入末格的瓷砖
            else
                for (let i = amendFirstTile; i-- > 0;)
                    if (record.items[i].to === floorSlots[6]) {
                        type = record.items[i].type;
                        record.items[i].to = tileSlots.overflow;
                        break;
                    }
            record.items.splice(amendFirstTile, 0, new OpreationRecordItem(floorSlots[6], tileSlots.overflow, 'first-tile'));
        }
        // 记录玩家行动顺序
        record.originalPlayer = STORE.currPlayer;
        record.newPlayer = (STORE.currPlayer + 1) % CONFIG.game.playerNumber;
        // 清除后续记录，添加新记录并执行
        this.pushRecord(record);
    }

    reset() {
        let record = new OpreationRecord(false);
        record.newCode = '0';
        this.recordList = [record];
        this.currentIndex = 0;
    }

    /**
     * 追加一条新记录。
     * 
     * @param {OpreationRecord} record 要追加的操作记录
     */
    pushRecord(record) {
        this.recordList.splice(this.currentIndex + 1);
        this.recordList.push(record);
        this.next();
    }

    /**
     * 执行下一条操作
     */
    next() {
        if (this.currentIndex >= this.recordList.length - 1) return;
        // 清除选中区
        APP.game.unselectTiles();
        let record = this.recordList[++this.currentIndex];
        if (record.isMove) {
            let overflowSlot = APP.canvas.tileSlots.overflow;
            record.items.forEach(item => {
                let tile = item.from.tiles[0];
                // 如果来源是溢出槽位，或原槽位中没有瓷砖，则创建新瓷砖
                if (item.from === overflowSlot || !tile) tile = new Tile(item.type, item.from);
                tile.move(item.to);
            });
            APP.game.changePlayerState(record.newPlayer);
            // 更新堆积区输入框的值
            for (let i = 5; i--;) APP.page.stackInputs[i].setValue(APP.canvas.tileSlots.stacks['tile' + i].tiles.length);
            // 更新记录中的局面代码
            record.newCode = encodeGameData();
        }
        // 如果不是移动操作，则通过编码更新界面
        else decodeGameData(record.newCode);
        // 解锁撤销按钮，计算下一步按钮状态
        this.activateButton();
    }

    /**
     * 撤销上一条操作
     */
    undo() {
        if (this.currentIndex < 1) return;
        // 清除选中区
        APP.game.unselectTiles();
        let record = this.recordList[this.currentIndex--];
        if (record.isMove) {
            let overflowSlot = APP.canvas.tileSlots.overflow;
            record.items.forEach(item => {
                let tile = item.to.tiles[0];
                // 如果来源是溢出槽位，或原槽位中没有瓷砖，则创建新瓷砖
                if (item.to === overflowSlot || !tile) tile = new Tile(item.type, item.to);
                tile.move(item.from);
            })
            APP.game.changePlayerState(record.originalPlayer);
            // 更新堆积区输入框的值
            for (let i = 5; i--;) APP.page.stackInputs[i].setValue(APP.canvas.tileSlots.stacks['tile' + i].tiles.length);
        }
        // 如果不是移动操作，则通过编码更新界面
        else decodeGameData(this.recordList[this.currentIndex].newCode);
        // 解锁下一步按钮，计算撤销按钮状态
        this.activateButton();
    }

    /**
     * 激活按钮状态。
     */
    activateButton() {
        APP.page.buttons.undo.setAttribute('disabled', !this.currentIndex);
        APP.page.buttons.next.setAttribute('disabled', this.currentIndex === this.recordList.length - 1);
    }
}