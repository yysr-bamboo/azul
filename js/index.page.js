/**
 * 初始化页面，在确认 CONFIG 后执行
 */
class Page {

    /** 初始化全局CSS变量 */
    cssProperty = {
        tileWidth: 32, // 单位px
        transitionDuration: 300, // 单位毫秒
    };
    stackCursor = null;
    /** @type {Tile} 先手瓷砖 */
    firstTile = null;
    /** @type {HTMLElement} 桌子中央瓷砖堆列表 */
    tileStackArea = document.getElementById('tile-stack-area');
    /** @type {PositiveIntegerInput[]} 桌子中央瓷砖堆数量输入框列表 */
    stackInputs = [];
    /** @type {PositiveIntegerInput[]} 袋子中可供应的瓷砖数量输入框列表 */
    supplyInputs = [];
    /** @type {PositiveIntegerInput[]} 分数输入框列表 */
    scoreInputs = [];
    /** @type {HTMLElement} 显示玩家状态的对象 */
    playerStateArray = [];
    /** 按钮对象映射 */
    buttons = {
        'undo': null,
        'next': null,
        'load': null,
        'save': null
    }

    constructor() {
        document.documentElement.style.setProperty('--tile-width', this.cssProperty.tileWidth + 'px');
        document.documentElement.style.setProperty('--transition-duration', this.cssProperty.transitionDuration + 'ms');

        // 为 #app 绑定布局模式
        document.getElementById('app').setAttribute('layout', STORE.layoutMode);

        this.initSupplyArea();
        this.initPlayerArea();
        this.initConsole();

        // 初始化画布
        APP.canvas = new Canvas(this);
        APP.canvas.setSlotsPosition(this.cssProperty.tileWidth);
    }

