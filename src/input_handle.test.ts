import { Readable } from "node:stream";
import type { ReadStream } from "node:tty";
import { KeyboardCtrl, CtrlKey, InputCtrl } from "./input_handle.js";
import { expect, it, describe, vi } from "vitest";

class MockStdin extends Readable {
    _read(size: number): void {}
    setRawMode(val: boolean) {}
}
enum KeyInput {
    up = "\x1B[A",
    down = "\x1B[B",
    left = "\x1B[D",
    right = "\x1B[C",
    ins = "\x1B[2~",
    del = "\x1B[3~",
    home = "\x1B[1~",
    end = "\x1B[4~",
    pgUp = "\x1B[5~",
    pgDn = "\x1B[6~",
}
//ctrl x-c-v z-y shift-z
//上下左右, home end ctrl+home ctrl+end
//del back tab
describe("KeyboardCtrl", function () {
    function createStdin() {
        const stream = new MockStdin({ read(size) {} }) as ReadStream;

        const fn = vi.fn();
        const ctrl = new KeyboardCtrl(stream);
        ctrl.watch = true;
        ctrl.on("keyboard", fn);

        function streamNext() {
            return new Promise<void>((resolve) => {
                setTimeout(resolve);
            });
        }
        return [stream, ctrl, fn, streamNext] as const;
    }

    it("英文按键", async function () {
        let [stdin, ctrl, fn, streamNext] = createStdin();
        const inputs = ["a", "c", "z", "A", "Z", "Q"];
        for (const char of inputs) {
            stdin.push(char, "ascii");
        }
        await streamNext();
        let calls = fn.mock.calls;
        for (let i = 0; i < inputs.length; i++) {
            let char = inputs[i];
            expect(calls[i]).toEqual([char, char.charCodeAt(0), undefined]);
        }
    });
    it("中文输入", async function () {
        let [stdin, ctrl, fn, streamNext] = createStdin();
        const inputs = ["你", "好"];
        for (const char of inputs) {
            stdin.push(char, "utf-8");
        }
        await streamNext();
        expect(fn.mock.calls).toHaveLength(0);
    });
    describe("特殊按键", function () {
        it("控制字符", async function () {
            let [stdin, ctrl, fn, streamNext] = createStdin();
            const inputs = ["\b", "\r", "\t"];

            for (const char of inputs) stdin.push(char, "ascii");
            await streamNext();

            let calls = fn.mock.calls;
            for (let i = 0; i < inputs.length; i++) {
                let char = inputs[i];
                expect(calls[i], i.toString()).toEqual([char, char.charCodeAt(0), undefined]);
            }
        });
        it("键盘控制字符", async function () {
            let [stdin, ctrl, fn, streamNext] = createStdin();
            const res = new Map(Object.entries(KeyInput));
            for (const [name, val] of res) stdin.push(val, "ascii");
            await streamNext();

            let calls = fn.mock.calls;
            let i = 0;
            for (const [name, val] of res) {
                let code = CtrlKey[name as any];
                expect(calls[i], name + ":" + val).toEqual(["", code, undefined]);
                i++;
            }
        });

        it("方向键", async function () {
            let [stdin, ctrl, fn, streamNext] = createStdin();
            const inputs = new Map([
                [CtrlKey.up, KeyInput.up],
                [CtrlKey.down, KeyInput.down],
                [CtrlKey.left, KeyInput.left],
                [CtrlKey.right, KeyInput.right],
            ]);
            //上下左右键
            for (const [, char] of inputs) stdin.push(char, "ascii");
            await streamNext();

            let calls = fn.mock.calls;

            let i = 0;
            for (const [mapCode, code] of inputs) {
                let desc = CtrlKey[code as any];
                expect(calls[i++], desc).toEqual(["", mapCode, undefined]);
            }
        });
    });
    describe("ctrl键", function () {
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
        it("ctrl+普通按键", async function () {
            let [stdin, ctrl, fn, streamNext] = createStdin();
            let res = new Map([
                [10, "J"], //ctrl+enter
                [3, "C"], //ctrl+C
                [127, "\b"], //ctrl+back
            ]);
            for (const [code, char] of res) {
                stdin.push(Buffer.from([code]));
            }
            await streamNext();

            let i = 0;
            for (const [, char] of res) {
                expect(fn.mock.calls[i++], char).toEqual([char, char.charCodeAt(0), "ctrl"]);
            }
        });
        it("ctrl+特殊按键", async function () {
            let [stdin, ctrl, fn, streamNext] = createStdin();
            stdin.push("\x1B[6;5~", "ascii");
            await streamNext();
            expect(fn.mock.calls[0]).toEqual(["", CtrlKey.pgDn, "ctrl"]);
        });
    });
    describe("alt键", function () {
        it("alt+普通按键", async function () {
            let [stdin, ctrl, fn, streamNext] = createStdin();
            let inputs = ["a", "\b"];
            for (const char of inputs) {
                stdin.push("\x1B" + char, "ascii");
            }
            await streamNext();

            let i = 0;
            for (let i = 0; i < inputs.length; i++) {
                let char = inputs[i];
                expect(fn.mock.calls[i], char).toEqual([char, char.charCodeAt(0), "alt"]);
            }
        });
        it("alt+控制按键", async function () {
            let [stdin, ctrl, fn, streamNext] = createStdin();

            let res = new Map(Object.entries(KeyInput));
            for (const [name, val] of res) {
                stdin.push("\x1B" + val, "ascii");
            }
            await streamNext();

            let calls = fn.mock.calls;
            let i = 0;
            for (const [name, val] of res) {
                let code = CtrlKey[name as any];
                expect(calls[i], name + ":" + val).toEqual(["", code, "alt"]);
                i++;
            }
        });
    });
});
describe("InputCtrl", function () {
    function createStdin() {
        const stream = new MockStdin({ read(size) {} }) as ReadStream;
        const ctrl = new InputCtrl(stream);
        ctrl.watch = true;

        function streamNext() {
            return new Promise<void>((resolve) => {
                setTimeout(resolve);
            });
        }
        return [stream, ctrl, streamNext] as const;
    }
    describe("输入测试", function () {
        it("输入英文", async function () {
            const [stream, ctrl, streamNext] = createStdin();
            const inputs = ["a", "b", "c", "d"];
            for (const char of inputs) {
                stream.push(char, "utf-8");
            }
            await streamNext();
            expect(ctrl.cursor, "光标指针移动").toBe(inputs.length);
            expect(ctrl.str).toBe(inputs.join(""));
        });
        it("粘贴", async function () {
            const [stream, ctrl, streamNext] = createStdin();
            const inputs = "abcde\n你好";
            stream.push(inputs, "utf-8");
            await streamNext();
            expect(ctrl.cursor, "光标指针移动").toBe(inputs.length);
            expect(ctrl.str).toBe(inputs);
        });
        describe("光标移动", function () {
            it("空字符移动", async function () {
                const [stream, ctrl, streamNext] = createStdin();
                stream.push(KeyInput.left);
                await streamNext();
                expect(ctrl.cursor, "向左移动").toBe(0);
                stream.push(KeyInput.right);
                await streamNext();
                expect(ctrl.cursor, "向右移动").toBe(0);
            });
            it("移动光标输入", async function () {
                const [stream, ctrl, streamNext] = createStdin();

                stream.push("abc", "utf-8");
                stream.push(KeyInput.left);
                await streamNext();
                expect(ctrl.cursor, "光标指针移动").toBe(2);
                stream.push("123");
                await streamNext();
                expect(ctrl.str).toBe("ab123c");
            });
            it("移动光标删除", async function () {
                const [stream, ctrl, streamNext] = createStdin();

                stream.push("abc", "utf-8");
                stream.push(KeyInput.home, "ascii");
                await streamNext();
                expect(ctrl.cursor, "光标指针移动").toBe(0);
                stream.push(KeyInput.del);
                stream.push(KeyInput.del);
                stream.push(KeyInput.del);
                await streamNext();
                expect(ctrl.str).toBe("");
            });
        });
        describe("删除键", function () {
            it("back键删除", async function () {
                const [stream, ctrl, streamNext] = createStdin();

                stream.push("abcdef", "utf-8");
                stream.push("\b", "ascii");
                stream.push("\b", "ascii");
                await streamNext();
                expect(ctrl.cursor, "光标指针移动").toBe(4);
                expect(ctrl.str).toBe("abcd");
            });
            it("del键删除", async function () {
                const [stream, ctrl, streamNext] = createStdin();

                stream.push("abcdef", "utf-8");
                stream.push(KeyInput.left);
                stream.push(KeyInput.left);
                await streamNext();
                expect(ctrl.cursor, "光标指针移动").toBe(4);
                stream.push(KeyInput.del);
                stream.push(KeyInput.del);

                await streamNext();
                expect(ctrl.str).toBe("abcd");
                expect(ctrl.cursor, "光标指针移动").toBe(4);
            });
        });
    });
});
