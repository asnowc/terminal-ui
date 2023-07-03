import { toEllipsis, scanLineFromStr } from "./util.js";
import { it, describe, expect } from "vitest";

describe("createBlockStr", function () {
    function toExcep(str: string, width: number, height: number): [string, number][] {
        return Array.from(scanLineFromStr(str, width, height)).map(([s, e, len]): [string, number] => {
            return [str.slice(s, e), len];
        });
    }
    describe("单行", function () {
        it.each([
            ["", 5, 5],
            ["abc", 0, 5],
            ["abc", 5, 0],
        ])("命中优化策略:[%s, %i, %i]", function (str, width, height) {
            let arr = toExcep(str, width, height);
            expect(arr).toEqual([]);
        });

        it("不超过宽度", function () {
            let str = "12中文";
            let arr = toExcep(str, 10, 10);
            expect(arr).toEqual([[str, 6]]);
        });

        it("超过一行，限制1行", function () {
            let str = "abcdefg";
            let arr = toExcep(str, 5, 1);
            expect(arr).toEqual([["abcde", 5]]);
        });
    });
    describe("多行", function () {
        it("英文超过", function () {
            let str = "中文中文中a";

            let res = toExcep(str, 10, 10);
            expect(res).toEqual([
                ["中文中文中", 10],
                ["a", 1],
            ]);
        });
        it("中文超1个单位", function () {
            let str = "中文中文a中";
            let res = toExcep(str, 10, 10);
            expect(res).toEqual([
                ["中文中文a", 9],
                ["中", 2],
            ]);
        });
        it("中文超2个单位", function () {
            let str = "中文中文中文";
            let res = toExcep(str, 10, 10);
            expect(res).toEqual([
                ["中文中文中", 10],
                ["文", 2],
            ]);
        });
        it("换行符换行", function () {
            let str = "abc\ndef\nq";
            let res = toExcep(str, 10, 10);
            expect(res).toEqual([
                ["abc", 3],
                ["def", 3],
                ["q", 1],
            ]);
        });

        it("换行符换行2", function () {
            let str = "0:0:0\n1";
            let res = toExcep(str, 10, 10);
            expect(res).toEqual([
                ["0:0:0", 5],
                ["1", 1],
            ]);
        });
        it("超过3行，限制3行", function () {
            let str = "abcdefg56000";
            let arr = toExcep(str, 3, 3);
            expect(arr).toEqual([
                ["abc", 3],
                ["def", 3],
                ["g56", 3],
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
