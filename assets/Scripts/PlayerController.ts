import { _decorator, Animation, Color, Component, EventMouse, EventTouch, Input, input, Node, Sprite, Tween, tween, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

export const BLOCK_SIZE = 40; // 添加一个放大比

@ccclass('PlayerController')
export class PlayerController extends Component {
    @property(Animation)
    BodyAnim: Animation = null;
    @property(Node)
    leftTouch: Node = null;
    @property(Node)
    rightTouch: Node = null;

    private _startJump: boolean = false;
    private _jumpStep: number = 0;
    private _curJumpTime: number = 0;
    private _jumpTime: number = 0.1;
    private _curJumpSpeed: number = 0;
    private _curPos: Vec3 = new Vec3();
    private _deltaPos: Vec3 = new Vec3(0, 0, 0);
    private _targetPos: Vec3 = new Vec3();
    private _curMoveIndex: number = 0;
    private _bodySpirite: Sprite = null;
    private _initColor: Color = new Color(255, 0, 0, 255);

    /**
     * 生命周期函数
     */
    start() {
        this._bodySpirite = this.node.getChildByName("Body").getComponent(Sprite);
    }

    /**
     * 设置输入响应状态
     * @param active    是否响应输入
     */
    setInputActive(active: boolean) {
        if (active) {
            input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);
            this.leftTouch.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
            this.rightTouch.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        } else {
            input.off(Input.EventType.MOUSE_UP, this.onMouseUp, this);
            this.leftTouch.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
            this.rightTouch.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        }
    }

    /**
     * 重置玩家状态
     */
    reset() {
        Tween.stopAllByTarget(this._bodySpirite);
        this._bodySpirite.color = this._initColor.clone();
        this._curMoveIndex = 0;
        this.node.getPosition(this._curPos);
        this._targetPos.set(0, 0, 0);
    }

    /**
     * 鼠标抬起事件回调
     * @param event 鼠标事件
     */
    onMouseUp(event: EventMouse) {
        if (event.getButton() === 0) {
            this.jumpByStep(1);
        } else if (event.getButton() === 2) {
            this.jumpByStep(2);
        }
    }

    /**
     * 触摸开始事件回调
     * @param event 触摸事件
     */
    onTouchStart(event: EventTouch) {
        const target = event.target as Node;
        if (target?.name == 'LeftTouch') {
            this.jumpByStep(1);
        } else {
            this.jumpByStep(2);
        }
    }

    /**
     * 通过步数跳跃
     * @param step  跳跃的步数
     * @returns 
     */
    jumpByStep(step: number) {
        if (this._startJump) {
            return;
        }
        this._startJump = true; // 标记开始跳跃
        this._jumpStep = step;  // 跳跃的步数 1 或者 2
        this._curJumpTime = 0;  // 重置开始跳跃的时间

        const clipName = step === 1 ? 'oneStep' : 'twoStep';
        const state = this.BodyAnim.getState(clipName);
        this._jumpTime = state.duration; // 根据动画时间设置跳跃时间

        this._curJumpSpeed = this._jumpStep * BLOCK_SIZE / this._jumpTime; // 根据时间计算出速度
        this.node.getPosition(this._curPos); // 获取角色当前的位置
        Vec3.add(this._targetPos, this._curPos, new Vec3(this._jumpStep * BLOCK_SIZE, 0, 0));   // 计算出目标位置

        if (this.BodyAnim) {
            if (step === 1) {
                this.BodyAnim.play('oneStep');
            } else if (step === 2) {
                this.BodyAnim.play('twoStep');
            }

            // 颜色变换效果
            const color = this._initColor.clone();
            tween(color)
                .to(this._jumpTime, { r: this.getRandomColor(), g: this.getRandomColor(), b: this.getRandomColor(), a: this.getRandomColor() },
                    {
                        onUpdate: () => {
                            this._bodySpirite.color = color;
                        }
                    })
                .timeScale(2)
                .to(this._jumpTime, { r: this._initColor.r, g: this._initColor.g, b: this._initColor.b, a: this._initColor.a },
                    {
                        onUpdate: () => {
                            this._bodySpirite.color = color;
                        }
                    })
                .timeScale(2)
                .start();
        }

        this._curMoveIndex += step;
    }

    /**
     * 获取随机颜色值
     * @returns 
     */
    getRandomColor() {
        return Math.floor(Math.random() * 256);
    }

    /**
     * 每帧更新
     * @param deltaTime 每帧时间间隔
     */
    update(deltaTime: number) {
        if (this._startJump) {
            this._curJumpTime += deltaTime; // 累计总的跳跃时间
            if (this._curJumpTime > this._jumpTime) {   // 当跳跃时间是否结束
                // end 
                this.node.setPosition(this._targetPos); // 强制位置到终点
                this._startJump = false;    // 清理跳跃标记
                this.onOnceJumpEnd();
            } else {
                // tween
                this.node.getPosition(this._curPos);
                this._deltaPos.x = this._curJumpSpeed * deltaTime; //每一帧根据速度和时间计算位移
                Vec3.add(this._curPos, this._curPos, this._deltaPos); // 应用这个位移
                this.node.setPosition(this._curPos); // 将位移设置给角色
            }
        }
    }

    /**
     * 单次跳跃结束回调
     */
    onOnceJumpEnd() {
        this.node.emit('JumpEnd', this._curMoveIndex);
    }
}