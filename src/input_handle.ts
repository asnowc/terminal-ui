import type { ReadStream } from "node:tty";
import { EventEmitter } from "node:events";

/**
 * ctrl+c 和 双击ctrl 输入一致: 0x3
 * ctrl+h == back(\b)
 * ctrl+i == tab(\t)
 * ctrl+m == enter(\r)
 *
 * \b:8 \t:9 \n:10 \f:12 \r:13
 */

/** ctrl+
 * a~z: 1~26
 * [: 27
 * |: 28
 * ]: 29
 * enter: 10   == j
 * back: 127
 *
 * 可见字符: 48 开始
 */

export enum CtrlKey {
    up = -1,
    down = -2,
    left = -3,
    right = -4,
    ins = 5,
    del = -6,
    home = -7,
    end = -8,
    pgUp = -9,
    pgDn = -10,
    back = 8,
    tab = 9,
    enter = 13,
}
const keyCoding = {
    tab: 9,
    back: 8,
    enter: 13,
    ctrlKeys: {
        "\x1B[A": CtrlKey.up,
        "\x1B[B": CtrlKey.down,
        "\x1B[D": CtrlKey.left,
        "\x1B[C": CtrlKey.right,
        "\x1B[2~": CtrlKey.ins,
        "\x1B[3~": CtrlKey.del,
        "\x1B[1~": CtrlKey.home,
        "\x1B[4~": CtrlKey.end,
        "\x1B[5~": CtrlKey.pgUp,
        "\x1B[6~": CtrlKey.pgDn,
    } as Record<string, number>,
};
const keyCodingWithCtrl: Record<string, CtrlKey> = {
    "\x1B[2;5~": CtrlKey.ins,
    "\x1B[3;5~": CtrlKey.del,
    "\x1B[1;5~": CtrlKey.home,
    "\x1B[4;5~": CtrlKey.end,
    "\x1B[5;5~": CtrlKey.pgUp,
    "\x1B[6;5~": CtrlKey.pgDn,
    "\x1B[1;5A": CtrlKey.up,
    "\x1B[1;5B": CtrlKey.down,
    "\x1B[1;5D": CtrlKey.left,
    "\x1B[1;5C": CtrlKey.right,
};

Object.freeze(keyCoding);
Object.freeze(keyCoding.ctrlKeys);

export interface KeyboardCtrl {
    on(event: "keyboard", listener: (str: string, code?: number, auxiliaryKey?: "ctrl" | "alt") => any): this;
    on(event: string, listener: (this: this, ...args: any[]) => any): this;
}

/**
 * @event keyboard
 */
