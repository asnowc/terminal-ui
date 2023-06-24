// import { createBlockStr } from "../../src/core/util.js";
const stdout = process.stdout;
function getCharLen(charCode: number) {
    if (charCode > 127 || charCode == 94) return 2;
    return 1;
}
const width = 30,
    len = 1024 * 1024;

const str = "a".repeat(len);

function 逐行输出(str: string) {
    let y = 0;
    let line = "";
    let len = 0;
    let nextLen = 0;
    for (let i = 0; i < str.length; ) {
        nextLen = len + getCharLen(str.charCodeAt(i));
        if (nextLen <= width) {
            line += str.charAt(0);
            len = nextLen;
            i++;
        } else {
            stdout.cursorTo(0, y++);
            stdout.write(line, "utf-8");
            line = "";
            len = 0;
        }
    }
    if (line !== "") {
        stdout.write(line, "utf-8");
    }
    stdout.write;
}
console.time("逐行输出");
console.time("函数执行时间");
process.on("exit", () => {
    console.timeEnd("逐行输出");
});
// 单个输出(str);
逐行输出(str);

console.timeEnd("函数执行时间");

// console.time("write2");
// const area = createBlockStr(str, width);
// console.timeEnd("write2");
