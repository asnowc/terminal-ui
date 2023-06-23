import { Area, BoxArea, RenderBus } from "@asnc/terminal-ui/area_render.js";
import { InputCtrl } from "@asnc/terminal-ui/input_handle.js";

const stdout = process.stdout;
function createArea(area?: BoxArea) {
    return new Area(stdout, area);
}
const showArea = createArea([0, 0, 40, 5]); //内容展示
const timerArea = createArea([42, 0, 20, 5]); //计时器
const inputArea = createArea([0, 6, 40, 5]); //输入框
let n1 = 0;

const inputCtrl = new InputCtrl(process.stdin);
inputCtrl.watch = true;
inputCtrl.on("keyboard", function (this: InputCtrl, char, code, aux) {
    if (code === 13) this.emit("input");
});
inputCtrl.on("change", function (this: InputCtrl) {
    inputArea.render(this.str);
    let str = `${++n1}:${this.cursor}:${this.str.length}`;
    timerArea.render(str);
});
inputCtrl.on("input", function (this: InputCtrl) {
    showArea.render(this.str);
    this.str = "";
    inputArea.render("");
});

timerArea.render("n1: " + n1++);