export class KeyboardCtrl extends EventEmitter {
    private static instanceList = new WeakSet<ReadStream>();
    constructor(protected stdin: ReadStream = process.stdin) {
        if (KeyboardCtrl.instanceList.has(stdin))
            throw new Error("stdin has been instantiated by another Terminal instance");
        else KeyboardCtrl.instanceList.add(stdin);
        super();
        this.watch = true;
    }
    #watch?: (data: Buffer) => void;
    set watch(val: boolean) {
        val = Boolean(val);
        if (val === this.watch) return;

        if (val) {
            this.#watch = this.onInput.bind(this);
            this.stdin.setRawMode(true);
            this.stdin.on("data", this.#watch);
        } else {
            this.stdin.off("data", this.#watch!);
            this.#watch = undefined;
            this.stdin.pause();
        }
    }
    get watch() {
        return this.#watch !== undefined;
    }

    /**
     * @returns [char, charCode, 控制按键是否按下]
     */
    protected paseBuffer(data: Buffer): [string, number | undefined, undefined | "ctrl" | "alt"] {
        let code: number | undefined;
        let str: string = "";
        let auxiliaryKey: undefined | "ctrl" | "alt";
        if (data.length === 1) {
            code = data[0];
            switch (code) {
                case 1:
                    code = CtrlKey.enter;
                    str = "\r";
                    auxiliaryKey = "ctrl";
                    break;
                case 127:
                    code = CtrlKey.back;
                    str = "\b";
                    auxiliaryKey = "ctrl";
                default:
                    if (code < 30) {
                        if (code !== 8 && code !== 9 && code !== 13) {
                            code += 64;
                            auxiliaryKey = "ctrl";
                        }
                    }
                    str = String.fromCharCode(code);
                    break;
            }
        } else if (data[0] === 27) {
            if (data[1] === 91) {
                //方向键或9格控制键
                //ctrl + 方向键或9格控制键
                str = data.toString("utf-8");

                if (data.length <= 4) code = keyCoding.ctrlKeys[str];
                else if (data.length === 6) {
                    code = keyCodingWithCtrl[str];
                    auxiliaryKey = "ctrl";
                }
                if (code !== undefined) str = "";
            } else {
                //alt+其他键

                if (data.length === 2) {
                    code = data[1];
                    str = String.fromCharCode(code);
                    auxiliaryKey = "alt";
                } else if (data.length <= 5) {
                    str = data.subarray(1).toString("utf-8");
                    code = keyCoding.ctrlKeys[str];
                    if (code !== undefined) {
                        auxiliaryKey = "alt";
                        str = "";
                    }
                }
            }
        } else str = data.toString("utf-8");

        return [str, code, auxiliaryKey];
    }
    protected readonly listens: Set<number> = new Set();
    protected onInput(data: Buffer) {
        let codeInfo = this.paseBuffer(data);
        if (codeInfo[1] !== undefined) this.emit("keyboard", ...codeInfo);
    }
}

export interface InputCtrl {
    on(event: "change", listener: () => void): any;
    on(event: "keyboard", listener: (str: string, code?: number, auxiliaryKey?: "ctrl" | "alt") => any): this;
    on(event: string, listener: (this: this, ...args: any[]) => any): this;
}

/**
 * @event change
 */
export class InputCtrl extends KeyboardCtrl {
    get str() {
        return this.#str;
    }
    set str(val: string) {
        if (this.#cursor > val.length) this.#cursor = val.length;
        this.#str = val;
    }

    get cursor() {
        return this.#cursor;
    }
    set cursor(i: number) {
        if (i < 0) i = 0;
        else if (i > this.#str.length) i = this.#str.length;
        this.#cursor = i;
    }
    #str = "";
    #cursor = 0;
    private paseInputStr(str: string, code?: number, auxiliaryKey?: "ctrl" | "alt") {
        let cursor = this.#cursor;
        if (code === CtrlKey.left) {
            if (cursor > 0) this.#cursor--;
        } else if (code === CtrlKey.right) {
            if (cursor < this.#str.length) this.#cursor++;
        } else if (code === CtrlKey.back) {
            if (this.#cursor > 0) {
                this.#str = this.#str.slice(0, this.#cursor - 1) + this.#str.slice(this.#cursor);
                this.#cursor--;
            }
        } else if (code == CtrlKey.del) {
            if (cursor < this.#str.length) {
                if (cursor === 0) this.#str = this.#str.slice(1);
                else if (cursor === this.#str.length) return;
                else this.#str = this.#str.slice(0, cursor) + this.#str.slice(cursor + 1);
            }
        } else if (code === CtrlKey.home) {
            this.#cursor = 0;
        } else if (code === CtrlKey.end) {
            this.#cursor = this.#str.length;
        } else if (str) {
            if (this.#cursor === this.#str.length) this.#str += str;
            else this.#str = this.#str.slice(0, this.#cursor) + str + this.#str.slice(this.#cursor);
            this.#cursor += str.length;
        }
    } /** @overload */
    protected onInput(data: Buffer) {
        let codeInfo = this.paseBuffer(data);
        if (codeInfo[1] !== undefined) this.emit("keyboard", ...codeInfo);
        this.paseInputStr(...codeInfo);
        this.emit("change");
    }
}
