import { terminal } from "@asnc/terminal-ui/core.js";
terminal.showCursor(false);
function createTimeout(timeout: number) {
    return new Promise(function (resolve) {
        setTimeout(resolve, timeout);
    });
}
const stdout = process.stdout;

async function saveCursor() {
    stdout.write("abc");
    terminal.moveCursorY(2);
    stdout.write("向下移动两行");
    terminal.saveCursor();
    await createTimeout(1000);
    stdout.cursorTo(0, 0);
    stdout.write("aaaaaa");
    await createTimeout(1000);
    terminal.resetCursor();
    stdout.write("bbb");
    await createTimeout(5000);
}
async function main() {
    await saveCursor();
}
main();
