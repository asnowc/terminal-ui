import { AreaBlock, terminal } from "@asnc/terminal-ui/core.js";
import { InputCtrl } from "@asnc/terminal-ui/input_handle.js";
terminal.showCursor(false);
function createArea(areaSize: ConstructorParameters<typeof AreaBlock>[1]) {
    return new AreaBlock(terminal, areaSize);
}

const inputCtrl = new InputCtrl(process.stdin);
class TimerArea extends AreaBlock {
    n1 = 0;
    time = 0;
    #id?: NodeJS.Timer;
    constructor() {
        super(terminal, [42, 0, 20, 5]);
        this.#id = setInterval(() => {
            this.time++;
            if (this.time > 10) {
                inputCtrl.watch = false;
                clearInterval(this.#id);
                console.log("退出");
            } else this.update();
        }, 1000);
    }
    cus: number = 0;
    len: number = 0;
    update(): void;
    update(cus: number, len: number): void;
    update(cus?: number, len?: number) {
        if (cus && len) {
            this.cus = cus;
            this.len = len;
        }
        let str = `${this.n1}:${this.cus}:${this.len}\n${this.time}`;
        timerArea.setContext(str);
    }
}

const showArea = createArea([0, 0, 40, 5]); //内容展示
const inputArea = createArea([0, 6, 40, 5]); //输入框
const timerArea = new TimerArea(); //计时器

inputCtrl.watch = true;
inputCtrl.on("keyboard", function (this: InputCtrl, char, code, aux) {
    if (code === 13) this.emit("input");
});
inputCtrl.on("change", function (this: InputCtrl) {
    inputArea.setContext(this.str);
    timerArea.n1++;
    timerArea.update(this.cursor, this.str.length);
});
inputCtrl.on("input", function (this: InputCtrl) {
    showArea.setContext(this.str);
    this.str = "";
    inputArea.setContext("");
});
