import { Area, RenderInfo, View } from "./view.js";
import { WriteStream } from "node:tty";

export class Terminal extends View {
    private static instanceList = new WeakSet();
    protected root: undefined;
    protected get viewArea(): Area {
        let size = this.stdout.getWindowSize();
        return [0, 0, size[0], size[1]];
    }
    constructor(readonly stdout: WriteStream = process.stderr, readonly renderBus?: RenderBus) {
        if (Terminal.instanceList.has(stdout))
            throw new Error("stdout has been instantiated by another Terminal instance");
        Terminal.instanceList.add(stdout);
        super();
        stdout.on("resize", this.#onResize);
    }
    destructor() {
        this.stdout.off("resize", this.#onResize);
    }
    render(ignoreChild?: boolean | undefined, renderInfo?: RenderInfo): void {
        this.stdout.cursorTo(0, 0);
        let y = 0;
        let maxY = this.height;
        for (const line of this.getRenderLine()) {
            if (y > maxY) break;
            this.stdout.write(line);
            y++;
        }
    }
    #onResize = () => {
        this.asyncRender();
    };
    get width() {
        return this.stdout.columns;
    }
    get height() {
        return this.stdout.rows;
    }
    set autoWarp(val: boolean) {
        return;
    }
    readonly cursorIsShowed = true;
    showCursor(show: boolean) {
        let str = show ? "\u001B[?25h" : "\u001B[?25l";
        (this as any).cursorIsShowed = show;
        this.stdout.write(str);
    }
    moveCursorX(dx: number) {
        if (dx === 0) return;
        let data = dx < 0 ? "\x1B[" + -dx + "D" : "\x1B[" + dx + "C";
        this.stdout.write(data, "ascii");
    }
    moveCursorY(dy: number) {
        if (dy === 0) return;
        let data = dy < 0 ? "\x1B[" + -dy + "A" : "\x1B[" + dy + "B";
        this.stdout.write(data, "ascii");
    }
    saveCursor() {
        this.stdout.write("\x1B[s");
    }
    resetCursor() {
        this.stdout.write("\x1B[u");
    }
    clearArea(area?: Area) {
        if (!area) this.stdout.write("\x1B[2J");
        else super.clearArea(area);
    }
    clearScreenDown() {
        this.stdout.clearScreenDown();
    }
    clearLine() {
        this.stdout.write("\x1b[K");
    }
    cursorTo(x: number, y?: number) {
        this.stdout.cursorTo(x, y);
    }
    /**
     * @description 使用process.stderr创建terminal, 设置默认RenderBus、清除终端内容、隐藏光标
     * @param time 异步渲染最短时间间隔, 默认1000/30毫秒 即每秒30帧
     */
    static createDefault(time = 1000 / 30) {
        let terminal = new this(undefined, new RenderBus(time));
        terminal.showCursor(false);
        terminal.clearArea();
        return terminal;
    }
}

type Callback = () => void;
type CallList = Set<Callback>;

/** UI渲染优化机制, 避免频繁渲染 */
export class RenderBus {
    /**
     * @param time 最短渲染时间间隔, 单位毫秒
     */
    constructor(public time: number) {}
    #id?: NodeJS.Timer;
    private renderList: CallList = new Set();
    private animationRequestList: CallList = new Set();
    onTick = () => {
        if (!this.renderList.size) {
            if (this.animationRequestList.size) {
                this.setNextRender();
                this.callList("animationRequestList");
            } else this.#id = undefined;
            return;
        } else {
            this.setNextRender();
            this.callList("renderList");
            if (this.animationRequestList.size) this.callList("animationRequestList");
        }
    };
    private setNextRender() {
        this.#id = setTimeout(this.onTick, this.time);
    }
    add(callBack: Callback) {
        if (!this.#id) this.#id = setTimeout(this.onTick);
        this.renderList.add(callBack);
    }
    requestAnimationFrame(callBack: Callback) {
        if (!this.#id) this.#id = setTimeout(this.onTick);
        this.animationRequestList.add(callBack);
    }
    private callList(key: "renderList" | "animationRequestList") {
        let list = this[key];
        this[key] = new Set();
        for (const callBack of list) {
            try {
                callBack();
            } catch (error) {
                console.error(error);
                //todo 异常处理
            }
        }
    }
}

/** 光标控制码
\x1b[nA                 光标上移n行
\x1b[nB                 光标下移n行
\x1b[nC                 光标右移n列
\x1b[nD                 光标左移n列
\x1b[y;H                设置光标位置
\x1b[2J                 清屏
\x1b[K                  清除从光标到行尾的内容
\x1b[s                  保存光标位置
\x1b[u                  恢复光标位置
\x1b[?25l               隐藏光标
\x1b[?25h               显示光标
*/
