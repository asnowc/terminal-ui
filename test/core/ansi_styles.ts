import { BgColor, FontColor, Style } from "@asnc/terminal-ui/core.js";

const stdout = process.stdout;

let list = [
    "bold",
    "dim",
    "italic",
    "underline",
    "twinkling",
    "inverse",
    "hidden",
    "strikethrough",
    "overline",
] as const;
function colorEffect() {
    let colors = [
        "black",
        "red",
        "green",
        "yellow",
        "blue",
        "magenta",
        "cyan",
        "white",
        "blackBright",
        "redBright",
        "greenBright",
        "yellowBright",
        "blueBright",
        "magentaBright",
        "cyanBright",
        "whiteBright",
    ] as const;

    function bgColor() {
        console.log("\n背景颜色:");
        for (const type of colors) {
            let str = Style.new({ bgColor: BgColor[type] }).createStr(type);
            stdout.write(str);

            stdout.write(" fin  ");
        }
        stdout.write("\n");
    }
    function color() {
        console.log("\n文本颜色:");
        for (const type of colors) {
            let str = Style.new({ color: FontColor[type] }).createStr(type);
            stdout.write(str);

            stdout.write(" fin  ");
        }
        stdout.write("\n");
    }
    bgColor();
    color();
}
colorEffect();
function multipleEffects() {
    console.log("\n双重文本效果:");
    for (const type of list) {
        if (type === "strikethrough") continue;
        let str = Style.new({ [type]: true, strikethrough: true }).createStr(type);

        stdout.write(str);
        stdout.write("  ");
    }
    stdout.write("\n");
}
multipleEffects();
