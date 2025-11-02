import { _decorator, CCInteger, Component, instantiate, Label, Node, Prefab, Vec3 } from 'cc';
import { BLOCK_SIZE, PlayerController } from './PlayerController';
const { ccclass, property } = _decorator;

/**
 * 方块类型
 */
enum BlockType {
    BT_NONE,
    BT_STONE,
};

/**
 * 游戏状态
 */
enum GameState {
    GS_INIT,
    GS_PLAYING,
    GS_END,
};

@ccclass('GameManager')
export class GameManager extends Component {
    @property({ type: Prefab })
    public boxPrefab: Prefab | null = null; // 方块预制体
    @property({ type: CCInteger })
    public roadLength: number = 50; // 道路长度
    @property({ type: Node })
    public startMenu: Node | null = null; // 开始菜单
    @property({ type: PlayerController })
    public playerCtrl: PlayerController | null = null;  // 玩家控制脚本
    @property({ type: Label })
    public stepsLabel: Label | null = null; // 步数显示标签

    private _road: BlockType[] = [];    // 道路数据

    /**
     * 生命周期函数
     */
    start() {
        this.setCurState(GameState.GS_INIT); // 第一初始化要在 start 里面调用
        this.playerCtrl?.node.on('JumpEnd', this.onPlayerJumpEnd, this);    // 监听玩家跳跃结束事件
    }

    /**
     * 设置当前游戏状态
     * @param value 游戏状态值
     */
    setCurState(value: GameState) {
        switch (value) {
            case GameState.GS_INIT:
                this.init();
                break;
            case GameState.GS_PLAYING:
                if (this.startMenu) {
                    this.startMenu.active = false;  // 隐藏开始菜单
                }

                if (this.stepsLabel) {
                    this.stepsLabel.string = '0';   // 将步数重置为0
                }

                setTimeout(() => {      //直接设置active会直接开始监听鼠标事件，做了一下延迟处理
                    if (this.playerCtrl) {
                        this.playerCtrl.setInputActive(true);
                    }
                }, 0.1);
                break;
            case GameState.GS_END:
                this.setCurState(GameState.GS_INIT);
                break;
        }
    }

    /**
     * 初始化游戏
     */
    init() {
        if (this.startMenu) {
            this.startMenu.active = true;   // 显示开始菜单
        }

        this.generateRoad();

        if (this.playerCtrl) {
            this.playerCtrl.setInputActive(false);  // 禁止玩家输入
            this.playerCtrl.node.setPosition(Vec3.ZERO);    // 重置玩家位置
            this.playerCtrl.reset();    // 重置玩家数据
        }
    }

    /**
     * 生成道路
     */
    generateRoad() {
        this.node.removeAllChildren();  // 清空之前的道路

        this._road = [];
        // startPos
        this._road.push(BlockType.BT_STONE);

        for (let i = 1; i < this.roadLength; i++) {
            if (this._road[i - 1] === BlockType.BT_NONE) {  // 上一个是空方块，当前只能是石块，因为最多只能跳两步
                this._road.push(BlockType.BT_STONE);
            } else {
                this._road.push(Math.floor(Math.random() * 2)); // 否则随机生成石块或者空方块
            }
        }

        // 根据道路数据生成道路
        for (let j = 0; j < this._road.length; j++) {
            let block: Node | null = this.spawnBlockByType(this._road[j]);
            if (block) {
                this.node.addChild(block);
                block.setPosition(j * BLOCK_SIZE, 0, 0);
            }
        }
    }

    /**
     * 根据方块类型生成方块
     * @param type  方块类型
     * @returns 
     */
    spawnBlockByType(type: BlockType) {
        if (!this.boxPrefab) {
            return null;
        }

        let block: Node | null = null;
        switch (type) {
            case BlockType.BT_STONE:
                block = instantiate(this.boxPrefab);
                break;
        }

        return block;
    }

    /**
     * 开始按钮点击事件
     */
    onStartButtonClicked() {
        this.setCurState(GameState.GS_PLAYING);
    }

    /**
     * 玩家跳跃结束回调
     * @param moveIndex 当前移动到的方块索引 
     */
    onPlayerJumpEnd(moveIndex: number) {
        if (this.stepsLabel) {
            this.stepsLabel.string = '' + (moveIndex >= this.roadLength ? this.roadLength : moveIndex);
        }
        this.checkResult(moveIndex);
    }

    /**
     * 检查跳跃结果
     * @param moveIndex 当前移动到的方块索引
     */
    checkResult(moveIndex: number) {
        if (moveIndex < this.roadLength) {
            if (this._road[moveIndex] == BlockType.BT_NONE) {   //跳到了空方块上
                this.setCurState(GameState.GS_END)
            }
        } else {    // 跳过了最大长度            
            this.setCurState(GameState.GS_END);
        }
    }
}