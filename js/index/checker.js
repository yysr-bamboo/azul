class Checker {

    /** 线上的类型到墙单元格的映射，用于检测线与墙是否有冲突 */
    lineTypeWallMap = {
        tile0: [1, 64, 4096, 262144, 16777216],
        tile1: [2, 128, 8192, 524288, 1048576],
        tile2: [4, 256, 16384, 32768, 2097152],
        tile3: [8, 512, 1024, 65536, 4194304],
        tile4: [16, 32, 2048, 131072, 8388608]
    };
    /**
     * 校验工厂的合理性。
     */
    checkFactory() {
        for (let i = PAGE_CONFIG.factoryNumber; i--;) {
            let factory = APP.canvas.tileSlots.factories[i];
            let base = !!factory[0].tiles[0];
            for (let j = 1; j < 4; j++)
                if (base !== !!factory[j].tiles[0]) return false;
        }
        return true;
    }

    /**
     * 校验墙的合理性。
     */
    checkWall() {
        for (let i = PAGE_CONFIG.playerNumber; i--;) {
            let player = APP.canvas.tileSlots.players[i];
            if (!player) continue;
            for (let j = 5; j--;) {
                // 如果行上有瓷砖，则校验墙
                let tile = player.lines[j][0].tiles[0];
                if (tile && (STORE.playerData[i].wallCode & this.lineTypeWallMap[tile.type][j])) return false;
            }
        }
        return true;
    }
}