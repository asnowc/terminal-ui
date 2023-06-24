import { RenderInfo } from "#root/core/view.js";
import { Terminal, AreaBlock, BgColor, FontColor } from "@asnc/terminal-ui/core.js";
import { InputCtrl } from "@asnc/terminal-ui/input_handle.js";

const terminal = Terminal.createDefault();
let ctrl = new InputCtrl();

class TitleArea extends AreaBlock {
    i = 0;
    constructor(title?: string) {
        super(terminal, [50, 1]);
        if (title) this.title = title;
        ctrl.on("keyboard", (str, code, auxiliaryKey) => {
            if (str.toUpperCase() === "Q") this.onExit();
        });
    }
    set title(val: string) {
        this.setContext(val);
    }
    render(ignoreChild?: boolean | undefined, renderInfo?: RenderInfo): void {
        let i = this.i++;
        this.setContext(i.toString(), true);

        super.render();
    }
    private onExit() {
        ctrl.watch = false;
        terminal.cursorTo(0, 0);
        terminal.clearArea();
        console.log("退出");
    }
}
const titleArea = new TitleArea("按q键退出");

const block1 = new AreaBlock(terminal, [5, 2, 50, 4]);
const block2 = new AreaBlock(terminal, [55, 2, 50, 4]);
terminal.appendChild(titleArea);
terminal.appendChild(block1);
terminal.appendChild(block2);
block1.style.bgColor = BgColor.blue;
block1.style.bold = true;

block2.style.color = FontColor.greenBright;
block2.style.dim = true;

block1.setContext("区块1");

block2.setContext("区块2");
