import { expect, describe, it, vi } from "vitest";
import { MockView, setViewContent } from "./__test__/mock_view.js";

describe("AreaRender", function () {
    it("宽度检测", function () {
        let view = new MockView([2, 3, 4, 5]);
        expect(view.x).toBe(2);
        expect(view.y).toBe(3);
        expect(view.width).toBe(4);
        expect(view.height).toBe(5);
    });
    describe("设置区域", function () {
        it("指定区域", function () {
            const area = setViewContent();
            expect(area.getString(10)).toBe("a的bc" + " ".repeat(20 - 5));
            for (let i = 11; i <= 20; i++) {
                expect(area.getString(i), "第" + i + "行").toBe(" ".repeat(20));
            }
        });
        it("更新区域", function () {
            const area = setViewContent();
            area.setContext("6");
            area.render();
            expect(area.getString(10)).toBe("6" + " ".repeat(20 - 1));
            expect(area.getString(11)).toBe(" ".repeat(20));
        });
        it("更新区域为空", function () {
            const area = setViewContent();
            area.setContext("");
            area.render();
            expect(area.getString(10)).toBe(" ".repeat(20));
        });
    });
    describe("换行与省略", function () {
        it("英文换行", function () {
            const area = new MockView([10, 10, 5, 5]);
            area.setContext("abcdefg");
            area.render();
            expect(area.getString(10, 10)).toBe("abcde");
            expect(area.getString(11, 10)).toBe("fg   ");
        });
        it("中文换行", function () {
            const area = new MockView([10, 10, 5, 5]);
            area.setContext("中文测试");
            area.render();
            expect(area.getString(10, 10)).toBe("中文 ");
            expect(area.getString(11, 10)).toBe("测试 ");
        });
        it("换行符换行", function () {
            const area = new MockView([10, 10, 5, 5]);
            let lines = [0, 1, 2, 3, 4, 6, 7];
            let str = lines.join("\n");
            area.setContext(str);
            area.render();
            for (let i = 0; i < 5; i++) {
                expect(area.getString(10 + i, 10), "第" + i + "行").toBe(i + " ".repeat(4));
            }
        });
        it("不换行", function () {
            const area = new MockView([10, 10, 5, 3]);
            area.autoWarp = false;
            area.overEllipsis = false;
            area.setContext("abcdefg");
            area.render();
            expect(area.getString(10, 10)).toBe("abcde");

            expect(area.getString(11, 10)).toBe(" ".repeat(5));
            expect(area.getString(11, 10)).toBe(" ".repeat(5));
        });
    });
    describe("省略", function () {
        it("不换行省略", function () {
            const area = new MockView([10, 10, 5, 5]);
            area.autoWarp = false;
            area.overEllipsis = true;

            area.setContext("abcdefg", true);
            area.render();
            expect(area.getString(10, 10)).toBe("abc..");
            expect(area.getString(11, 10)).toBe(" ".repeat(5));
        });
        it("换行省略", function () {
            const area = new MockView([10, 10, 5, 2]);
            area.overEllipsis = true;

            area.setContext("abcd-klsd-11");
            area.render();
            expect(area.getString(10, 10)).toBe("abcd-");
            expect(area.getString(11, 10)).toBe("kls..");
        });
        it("中文省略", function () {
            const area = new MockView([10, 10, 10, 5]);
            area.autoWarp = false;
            area.overEllipsis = true;

            area.setContext("的".repeat(12));
            area.render();
            expect(area.getString(10)).toBe("的的的的..");
        });
    });
    it("asyncRender多次渲染", async function () {
        let view = new MockView([0, 0, 10, 10]);
        view.render = vi.fn();
        view.asyncRender();
        view.asyncRender();
        await view.afterRender();
        expect(view.render).toBeCalledTimes(1);
    });
    it("子节点渲染", function () {
        const view = new MockView([0, 0, 10, 10]);
        const child1 = new MockView([0, 0, 10, 10]);
        const child2 = new MockView([0, 0, 10, 10]);
        view.appendChild(child1);
        view.appendChild(child2);
        child1.render = vi.fn();
        child2.render = vi.fn();

        view.render();
        expect(child1.render).toBeCalled();
        expect(child2.render).toBeCalled();
    });
});
