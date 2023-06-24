import type { Terminal } from "./terminal.js";
import { toEllipsis, createBlockStr } from "./util.js";
import { Style } from "./ansi_styles.js";

abstract class Node {
    #children: Node[] = [];
    get children() {
        return this.#children.slice(0);
    }
    get childCount() {
        return this.#children.length;
    }
    readonly parent?: Node;
    getChildAt(index: number): Node | undefined {
        return this.#children[index];
    }
    appendChild(child: Node) {
        if (child.parent) throw new Error("The parent node already exists");
        (child as any).parent = this;

        this.#children.push(child);
    }
    removeChild(child: Node) {
        let newList = [];
        for (const area of this.#children) {
            if (area !== child) newList.push(area);
        }
        this.#children = newList;
    }
    *[Symbol.iterator]() {
        yield* this.#children;
    }
}

export interface RenderInfo {
    position?: [x: number, y: number];
}
export interface StringLine {
    str: string;
    len: number;
}

export abstract class View extends Node {
    protected abstract root?: Terminal;
    private context: StringLine[] = [];
    readonly style = new Style();
    protected *getRenderLine() {
        let windowMaxX = this.root?.width ?? Infinity;
        let windowMaxY = this.root?.height ?? Infinity;
        let y = 0;
        let maxY: number;
        if (this.viewArea[3] > windowMaxY) maxY = windowMaxY - this.y;
        else maxY = this.viewArea[3] - this.y;

        let width = this.width;
        if (this.viewArea[2] > windowMaxX) {
            //todo: 超过窗口范围
        }

        const content = this.context;
        if (this.#autoWarp) {
            let max = maxY < content.length ? maxY - 1 : content.length - 1;
            while (y < max) {
                let { str, len } = content[y];
                yield str + " ".repeat(width - len);

                y++;
            }
        }
        if (y < content.length) {
            let lastLine = content[y];
            if (this.#overEllipsis) {
                let [str, dx] = toEllipsis(lastLine.str, width - lastLine.len);
                lastLine.str = str;
                lastLine.len += dx;
            }
            yield lastLine.str + " ".repeat(width - lastLine.len);
            y++;
        }

        //清空剩余区域
        let nullStr = " ".repeat(width);
        for (; y < maxY; y++) {
            yield nullStr;
        }
    }
    render(ignoreChild?: boolean, renderInfo: RenderInfo = {}) {
        let stdout = (this as any).root.stdout;

        let [x, y] = this.viewArea;
        const encoding = "utf-8";
        const styleCode = this.style.createCode();
        let useStyle = styleCode[0].length;
        if (useStyle) stdout.write(styleCode[0]);

        for (const str of this.getRenderLine()) {
            stdout.cursorTo(x, y);
            stdout.write(str, encoding);

            y++;
        }
        if (useStyle) stdout.write(styleCode[1]);
        if (!ignoreChild && this.childCount > 0) this.renderChild(renderInfo);
    }
    #asyncRendering = false;
    asyncRender(ignoreChild?: boolean) {
        if (this.#asyncRendering) return;
        let bus = this.root?.renderBus;
        if (bus) {
            this.#asyncRendering = true;
            bus.add(() => {
                this.#asyncRendering = false;
                this.render(ignoreChild);
            });
        }
    }
    protected renderChild(renderInfo: RenderInfo = {}) {
        for (const node of this) {
            //todo 渲染信息处理
            node.render(false, renderInfo);
        }
    }
    protected clearArea(area = this.viewArea) {
        let stdout = this.root?.stdout;
        if (!stdout) return;
        let [x, y, maxX, maxY] = area;
        let width = maxX - x;
        for (; y < maxY; y++) {
            stdout.cursorTo(x, y);
            stdout.write(" ".repeat(width));
        }
    }
    setContext(str: string, notRendering?: boolean) {
        let res = createBlockStr(str, this.width);
        if (notRendering) {
            this.context = res;
            return;
        }
        let oldContent = this.context;
        let maxCompare = 10;
        if (res.length === oldContent.length && res.length < maxCompare) {
            let isEqual = true;
            for (let i = 0; i < res.length; i++) {
                if (res[i].str !== this.context[i].str) {
                    isEqual = false;
                    break;
                }
            }
            if (isEqual) {
                this.context = res;
                return;
            }
        }
        this.context = res;
        return this.asyncRender();
    }

    get width() {
        return this.viewArea[2] - this.viewArea[0];
    }
    get height() {
        return this.viewArea[3] - this.viewArea[1];
    }
    get x() {
        return this.viewArea[0];
    }
    get y() {
        return this.viewArea[1];
    }
    /** 自动换行 */
    get autoWarp() {
        return this.#autoWarp;
    }
    set autoWarp(val: boolean) {
        val = Boolean(val);
        if (val === this.#autoWarp) return;
        this.#autoWarp = val;
        if (this.context.length <= 1) return;

        this.asyncRender();
    }
    /** 超过显示省略号 */
    get overEllipsis() {
        return this.#overEllipsis;
    }
    set overEllipsis(val: boolean) {
        val = Boolean(val);
        if (val === this.#overEllipsis) return;
        this.#overEllipsis = val;

        this.asyncRender(val);
    }
    #overEllipsis = false;
    #autoWarp = true;
    protected abstract readonly viewArea: Readonly<Area>;
}

export interface View {
    get children(): View[];

    readonly parent?: View | undefined;
    appendChild: (child: View) => void;
    removeChild: (child: View) => void;
    getChildAt: (index: number) => View | undefined;
    [Symbol.iterator]: () => Generator<View, void, undefined>;
}

export type Area = [x: number, y: number, maxX: number, maxY: number];

/* 
true false  直接截断
false true  第一行省略
true true   最后一行省略    由render函数检测
false false 第一行截断      
*/
