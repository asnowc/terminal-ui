import { it, expect, describe } from "vitest";
import { paseCharList, paseCodeList, paseStrList } from "./paser";

let str = "q是;0:".repeat(1024 * 1024);
describe.skip.each([10, 20, 30])("解析合成", function (width) {
    it("一维字符串数组" + width, function () {
        paseCharList(str, width);
        paseCharList(str, width);
        paseCharList(str, width);
        expect(true).toBeTruthy();
    });
    it("二维字符数组" + width, function () {
        paseCodeList(str, width);
        paseCodeList(str, width);
        paseCodeList(str, width);
        expect(true).toBeTruthy();
    });
    it("二维字符编码数组" + width, function () {
        paseStrList(str, width);
        paseStrList(str, width);
        paseStrList(str, width);
        expect(true).toBeTruthy();
    });
});
