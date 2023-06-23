type StyleProp = [string, string];

/** 
 
\x1b[0m                 关闭所有属性

\x1b[1m                 设置高亮度
\x1b[2m                 半高亮，效果不明显
\x1b[4m                 下划线
\x1b[5m                 闪烁
\x1b[7m                 反显
\x1b[8m                 消隐
\x1b[9m                 删除线
\x1B[53m                overline

\x1b[30m -- \x1b[37m    设置前景色
\x1b[40m -- \x1b[47m    设置背景色

 */

const baseKey = new Map<string, { open: string; close: string }>([
    ["bold", { open: "\x1B[1m", close: "\x1B[22m" }],
    ["dim", { open: "\x1B[2m", close: "\x1B[22m" }],
    ["italic", { open: "\x1B[3m", close: "\x1B[23m" }],
    ["underline", { open: "\x1B[4m", close: "\x1B[24m" }],
    ["twinkling", { open: "\x1b[5m", close: "\x1B[25m]" }],
    ["inverse", { open: "\x1B[7m", close: "\x1B[27m" }],
    ["hidden", { open: "\x1B[8m", close: "\x1B[28m" }],
    ["strikethrough", { open: "\x1B[9m", close: "\x1B[29m" }],
    ["overline", { open: "\x1B[53m", close: "\x1B[55m" }],
]);
export interface FontStyleOption {
    color?: FontColor;
    bgColor?: BgColor;

    /** 加粗 */
    bold?: boolean;
    /** Emitting only a small amount of light. */
    dim?: boolean;
    /** 斜体 (Not widely supported) */
    italic?: boolean;
    /** 下划线 (Not widely supported) */
    underline?: boolean;
    /** 闪烁 */
    twinkling?: boolean;
    /** Inverse background and foreground colors. */
    inverse?: boolean;
    /** 字体透明 */
    hidden?: boolean;
    /**删除线 (Not widely supported) */
    strikethrough?: boolean;
    /** Make text overline. Supported on VTE-based terminals, the GNOME terminal, mintty, and Git Bash. */
    overline?: boolean;
}
export interface FontStyle extends FontStyleOption {}
export class FontStyle {
    static restCode = "\x1B[0m";
    static createCode(style: FontStyleOption): [string, string] {
        let open = "";
        let close = "";
        for (const [key, val] of Object.entries(style)) {
            let tpVal = baseKey.get(key);
            if (tpVal) {
                if (val) {
                    open += tpVal.open;
                    close = tpVal.close + close;
                }
            } else {
                open += val.open;
                close = val.close + close;
            }
        }
        return [open, close];
    }
    static new(style: FontStyleOption = {}) {
        let obj = new this();
        for (const [key, val] of Object.entries(style)) {
            if (baseKey.has(key)) (obj as any)[key] = val;
            else if (key === "color" || key === "bgColor") {
                if (val instanceof Color) (obj as any)[key] = val;
            }
        }
        return obj;
    }
    createCode(): StyleProp {
        return FontStyle.createCode(this);
    }
    createStr(str: string, reset?: boolean) {
        const [open, close] = this.createCode();
        if (reset) return open + str + FontStyle.restCode;

        return open + str + close;
    }
}

const ANSI_BACKGROUND_OFFSET = 10;
abstract class Color {
    static readonly level: string;
    static hex(hex: string) {
        return this.rgb(...this.hexToRgb(hex));
    }
    static rgb(r: number, g: number, b: number) {
        if (this.level === "ansi16m") return this.ansi16m(r, g, b);
        if (this.level === "ansi256") return this.ansi256(this.rgbToAnsi256(r, g, b));
        return this.ansi(this.rgbToAnsi(r, g, b));
    }

    static ansi = wrapAnsi16();
    static ansi256 = wrapAnsi256();
    static ansi16m = wrapAnsi16m();

    protected constructor(readonly open: string) {}
    abstract readonly close: string;

