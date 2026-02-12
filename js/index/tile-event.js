class TileEvent {

    factory() {
        // 在编辑模式下点击时销毁
        if (STORE.appMode === 'editing') this.getTile().remove();
        // 推演模式下点击时批量选中
        else if (STORE.appMode === 'deduce') {
            // 取消选择上一次的瓷砖
            APP.game.unselectTiles();
            let slots = this.getTile().slot.group;
            let type = this.getTile().type;
            slots.forEach(slot => {
                if (slot.tiles[0].type === type) {
                    STORE.selectedTileSlots.push(slot);
                    slot.tiles[0].move(APP.canvas.tileSlots.selectedArea);
                }
            });
            // 展开选中瓷砖的区域
            APP.canvas.expandSelectedArea();
        }
    };

    /**
     * 在编辑模式下，点击一个堆中的瓷砖，将其所在的槽位选中或取消选中。
     */
    stack() {
        if (STORE.appMode === 'editing') APP.game.selectStackInEditing(this.getTile());
        if (STORE.appMode === 'deduce') {
            // 清空选择区，然后移动选中的瓷砖至选择区
            APP.game.unselectTiles();
            let slot = this.getTile().slot;
            let tiles = slot.tiles;
            STORE.selectedTileFromStack = true;
            for (let i = tiles.length; i--;) {
                STORE.selectedTileSlots.push(slot);
                tiles[i].move(APP.canvas.tileSlots.selectedArea);
            }
            // 如果先手瓷砖还在，一并拿取
            let firstTileSlot = APP.canvas.tileSlots.stacks['first-tile'];
            if (firstTileSlot.tiles[0]) {
                STORE.selectedTileSlots.push(firstTileSlot);
                firstTileSlot.tiles[0].move(APP.canvas.tileSlots.selectedArea);
            }
            // 展开选中瓷砖的区域
            APP.canvas.expandSelectedArea();
        }
    }

    line(event) {
        // 阻止事件冒泡，不触发槽位事件
        event.stopPropagation();
        // 如果是编辑模式，清空该槽位对应行中的所有瓷砖
        if (STORE.appMode === 'editing')
            for (const slot of this.getTile().slot.group) slot.tiles[0] && slot.tiles[0].remove();
    };

    floor() {
        // 在编辑模式下点击时销毁
        if (STORE.appMode === 'editing') this.getTile().remove();
    }
}