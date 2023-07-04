import type { Terminal } from "./terminal.js";
import { toEllipsis, scanLineFromStr } from "./util.js";
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

export abstract class View extends Node {
    #context: string = "";
    readonly style = new Style();
    *scanLine(width: number, height: number) {
        const node = this;
        let y = 0;
        const encoding = "utf-8";

        const maxLine = node.#autoWarp ? height : 1;
        for (let [start, end, len] of scanLineFromStr(node.#context, width, maxLine)) {
            let line = node.#context.slice(start, end);
            if (y + 1 === maxLine && node.#overEllipsis) {
                let res = toEllipsis(line, width - len);
                line = res[0];
                len += res[1];
            }
            if (len < width) line = line + " ".repeat(width - len);
            yield Buffer.from(line, encoding);
            y++;
        }
        let buf = Buffer.alloc(width, " ");
        for (; y < height; y++) {
            yield buf;
        }
    }

    //todo: 性能优化
    render(renderInfo: RenderInfo = {}) {
        const node = this;
        if (!this.root) return;
        let stdout = this.root.stdout;

        const styleCode = node.style.createCode();
        let useStyle = styleCode[0].length;
        if (useStyle) stdout.write(styleCode[0]);

        let [x, y] = node.viewArea;
        for (const line of this.scanLine(this.width, this.height)) {
            stdout.cursorTo(x, y++);
            stdout.write(line);
        }
        if (useStyle) stdout.write(styleCode[1]);
        if (node.childCount > 0) node.renderChild(renderInfo);
    }
    #asyncRendering = false;
    asyncRender() {
        if (this.#asyncRendering) return;
        let bus = this.root?.renderBus;
        if (bus) {
            this.#asyncRendering = true;
            bus.add(() => {
                this.#asyncRendering = false;
                this.render();
            });
        }
    }
    protected renderChild(renderInfo: RenderInfo = {}) {
        for (const node of this) {
            //todo 渲染信息处理
            node.render(renderInfo);
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
        if (str === this.#context) notRendering = true;
        this.#context = str;
        if (notRendering) return;

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
        if (this.#context.length <= 1) return;

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

        this.asyncRender();
    }
    #overEllipsis = false;
    #autoWarp = true;
    protected abstract readonly viewArea: Readonly<Area>;
    protected abstract readonly root?: Terminal;
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