    /**
     * @description Convert from the RGB color space to the ANSI 256 color space.
     * @param red - (`0...255`)
     * @param green - (`0...255`)
     * @param blue - (`0...255`)
     */
    static rgbToAnsi256(red: number, green: number, blue: number) {
        // We use the extended greyscale palette here, with the exception of
        // black and white. normal palette only has 4 greyscale shades.
        if (red === green && green === blue) {
            if (red < 8) {
                return 16;
            }

            if (red > 248) {
                return 231;
            }

            return Math.round(((red - 8) / 247) * 24) + 232;
        }

        return 16 + 36 * Math.round((red / 255) * 5) + 6 * Math.round((green / 255) * 5) + Math.round((blue / 255) * 5);
    }
    /** Convert from the RGB HEX color space to the RGB color space. */
    static hexToRgb(hex: string): [red: number, green: number, blue: number] {
        const matches = /[a-f\d]{6}|[a-f\d]{3}/i.exec(hex);
        if (!matches) {
            return [0, 0, 0];
        }

        let [colorString] = matches;

        if (colorString.length === 3) {
            colorString = [...colorString].map((character) => character + character).join("");
        }

        const integer = Number.parseInt(colorString, 16);

        return [
            /* eslint-disable no-bitwise */
            (integer >> 16) & 0xff,
            (integer >> 8) & 0xff,
            integer & 0xff,
            /* eslint-enable no-bitwise */
        ];
    }
    /** Convert from the RGB HEX color space to the ANSI 256 color space. */
    static hexToAnsi256(hex: string): number {
        return this.rgbToAnsi256(...this.hexToRgb(hex));
    }
    /** Convert from the ANSI 256 color space to the ANSI 16 color space.
  		@param code - A number representing the ANSI 256 color.
	*/
    static ansi256ToAnsi(code: number) {
        if (code < 8) {
            return 30 + code;
        }

        if (code < 16) {
            return 90 + (code - 8);
        }

        let red;
        let green;
        let blue;

        if (code >= 232) {
            red = ((code - 232) * 10 + 8) / 255;
            green = red;
            blue = red;
        } else {
            code -= 16;

            const remainder = code % 36;

            red = Math.floor(code / 36) / 5;
            green = Math.floor(remainder / 6) / 5;
            blue = (remainder % 6) / 5;
        }

        const value = Math.max(red, green, blue) * 2;

        if (value === 0) {
            return 30;
        }

        // eslint-disable-next-line no-bitwise
        let result = 30 + ((Math.round(blue) << 2) | (Math.round(green) << 1) | Math.round(red));

        if (value === 2) {
            result += 60;
        }

        return result;
    }
    /** Convert from the RGB color space to the ANSI 16 color space. */
    static rgbToAnsi(red: number, green: number, blue: number): number {
        return this.ansi256ToAnsi(this.rgbToAnsi256(red, green, blue));
    }
    /** Convert from the RGB HEX color space to the ANSI 16 color space. */
    static hexToAnsi(hex: string): number {
        return this.ansi256ToAnsi(this.hexToAnsi256(hex));
    }
}

export class FontColor extends Color {
    readonly close = "\x1B[39m";

    static black = new this("\x1B[30m");
    static red = new this("\x1B[31m");
    static green = new this("\x1B[32m");
    static yellow = new this("\x1B[33m");
    static blue = new this("\x1B[34m");
    static magenta = new this("\x1B[35m");
    static cyan = new this("\x1B[36m");
    static white = new this("\x1B[37m");
    static blackBright = new this("\x1B[90m");
    static redBright = new this("\x1B[91m");
    static greenBright = new this("\x1B[92m");
    static yellowBright = new this("\x1B[93m");
    static blueBright = new this("\x1B[94m");
    static magentaBright = new this("\x1B[95m");
    static cyanBright = new this("\x1B[96m");
    static whiteBright = new this("\x1B[97m");
}
export class BgColor extends Color {
    readonly close = "\x1B[49m";
    static ansi = wrapAnsi16(ANSI_BACKGROUND_OFFSET);
    static ansi256 = wrapAnsi256(ANSI_BACKGROUND_OFFSET);
    static ansi16m = wrapAnsi16m(ANSI_BACKGROUND_OFFSET);

    static bgBlack = new this("\x1B[40m");
    static bgRed = new this("\x1B[41m");
    static bgGreen = new this("\x1B[42m");
    static bgYellow = new this("\x1B[43m");
    static bgBlue = new this("\x1B[44m");
    static bgMagenta = new this("\x1B[45m");
    static bgCyan = new this("\x1B[46m");
    static bgWhite = new this("\x1B[47m");
    static bgBlackBright = new this("\x1B[100m");
    static bgRedBright = new this("\x1B[101m");
    static bgGreenBright = new this("\x1B[102m");
    static bgYellowBright = new this("\x1B[103m");
    static bgBlueBright = new this("\x1B[104m");
    static bgMagentaBright = new this("\x1B[105m");
    static bgCyanBright = new this("\x1B[106m");
    static bgWhiteBright = new this("\x1B[107m");
}

function wrapAnsi16(offset = 0) {
    return (code: number) => `\u001B[${code + offset}m`;
}
function wrapAnsi256(offset = 0) {
    return (code: number) => `\u001B[${38 + offset};5;${code}m`;
}
function wrapAnsi16m(offset = 0) {
    return (red: number, green: number, blue: number) => `\u001B[${38 + offset};2;${red};${green};${blue}m`;
}
