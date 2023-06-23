import { BgColor, FontColor, FontStyle, FontStyleOption } from "./ansi_styles.js";
let str1 = FontStyle.new({ underline: true }).createStr("abc");
let str2 = FontStyle.new({ overline: true, bold: true }).createStr("abc");
const stdout = process.stdout;

stdout.write("1");
stdout.write(str1);
stdout.write("2");
stdout.write(str2);
