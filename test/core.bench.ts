import { describe, bench } from "vitest";
import { AreaBlock, Terminal } from "#rt/core.js";

describe("满屏输出", function () {
    const terminal = new MockTerminal();
    ava(10000, 50000 * 50, 5).forEach((i) => {
        let width = 10000;
        let block = new AreaBlock(terminal, [10000, i / width]);
        block.setContext("中文12abc".repeat(i / 5), true);
        bench("长度:" + i + "的buffer转换", function () {
            block.render();
        });
    });
});
describe("输出空格", function () {
    const terminal = new MockTerminal();
    ava(10000, 50000 * 50, 5).forEach((i) => {
        let width = 10000;
        let block = new AreaBlock(terminal, [10000, i / width]);
        bench("长度:" + i + "空格输出", function () {
            block.render();
        });
    });
});
// describe("深度渲染", function () {
//     const terminal = new MockTerminal();
//     ava(1, 8, 1).forEach((deep) => {
//         terminal.appendChild;
//         ava(30, 90, 6).forEach((coverage) => {});
//     });
// });

class MockTerminal extends Terminal {
    constructor() {
        super({ write() {}, on() {}, cursorTo() {} } as any);
    }
}

function ava(min: number, max: number, count: number) {
    let avc = Math.floor((max - min) / count);
    let list: number[] = [];
    for (let i = min; i <= max; i += avc) {
        list.push(i);
    }
    return list;
}