    initSupplyArea() {
        let factoryArea = document.querySelector('#factories');
        // 充填工厂并绑定点击函数
        for (let i = 0; i < PAGE_CONFIG.factoryNumber; i++) {
            let factory = document.createElement('div');
            // only-editing 表示仅在编辑模式下出现小手光标
            factory.className = 'factory only-editing cursor-pointer';
            factoryArea.appendChild(factory);
            factory.getSlots = () => APP.canvas.tileSlots.factories[i];
            // 点击工厂时，如果当前是编辑模式且已选中非先手瓷砖，则创建砖块并移动到工厂中
            factory.onclick = function() {
                if (STORE.appMode !== 'editing' || !STORE.selectedEditingTile || STORE.selectedEditingTile.type === 'first-tile') return;
                // 遍历工厂的槽位，找到第一个空的槽位
                for (let i = 0, slots = this.getSlots(); i < 4; i++)
                    if (!slots[i].tiles[0]) return APP.canvas.createFactoryTile(STORE.selectedEditingTile.type, slots[i]);
            };
        }

        // 初始化堆积区
        for (let i = 0; i < 6; i++) {
            let stack = document.createElement('div');
            stack.className = 'stack';
            // 创建瓷砖堆积区
            let tileArea = document.createElement('div');
            tileArea.className = 'tile-area';
            stack.appendChild(tileArea);
            if (i !== 5) {
                // 插入正整数输入框
                let input = new PositiveIntegerInput({
                    className: 'integer-input',
                    max: 20
                });
                this.stackInputs.push(input);
                stack.appendChild(input.show());
            }
            this.tileStackArea.appendChild(stack);
        }
    }
    initPlayerArea() {
        // 充填玩家面板
        for (let i = 0; i < PAGE_CONFIG.playerNumber; i++) {
            let board = document.createElement('div');
            board.className = 'playerboard';
            // 保存玩家数据
            STORE.playerData.push({ wallCode: 0 });
            // 添加墙面蒙版，单元格内置瓷砖
            let wallMask = document.createElement('div');
            wallMask.className = 'mask wall-mask';
            board.appendChild(wallMask);
            // 插入到玩家区，并设置获取board偏移坐标的函数
            document.getElementById('playerboard-area').appendChild(board);
        }
    }
    initConsole() {
        let _page = this;
        let modeSwitch = document.querySelector('#mode-switch');
        let modeSwitchSlider = document.querySelector('#mode-switch-slider');
        // 初始化为编辑模式
        modeSwitch.setAttribute('mode', 'editing');
        modeSwitchSlider.style.transition = 'all var(--transition-duration) ease-in-out';
        // 点击滑块切换模式
        modeSwitch.addEventListener('click', function() {
            let mode = this.getAttribute('mode') == 'editing' ? 'deduce' : 'editing';
            let success = APP.game.changeMode(mode);
            if (!success) return;
            this.setAttribute('mode', mode);
            // 动画效果
            modeSwitchSlider.style.animation = 'mode-switch-sliding var(--transition-duration)';
            setTimeout(() => {
                modeSwitchSlider.style.animation = '';
            }, _page.cssProperty.transitionDuration);
        });


        // 瓷砖供应数编辑器
        let tileSupplyEditors = document.querySelector('#tile-supply-editors');
        for (let i = 0; i < 5; i++) {
            let editor = document.createElement('div');
            editor.className = 'tile-supply-editor';
            // 插入label和输入框
            let label = document.createElement('label');
            label.className = 'only-editing cursor-pointer tile tile' + i;
            label.setAttribute('for', 'tile-supply-editor-input' + i);
            let input = new PositiveIntegerInput({
                className: 'integer-input',
                max: 20,
                value: 20
            });
            // 绑定label
            input.show().setAttribute('id', 'tile-supply-editor-input' + i);
            // 组装
            this.supplyInputs[i] = input;
            editor.appendChild(label);
            editor.appendChild(input.show());
            tileSupplyEditors.appendChild(editor);
        }


        // 玩家数据（行动与分数）编辑器
        let playerDataEditors = document.querySelector('#player-data-editors');
        for (let i = 0; i < PAGE_CONFIG.playerNumber; i++) {
            let editor = document.createElement('div');
            editor.className = 'player-data-editor';
            let state = document.createElement('div');
            state.className = 'cursor-pointer select-none player-state';
            state.innerText = i === STORE.currPlayer ? '⏳' : '⛔';
            state.number = i;
            state.group = this.playerStateArray;
            // 点击切换为行动状态
            state.addEventListener('click', function() { STORE.appMode === 'editing' && APP.game.changePlayerState(this.number) });
            // 分数输入框
            let scoreInput = new PositiveIntegerInput({
                className: 'integer-input',
                max: 240
            });
            this.scoreInputs[i] = scoreInput;
            // 组装
            this.playerStateArray.push(state);
            editor.appendChild(state);
            editor.appendChild(scoreInput.show());
            playerDataEditors.appendChild(editor);
        }


        // 游戏数据编码器
        let gameEncoderButtonPanel = document.querySelector('#game-encoder .button-panel');
        let gameEncoderInput = document.querySelector('#game-encoder input');
        // 初始化撤销按钮，仅限推演模式使用
        let undoButton = document.createElement('div');
        undoButton.setAttribute('disabled', 'false');
        undoButton.innerText = 'undo';
        undoButton.style.borderRadius = '0 0 0 var(--input-border-radius)';
        gameEncoderButtonPanel.appendChild(undoButton);
        undoButton.onclick = e => STORE.appMode === 'deduce' && APP.operator.undo();
        this.buttons.undo = undoButton;
        // 初始化下一步按钮，仅限推演模式使用
        let nextButton = document.createElement('div');
        nextButton.setAttribute('disabled', 'false');
        nextButton.innerText = '下一步';
        gameEncoderButtonPanel.appendChild(nextButton);
        nextButton.onclick = e => STORE.appMode === 'deduce' && APP.operator.next();
        this.buttons.next = nextButton;
        // 读取游戏编码按钮
        let loadButton = document.createElement('div');
        loadButton.setAttribute('disabled', 'false');
        loadButton.innerText = '载入';
        gameEncoderButtonPanel.appendChild(loadButton);
        loadButton.onclick = function() {
            if (STORE.appMode !== 'editing') return;
            let newCode = gameEncoderInput.value.trim();
            if (!decodeGameData(newCode)) alert('无法解析局面，请检查局面码是否正确。');
        };
        this.buttons.load = loadButton;
        // 保存游戏编码
        let saveButton = document.createElement('div');
        saveButton.setAttribute('disabled', 'false');
        saveButton.innerText = '保存';
        saveButton.style.borderRadius = '0 0 var(--input-border-radius) 0';
        gameEncoderButtonPanel.appendChild(saveButton);
        saveButton.onclick = function() {
            if (STORE.appMode !== 'editing') return;
            gameEncoderInput.value = encodeGameData();
        };
        this.buttons.save = saveButton;
    }
}