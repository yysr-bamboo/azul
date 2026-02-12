// ----------------------------------------------------------------
// 本文件为游戏数据编码器。
// 
// 编码解码规约：
// 编码默认从低位到高位排序，即最低位代表下标为0的值。
// ----------------------------------------------------------------

/**
 * 将页面全部可变数据进行编码，并返回。
 * @returns {string} 数据编码
 */
let encodeGameData = function() {};

/**
 * 将数据编码进行解码，并置入页面中。
 * @param {string} data 数据编码
 * @returns {boolean} 编码是否合法
 */
let decodeGameData = function(data) {};

(function() {
    // 编码表，目前用到64位
    let codeScheme = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz?-+=*_|&%$#@!/.';
    // 类型数字映射表
    let typeCodeMap = {
        'tile0': 1,
        'tile1': 2,
        'tile2': 3,
        'tile3': 4,
        'tile4': 5,
        'first-tile': 6
    }

    decodeGameData = function(_data) {
        if (!_data) _data = '0';
        let temp;
        let tempArray = [];
        // 将data全部转为数字数组
        _data = _data.trim();
        let data = new Array(_data.length);
        for (let i = _data.length; i--;) {
            let n = codeScheme.indexOf(_data[i]);
            if (n < 0) return false;
            data[i] = n;
        }

        // 初始化 result 对象
        let result = {
            // [9][4]数组
            factories: [],
            // [5]数组，1-5号堆积区数量:number
            stackInputValues: [0, 0, 0, 0, 0],
            // [4]数组，玩家数据对象
            players: [],
            // [5]数组，1-5号供应袋的取反数量:number
            supplyInputValues: [20, 20, 20, 20, 20],
            currPlayer: 0
        };
        for (let i = 9; i--;) result.factories.push([]);
        // 初始化玩家数据
        for (let i = 4; i--;) {
            result.players[i] = {
                line: [],
                floor: [],
                wall: [], // 用 01 表示元素是否存在
                wallCode: 0,
                score: 0
            };
            for (let j = 0; j < 5; j++) result.players[i].line[j] = { typeId: 0, amount: 0 }; // typeId 为：0表示空格，1到5表示瓷砖类型，6表示先手瓷砖
            for (let j = 0; j < 7; j++) result.players[i].floor[j] = { typeId: 0 };
        }

        // 根据游标获取数据
        let cursor = 0;
        // 第1位以位串表示“工厂、玩家面板、堆积区、供应袋、玩家分数”是否为0，最低位是工厂
        let superFlag = data[cursor++];

        // 解码工厂
        if (superFlag & 1) {
            // 第1位是工厂flag，记录哪些工厂为空，他的最高位是扩展标记，如果该标记为1，则将下一位数据合并为工厂flag
            let factoryFlag = data[cursor++];
            if (factoryFlag === undefined) return false;
            // 检查是否扩展数据，如果有扩展数据，则原数据进位为第6个到第9个工厂，扩展数据为第1个到第5个工厂
            if (factoryFlag & 32) {
                let ex = data[cursor++];
                if (ex === undefined || ex > 31) return false;
                factoryFlag = (factoryFlag & 31) << 5 | ex;
            }
            // 解析工厂数据，每个工厂数据有2位，每1位通过 6 * 6 表示2颗砖的类型（类型数值为1到5，所以用6进位）
            for (let i = 9; i--;) {
                if (factoryFlag & (1 << i)) {
                    let d1 = data[cursor++];
                    let d2 = data[cursor++];
                    if (d1 === undefined || d2 === undefined) return false;
                    // 将数据转为瓷砖
                    result.factories[i][0] = d2 % 6;
                    result.factories[i][1] = d2 / 6 | 0; // | 0 可以取整
                    result.factories[i][2] = d1 % 6;
                    result.factories[i][3] = d1 / 6 | 0;
                }
            }
        }

        // 记录先手瓷砖唯一性
        let firstTileFlag = 0;
        // 解码玩家面板
        if (superFlag & 2) {
            // 第1位是flag，记录哪些玩家面板为空
            let playerFlag = data[cursor++];
            if (playerFlag === undefined) return false;
            for (let i = 4; i--;) {
                if (playerFlag & (1 << i)) {
                    // 前2位由低到高存储：线的数据长度4，线的溢出值3，地板的数据长度4，地板的溢出值4，墙的数据长度5，墙的溢出值2（位数分别是2，2，2，2，3，1）
                    let currPlayerFlag = data[cursor++] << 6 | data[cursor++];
                    if (!currPlayerFlag) return false;
                    // 解析 lines
                    let length = currPlayerFlag & 3;
                    currPlayerFlag >>= 2;
                    if (length) {
                        let lineData = 0;
                        tempArray = [0, 0, 0, currPlayerFlag & 3];
                        for (let j = length; j--;) tempArray[j] = data[cursor++];
                        for (let j = 4; j--;) lineData = lineData << 6 | tempArray[j];
                        // 将数值转为 result 中的数据
                        for (let j = 0; j < 5; lineData = lineData / (j * 5 + 6) | 0, j++) {
                            temp = lineData % (j * 5 + 6);
                            if (temp--) {
                                result.players[i].line[j].typeId = temp % 5;
                                result.players[i].line[j].amount = (temp / 5 | 0) + 1;
                            }
                        }
                    }
                    currPlayerFlag >>= 2;

                    // 解析 floor
                    length = currPlayerFlag & 3;
                    currPlayerFlag >>= 2;
                    if (length) {
                        let floorData = 0;
                        tempArray = [0, 0, 0, currPlayerFlag & 3];
                        for (let j = length; j--;) tempArray[j] = data[cursor++];
                        for (let j = 4; j--;) floorData = floorData << 6 | tempArray[j];
                        // 将数据转为 result 中的数据
                        for (let j = 0; j < 7; j++, floorData = floorData / 7 | 0) {
                            temp = floorData % 7;
                            if (!temp) break;
                            result.players[i].floor[j].typeId = temp;
                            // 保证先手瓷砖唯一性
                            if (temp == 6) {
                                if (firstTileFlag == true) return false;
                                firstTileFlag = true;
                            }
                        }
                    }
                    currPlayerFlag >>= 2;

                    // 解析 wall
                    length = currPlayerFlag & 7;
                    currPlayerFlag >>= 3;
                    if (length) {
                        let wallCode = 0;
                        tempArray = [0, 0, 0, 0, currPlayerFlag & 1];
                        for (let j = length; j--;) tempArray[j] = data[cursor++];
                        for (let j = 5; j--;) wallCode = wallCode << 6 | tempArray[j];
                        // 将数值转为 result 中的数据
                        result.players[i].wallCode = wallCode;
                        for (let j = 0; j < 25; j++, wallCode >>= 1) result.players[i].wall[j] = wallCode & 1;
                    }
                }
            }
        }

        // 解码堆积区
        if (superFlag & 4) {
            let top = data[cursor++];
            let length = top >> 4;
            if (top === undefined || length < 0 || length > 3) return false;
            temp = top & 15;
            for (let i = 0; i < length; i++) {
                let n = data[cursor++];
                if (n === undefined) return false;
                temp = temp << 6 | n;
            }
            // 解析为堆积区的值
            for (let i = 0; i < 5; i++, temp = temp / 21 | 0) result.stackInputValues[i] = temp % 21;
        }

        // 解码供应袋
        if (superFlag & 8) {
            let top = data[cursor++];
            let length = top >> 4;
            if (top === undefined || length < 0 || length > 3) return false;
            temp = top & 15;
            for (let i = 0; i < length; i++) {
                let n = data[cursor++];
                if (n === undefined) return false;
                temp = temp << 6 | n;
            }
            // 解析为供应袋的值
            for (let i = 0; i < 5; i++, temp = temp / 21 | 0) result.supplyInputValues[i] = 20 - temp % 21;
        }

        // 解码玩家分数
        if (superFlag & 16) {
            // 首位存储当前玩家及编码长度
            let top = data[cursor++];
            let length = top >> 2;
            result.currPlayer = top & 3;
            if (top === undefined || length < 1 || length > 6) return false;
            temp = 0;
            for (let i = 0; i < length; i++) {
                let n = data[cursor++];
                if (n === undefined) return false;
                // 可能超过32位，不能使用位运算
                temp = temp * 64 + n;
            }
            // 解析为玩家分数的值
            for (let i = 0; i < 4; i++, temp = Math.floor(temp / 241)) result.players[i].score = temp % 241;
        }

        // 将数据载入页面
        let slots = APP.canvas.tileSlots;
        // 默认先手瓷砖在原位
        APP.canvas.firstTile.move(slots.stacks['first-tile']);

        // 载入工厂数据
        for (let i = 9; i--;) {
            // 如果存在该工厂槽位组
            if (slots.factories[i]) {
                temp = result.factories[i];
                for (let j = 4; j--;) {
                    let slot = slots.factories[i][j];
                    // 清除原数据
                    slot.tiles.forEach(tile => tile.remove());
                    // 加入新数据
                    if (temp[j]) APP.canvas.createFactoryTile('tile' + (temp[j] - 1), slot);
                }
            }
        }
        // 载入玩家数据
        for (let i = 4; i--;) {
            if (slots.players[i]) {
                // 载入行
                let lineData = result.players[i].line;
                for (let line = 5; line--;) {
                    let lineSlots = slots.players[i].lines[line];
                    // clear tiles
                    lineSlots.forEach(slot => slot.tiles.forEach(tile => tile.remove()));
                    // add tiles
                    if (lineData[line].amount) APP.canvas.createLineTiles('tile' + lineData[line].typeId, lineSlots[lineData[line].amount - 1]);
                }
                // 载入地板
                let floorData = result.players[i].floor;
                for (let j = 0; j < 7; j++) {
                    let typeId = floorData[j].typeId;
                    // clear tiles
                    slots.players[i].floor[j].tiles.forEach(tile => tile.remove());
                    if (typeId) APP.canvas.createFloorTile(typeId == 6 ? 'first-tile' : 'tile' + (typeId - 1), slots.players[i].floor[j]);
                }
                // 载入墙
                let wallCode = result.players[i].wallCode;
                STORE.playerData[i].wallCode = wallCode;
                for (let j = 25; j--;) {
                    let tile = slots.players[i].wall[j].tiles[0];
                    if (wallCode & (1 << j)) {
                        tile.element.style.transform = 'scale(1)';
                        rotateElement(tile.element, CONFIG.xcss.wallTileRotateLimit);
                    } else tile.element.style.transform = 'scale(0)';
                }
            }
        }
        // 载入堆积区、供应袋数据、玩家分数
        for (let i = 0; i < 5; i++) {
            APP.page.stackInputs[i].setValue(result.stackInputValues[i]);
            // 重置瓷砖堆并生成新瓷砖
            APP.canvas.tileSlots.stacks['tile' + i].clear();
            APP.canvas.createStackTiles('tile' + i, result.stackInputValues[i]);
        }
        for (let i = 0; i < 5; i++) APP.page.supplyInputs[i].setValue(result.supplyInputValues[i]);
        for (let i = 4; i--;) {
            let input = APP.page.scoreInputs[i];
            input && input.setValue(result.players[i].score);
        }
        APP.game.changePlayerState(result.currPlayer);

        return true;
    };

    encodeGameData = function() {
        // if (STORE.appMode !== 'editing') {
        //     alert('只能在编辑模式下保存。');
        //     return '';
        // }
        if (!APP.checker.checkFactory()) {
            alert('存在不合理的工厂！无法保存。');
            return '';
        }
        if (!APP.checker.checkWall()) {
            alert('存在不合理的墙！无法保存。');
        }
        APP.canvas.trimFloorTiles();

        let data = [0];
        let temp;
        let tempArray = [];
        let slots = APP.canvas.tileSlots;

        // 获取工厂数据
        let factoryFlag = 0;
        let factoryData = [];
        for (let i = 9; i--;) {
            let factory = slots.factories[i];
            if (factory && factory[0].tiles[0]) {
                factoryFlag |= 1 << i;
                factoryData.push(typeCodeMap[factory[3].tiles[0].type] * 6 + typeCodeMap[factory[2].tiles[0].type]);
                factoryData.push(typeCodeMap[factory[1].tiles[0].type] * 6 + typeCodeMap[factory[0].tiles[0].type]);
            }
        }
        // 存储工厂数据
        if (factoryFlag) {
            data[0] |= 1;
            if (factoryFlag > 31) data.push(factoryFlag >> 5 | 32, factoryFlag & 31);
            else if (factoryFlag) data.push(factoryFlag);
            factoryData.forEach(n => data.push(n));
        }

        // 获取玩家数据
        let playerFlag = 0;
        tempArray = [];
        for (let i = 4; i--;) {
            let playerBoard = slots.players[i];
            if (playerBoard) {
                temp = 0;
                // 获取行数据
                for (let j = 5; j--;) {
                    temp *= (j * 5 + 6);
                    for (let k = j + 1; k--;) {
                        let tile = playerBoard.lines[j][k].tiles[0];
                        if (tile) {
                            // 通过 Map 获得的类型比实际值多1，这是故意为了将“0”空出来。
                            temp += k * 5 + typeCodeMap[tile.type];
                            break;
                        }
                    }
                }
                let lineData = [];
                while (temp) {
                    lineData.push(temp & 63);
                    temp >>= 6;
                }
                // 获取地板数据
                for (let j = 7; j--;) {
                    temp *= 7;
                    let tile = playerBoard.floor[j].tiles[0];
                    if (tile) temp += typeCodeMap[tile.type];
                }
                let floorData = [];
                while (temp) {
                    floorData.push(temp & 63);
                    temp >>= 6;
                }
                // 获取墙数据
                temp = STORE.playerData[i].wallCode;
                let wallData = [];

                while (temp) {
                    wallData.push(temp & 63);
                    temp >>= 6;
                }

                // 刻录数据
                let currPlayerFlag = ~~wallData[4] << 3 | Math.min(wallData.length, 4);
                currPlayerFlag = (currPlayerFlag << 2 | ~~floorData[3]) << 2 | Math.min(floorData.length, 3);
                currPlayerFlag = (currPlayerFlag << 2 | ~~lineData[3]) << 2 | Math.min(lineData.length, 3);
                if (currPlayerFlag) {
                    playerFlag |= 1 << i;
                    tempArray.push(currPlayerFlag >> 6, currPlayerFlag & 63);
                    for (j = Math.min(lineData.length, 3); j--;) tempArray.push(lineData[j]);
                    for (j = Math.min(floorData.length, 3); j--;) tempArray.push(floorData[j]);
                    for (j = Math.min(wallData.length, 4); j--;) tempArray.push(wallData[j]);
                }
            }
        }
        // 存储玩家数据
        if (playerFlag) {
            data[0] |= 2;
            data.push(playerFlag);
            tempArray.forEach(n => data.push(n));
        }

        // 获取堆积区数据
        let stackData = 0;
        for (let i = 5; i--;) stackData = stackData * 21 + APP.page.stackInputs[i].getValue();
        // 存储堆积区数据
        if (stackData) {
            data[0] |= 4;
            tempArray = [];
            while (stackData) {
                tempArray.push(stackData & 63);
                stackData >>= 6;
            }
            // 数组长度为1到4，实际存储0到3
            let length = tempArray.length - 1;
            // 如果末位超过了15，则追加一位存储长度
            if (tempArray[length] > 15) tempArray.push(length + 1 << 4);
            // 否则，在末位合并存储长度
            else tempArray[length] |= length << 4;
            // 前面是逆序存入的数据，所以此时需要逆序插入
            for (let i = tempArray.length; i--;) data.push(tempArray[i]);
        }

        // 获取供应袋数据
        let supplyData = 0;
        for (let i = 5; i--;) supplyData = supplyData * 21 + 20 - APP.page.supplyInputs[i].getValue();
        // 存储供应袋数据
        if (supplyData) {
            data[0] |= 8;
            tempArray = [];
            while (supplyData) {
                tempArray.push(supplyData & 63);
                supplyData >>= 6;
            }
            // 数组长度为1到4，实际存储0到3
            let length = tempArray.length - 1;
            // 如果末位超过了15，则追加一位存储长度
            if (tempArray[length] > 15) tempArray.push(length + 1 << 4);
            // 否则，在末位合并存储长度
            else tempArray[length] |= length << 4;
            // 前面是逆序存入的数据，所以此时需要逆序插入
            for (let i = tempArray.length; i--;) data.push(tempArray[i]);
        }

        // 获取玩家分数数据
        let scoreData = 0;
        for (let i = 4; i--;) scoreData = scoreData * 241 + (APP.page.scoreInputs[i] ? APP.page.scoreInputs[i].getValue() : 0);
        if (STORE.currPlayer + scoreData) {
            data[0] |= 16;
            // 对分数进行编码，由于位数可能超过32位，所以不能使用位运算
            tempArray = [];
            while (scoreData) {
                tempArray.push(scoreData % 64);
                scoreData = Math.floor(scoreData / 64);
            }
            // 存储当前玩家及编码长度
            data.push(tempArray.length << 2 | STORE.currPlayer);
            // 前面是逆序存入的数据，所以此时需要逆序插入
            for (let i = tempArray.length; i--;) data.push(tempArray[i]);
        }

        // 将data编码
        let code = '';
        data.forEach(n => code += codeScheme[n]);
        return code;
    };
})();