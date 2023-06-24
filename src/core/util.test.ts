import { createBlockStr, toEllipsis } from "./util.js";
import { it, describe, expect } from "vitest";

describe("createBlockStr", function () {
    describe("单行", function () {
        it("空字符串,命中优化策略", function () {
            expect(createBlockStr("", 10)).toEqual([]);
        });
        it("不超过宽度", function () {
            let str = "12中文";
            let res = createBlockStr(str, 10);
            expect(res, "应该").toEqual([{ str, len: 6 }]);
        });
    });
    describe("多行", function () {
        it("英文超过", function () {
            let str = "中文中文中a";
            let res = createBlockStr(str, 10);
            expect(res).toEqual([
                { str: "中文中文中", len: 10 },
                { str: "a", len: 1 },
            ]);
        });
        it("中文超1个单位", function () {
            let str = "中文中文a中";
            let res = createBlockStr(str, 10);
            expect(res).toEqual([
                { str: "中文中文a", len: 9 },
                { str: "中", len: 2 },
            ]);
        });
        it("中文超2个单位", function () {
            let str = "中文中文中文";
            let res = createBlockStr(str, 10);
            expect(res).toEqual([
                { str: "中文中文中", len: 10 },
                { str: "文", len: 2 },
            ]);
        });
        it("换行符换行", function () {
            let str = "abc\ndef\nq";
            let res = createBlockStr(str, 10);
            expect(res).toEqual([
                { str: "abc", len: 3 },
                { str: "def", len: 3 },
                { str: "q", len: 1 },
            ]);
        });

        it("换行符换行2", function () {
            let str = "0:0:0\n1";
            let res = createBlockStr(str, 20);
            expect(res).toEqual([
                { str: "0:0:0", len: 5 },
                { str: "1", len: 1 },
            ]);
        });
    });
});
describe("toEllipsis", function () {
    describe("没有剩余", function () {
        it("删除2个英文", function () {
            expect(toEllipsis("abcd", 0)).toEqual(["ab..", 0]);
        });
        it("删除1个中文", function () {
            expect(toEllipsis("abc文", 0)).toEqual(["abc..", 0]);
        });
    });
    it("剩余1个单位,删除1个单位", function () {
        expect(toEllipsis("abcd", 1)).toEqual(["abc..", 1]);
    });
    it("剩余1个单位,删除2个单位", function () {
        expect(toEllipsis("abc文", 1)).toEqual(["abc..", 0]);
    });
    it("剩余2个单位", function () {
        expect(toEllipsis("abcd", 2)).toEqual(["abcd..", 2]);
    });
});
