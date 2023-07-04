import { Terminal } from "@asnc/terminal-ui/core.js";
function createTimeout(timeout: number) {
    return new Promise(function (resolve) {
        setTimeout(resolve, timeout);
    });
}
const shellCtrl = Terminal.createDefault();
const stdout = process.stdout;

async function saveCursor() {
    stdout.write("abc");
    shellCtrl.moveCursorY(2);
    stdout.write("向下移动两行");
    shellCtrl.saveCursor();
    await createTimeout(1000);
    stdout.cursorTo(0, 0);
    stdout.write("aaaaaa");
    await createTimeout(1000);
    shellCtrl.resetCursor();
    stdout.write("bbb");
    await createTimeout(5000);
}
async function main() {
    await saveCursor();
}
main();
