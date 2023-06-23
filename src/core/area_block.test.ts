import { expect, it, describe } from "vitest";
import { MockAreaBlock } from "./__test__/mock_view.js";
describe("AreaBlock", function () {
    function createArea() {
        const areaBlock = new MockAreaBlock({ position: [10, 10], areaSize: [20, 20] });
        areaBlock.setContext("a的bc", true);
        areaBlock.render();
        return areaBlock;
    }
    it("移动区域-不清空", async function () {
        const areaBlock = createArea();
        areaBlock.setArea(40, 40, true);
        await areaBlock.afterRender();
        expect(areaBlock.getString(40), "新区域刷新").toBe("a的bc" + " ".repeat(20 - 5));
        expect(areaBlock.getString(10), "原区域未清空").toBe("a的bc" + " ".repeat(20 - 5));
    });
    it("移动区域-清空", async function () {
        const areaBlock = createArea();
        areaBlock.setArea(40, 40);
        await areaBlock.afterRender();
        expect(areaBlock.getString(40), "新区域刷新").toBe("a的bc" + " ".repeat(20 - 5));
        expect(areaBlock.getString(10), "原区清空").toBe(" ".repeat(20));
    });
});
