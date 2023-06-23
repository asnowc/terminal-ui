import { RenderBus, Terminal } from "./terminal.js";
import { it, expect, describe, vi } from "vitest";
import { asyncTime } from "./__test__/mock_view.js";
import { MockTerminal, MockStdout } from "./__test__/mock_terminal.js";
describe("RenderBus", function () {
    function createRender() {
        return new RenderBus(1000 / 30);
    }
    describe.concurrent("渲染队列", function () {
        it("暂停状态添加渲染队列", async function () {
            let render = createRender();
            let callBack = vi.fn();
            render.add(callBack);

            await asyncTime();
            expect(callBack, "下个宏任务立即被调用").toBeCalledTimes(1);

            await asyncTime(render.time * 2);
            expect(callBack, "调用一次后删除").toBeCalledTimes(1);
        });
        it("多次添加只渲染一次", async function () {
            let render = createRender();
            let callBack = vi.fn();
            render.add(callBack);
            render.add(callBack);
            await asyncTime();
            expect(callBack).toBeCalledTimes(1);
        });
        it("连续渲染3次", async function () {
            let render = createRender();
            let callBack = vi.fn();
            render.add(callBack);

            await asyncTime(); //第1次
            render.add(callBack);
            await asyncTime();
            expect(callBack, "保持第一次").toBeCalledTimes(1);

            await asyncTime(render.time); //第二次
            render.add(callBack);
            expect(callBack, "第二次").toBeCalledTimes(2);
            await asyncTime();
            expect(callBack, "保持第二次").toBeCalledTimes(2);

            await asyncTime(render.time); //第3次
            expect(callBack, "第三次").toBeCalledTimes(3);
        });
        it("多个渲染队列", async function () {
            let render = createRender();
            let callback = vi.fn();
            render.add(callback);
            await asyncTime();
            let areaList = [vi.fn(), vi.fn(), vi.fn()];
            for (const callBack of areaList) {
                render.add(callBack);
            }
            await asyncTime(render.time * 3);
            expect(callback).toBeCalledTimes(1);
            for (let i = 0; i < areaList.length; i++) {
                expect(areaList[i], i.toString()).toBeCalledTimes(1);
            }
        });
    });
    describe.concurrent("帧请求", function () {
        it("暂停状态添加帧请求", async function () {
            let render = createRender();
            let cb = vi.fn();
            render.requestAnimationFrame(cb);
            await asyncTime();
            expect(cb, "回调执行").toBeCalledTimes(1);

            await asyncTime(render.time * 2);
            expect(cb, "调用一次后删除").toBeCalledTimes(1);
        });
        it("连续帧请求", async function () {
            let render = createRender();
            const count = 4;
            let i = count;
            let cb = vi.fn(() => {
                if (i-- > 0) render.requestAnimationFrame(cb);
            });
            render.requestAnimationFrame(cb);
            await asyncTime();
            expect(cb, "回调执行").toBeCalledTimes(1);

            for (let i = 1; i < count; i++) {
                await asyncTime(render.time);
                expect(cb).toBeCalledTimes(i + 1);
            }
        });
    });
});
describe("Terminal", function () {
    let terminal = new MockTerminal();
    it("resize事件", function () {
        terminal.asyncRender = vi.fn();
        terminal.mockResizeEvent(50, 50);
        expect(terminal.asyncRender).toBeCalled();
    });
    it("同一个stdout只能声明一次", function () {
        const stdout = new MockStdout() as any as typeof process.stdout;
        new Terminal(stdout);
        expect(() => new Terminal(stdout)).toThrowError();
    });
});
