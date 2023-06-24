import { paseStrList, paseCharList, paseCodeList } from "./paser.js";
import { it, describe, expect } from "vitest";
function createBlockStr(str: string, width: number): { lines: string[]; lengths: number[] } {
    // return paseStrList(str, width);
    //
    // let res = paseCharList(str, width);
    // return { lines: res.lines.map((item) => item.join("")), lengths: res.lengths };
    //
    const { lengths, lines } = paseCodeList(str, width);
    return { lines: lines.map((val) => String.fromCharCode(...val)), lengths };
}
describe("createBlockStr", function () {
    it("不超过宽度", function () {
        let str = "12中文";
        let { lines, lengths } = createBlockStr(str, 10);
        expect(lines).toEqual([str]);
        expect(lengths).toEqual([6]);
    });
    it("英文超过", function () {
        let str = "中文中文中a";
        let { lines, lengths } = createBlockStr(str, 10);

        expect(lines).toEqual(["中文中文中", "a"]);
        expect(lengths).toEqual([10, 1]);
    });
    it("中文超1个单位", function () {
        let str = "中文中文a中";
        let { lines, lengths } = createBlockStr(str, 10);

        expect(lines).toEqual(["中文中文a", "中"]);
        expect(lengths).toEqual([9, 2]);
    });
    it("中文超2个单位", function () {
        let str = "中文中文中文";
        let { lines, lengths } = createBlockStr(str, 10);

        expect(lines).toEqual(["中文中文中", "文"]);
        expect(lengths).toEqual([10, 2]);
    });
    it("换行符换行", function () {
        let str = "abc\ndef\nq";
        let { lines, lengths } = createBlockStr(str, 10);
        expect(lines).toEqual(["abc", "def", "q"]);
        expect(lengths).toEqual([3, 3, 1]);
    });

    it("换行符换行2", function () {
        let str = "0:0:0\n1";
        let { lines, lengths } = createBlockStr(str, 20);

        expect(lines).toEqual(["0:0:0", "1"]);
        expect(lengths).toEqual([5, 1]);
    });
});
