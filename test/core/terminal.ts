import { Terminal } from "@asnc/terminal-ui/core.js";
function createTimeout(timeout: number) {
    return new Promise(function (resolve) {
        setTimeout(resolve, timeout);
    });
}
const shellCtrl = Terminal.createDefault()
const stdout = process.stdout;
const move = async () => {
    stdout.write("abc");
    shellCtrl.moveCursorY(2);
    stdout.write("向下移动两行");
    await createTimeout(1000);
    shellCtrl.moveCursorY(-1);
    stdout.write("向上移动一行");
    await createTimeout(1000);

    shellCtrl.moveCursorX(10);
    stdout.write("向右移动10列");
    await createTimeout(1000);

    shellCtrl.moveCursorX(-10);
    stdout.write("向左移动10列");
    await createTimeout(5000);
};
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
saveCursor();
