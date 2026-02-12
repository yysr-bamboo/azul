class Game {
    /**
     * 切换模式。
     * @param {string} mode 要切换到的模式
     * @returns {boolean} 是否成功切换
     */
    changeMode(mode) {
        // 重置选中的瓷砖。
        this.clearSelectedTileInEditing();

        // 切换至编辑模式
        if (mode === 'editing') {
            STORE.appMode = mode;
            // 清除选中区
            this.unselectTiles();
            // 重置瓷砖堆并在瓷砖堆中插入5个可选瓷砖
            for (let i = 0; i < 5; i++) {
                let slot = APP.canvas.tileSlots.stacks['tile' + i];
                slot.clear();
                let tile = new Tile('tile' + i, slot);
                tile.element.onclick = APP.tileEvent.stack;
            }
            // 重置堆槽位中的先手瓷砖
            if (APP.canvas.tileSlots.stacks['first-tile'].tiles[0]) APP.canvas.tileSlots.stacks['first-tile'].tiles[0].element.style.transform = 'translate(0, 0) rotate(0deg)';
            // 移除所有输入框的禁止输入属性
            document.querySelectorAll('input').forEach(input => {
                input.removeAttribute('disabled');
                input.classList.remove('select-none');
            });
            APP.page.buttons.undo.setAttribute('disabled', 'true');
            APP.page.buttons.next.setAttribute('disabled', 'true');
            APP.page.buttons.load.setAttribute('disabled', 'false');
            APP.page.buttons.save.setAttribute('disabled', 'false');
            // 恢复工厂、先手瓷砖、行蒙版瓷砖、墙面和编辑器上的小手
            document.querySelectorAll('.only-editing').forEach(e => e.classList.add('cursor-pointer'));
        }

        // 切换至推演模式
        if (mode === 'deduce') {
            if (!APP.checker.checkFactory()) {
                alert('存在不合理的工厂！禁止切换模式。');
                return false;
            }
            if (!APP.checker.checkWall()) {
                alert('存在不合理的墙！禁止切换模式。');
            }
            STORE.appMode = mode;
            // 根据数据随机生成堆中瓷砖
            for (let i = 5; i--;) {
                // 重置瓷砖堆并生成新瓷砖
                APP.canvas.tileSlots.stacks['tile' + i].clear();
                APP.canvas.createStackTiles('tile' + i, APP.page.stackInputs[i].getValue());
            }
            // 修整地板瓷砖，将地板瓷砖向左对齐
            APP.canvas.trimFloorTiles();
            // 通过比较代码检查局面是否变动
            let currentCode = encodeGameData();
            if (currentCode !== APP.operator.recordList[APP.operator.currentIndex].newCode) {
                // let record = new OpreationRecord(false);
                // record.newCode = currentCode;
                APP.operator.reset();
            }
            // 禁止输入框输入
            document.querySelectorAll('input').forEach(input => {
                input.setAttribute('disabled', true);
                input.classList.add('select-none');
            });
            APP.operator.activateButton();
            APP.page.buttons.load.setAttribute('disabled', true);
            APP.page.buttons.save.setAttribute('disabled', true);
            // 取消工厂、先手瓷砖、行蒙版瓷砖、墙面和编辑器上的小手
            document.querySelectorAll('.only-editing').forEach(e => e.classList.remove('cursor-pointer'));
        }
        return true;
    }

    /**
     * 改变玩家当前状态，将当前玩家设为行动状态，其他玩家改为等待状态。
     * @param {number} index 当前行动玩家的下标
     */
    changePlayerState(index) {
        let element = APP.page.playerStateArray[index];
        STORE.currPlayer = index;
        for (let i = 0; i < element.group.length; i++) element.group[i].innerText = index === i ? '⏳' : '⛔';
    }

    /**
     * 清除选中的瓷砖。
     */
    clearSelectedTileInEditing() {
        APP.page.tileStackArea.classList.remove('has-selected-tile');
        STORE.selectedEditingTile = null;
    }

    /**
     * 在编辑模式下，点击一个堆中的瓷砖，将其所在的槽位选中或取消选中。
     * 
     * @param {Tile} tile 被点击的瓷砖对象
     */
    selectStackInEditing(tile) {
        // 如果当前已被选中，则取消选中
        if (STORE.selectedEditingTile === tile) return this.clearSelectedTileInEditing();
        let tileStackArea = APP.page.tileStackArea;
        // 移动堆光标
        tileStackArea.setAttribute('cursor', tile.type);
        // 将选中的瓷砖重置为当前点击的瓷砖
        STORE.selectedEditingTile = tile;
        tileStackArea.classList.add('has-selected-tile');
    }

    /**
     * 取消推演模式下选中的所有瓷砖，并归还至原槽位中。
     */
    unselectTiles() {
        if (!STORE.selectedTileSlots.length) return;
        let tiles = APP.canvas.tileSlots.selectedArea.tiles;
        for (let i = tiles.length; i--;) tiles[i].move(STORE.selectedTileSlots[i]);
        STORE.selectedTileSlots = [];
    }

    /**
     * 点击玩家面板的行槽位时，如果当前是编辑模式且已选中砖块，则将砖块移动到玩家面板中。
     * 
     * @param {TileSlot} slot 行槽位对象
     */
    clickLineSlot(slot) {
        // 如果是编辑模式
        if (STORE.appMode === 'editing') {
            // 可选效果：如果该行已有瓷砖，直接返回
            // if (slot.getGroupTileCount() != 0) return;
            // 如果该行已有瓷砖，清空该行
            if (slot.getGroupTileCount() != 0)
                for (const s of slot.group) s.tiles[0] && s.tiles[0].remove();
            // 如果已选中非先手瓷砖
            let model = STORE.selectedEditingTile;
            if (model && model.type !== 'first-tile') APP.canvas.createLineTiles(model.type, slot);
        }
        // 如果是推演模式，且选中区有瓷砖，则移动瓷砖并记录操作
        let tile = APP.canvas.tileSlots.selectedArea.tiles[0];
        if (STORE.appMode === 'deduce' && tile) {
            // 根据槽位长度取得行号，并检查是否为当前行动玩家的行
            let lineNumber = slot.group.length;
            if (APP.canvas.tileSlots.players[STORE.currPlayer].lines[lineNumber - 1] !== slot.group) return;
            // 获取选中区的第一个瓷砖，并检查该行的已有色和墙
            if (slot.group[0].tiles[0] && slot.group[0].tiles[0].type !== tile.type) return;
            if (STORE.playerData[STORE.currPlayer].wallCode & APP.checker.lineTypeWallMap[tile.type][lineNumber - 1]) return;
            // 移动瓷砖并记录操作
            APP.operator.action(APP.canvas.tileSlots.players[STORE.currPlayer].floor, slot.group);
        }
    }

    /**
     * 点击玩家面板的地板槽位时，如果当前是编辑模式且已选中砖块，则将砖块移动到玩家面板中。
     * 
     * @param {TileSlot} slot 地板槽位对象
     */
    clickFloorSlot(slot) {
        if (STORE.appMode === 'editing') {
            let model = STORE.selectedEditingTile;
            // 如果该格已充填，或未选中瓷砖，则返回
            if (slot.tiles[0] || !model) return;
            APP.canvas.createFloorTile(model.type, slot);
        }
        // 如果是推演模式，且选中区有瓷砖，则移动瓷砖并记录操作
        let tile = APP.canvas.tileSlots.selectedArea.tiles[0];
        if (STORE.appMode === 'deduce' && tile) {
            // 检查是否为当前行动玩家的地板
            if (slot.group !== APP.canvas.tileSlots.players[STORE.currPlayer].floor) return;
            // 移动瓷砖并记录操作
            APP.operator.action(slot.group);
        }
    }
}