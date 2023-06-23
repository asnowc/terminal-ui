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

const baseKey = new Map<string, { open: number; close: number }>([
    ["bold", { open: 1, close: 22 }],
    ["dim", { open: 2, close: 22 }],
    ["italic", { open: 3, close: 23 }],
    ["underline", { open: 4, close: 24 }],
    ["twinkling", { open: 5, close: 25 }],
    ["inverse", { open: 7, close: 27 }],
    ["hidden", { open: 8, close: 28 }],
    ["strikethrough", { open: 9, close: 29 }],
    ["overline", { open: 53, close: 55 }],
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
export interface Style extends FontStyleOption {}
export class Style {
    static restCode = 0;
    static createCode(style: FontStyleOption): [string, string] {
        let open = "";
        let close = "";

        for (const [key, code] of baseKey) {
            let val = (style as any)[key];
            if (val === undefined) continue;
            else if (val) {
                open += code.open + ";";
                close += code.close + ";";
            }
        }
        let color: Color | undefined = style.bgColor;
        if (color) {
            open += color.open + ";";
            close += color.close + ";";
        }
        color = style.color;
        if (color) {
            open += color.open + ";";
            close += color.close + ";";
        }
        if (open.length === 0) return ["", ""];
        open = "\x1B[" + open.slice(0, -1) + "m";
        close = "\x1B[" + close.slice(0, -1) + "m";

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
    createCode(): [string, string] {
        return Style.createCode(this);
    }
    createStr(str: string, reset?: boolean) {
        const [open, close] = this.createCode();
        if (reset) return open + str + Style.restCode;

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

    protected constructor(readonly open: number) {}
    abstract readonly close: number;

    /**
     * @description Convert from the RGB color space to the ANSI 256 color space.
     * @param red - (`0...255`)
     * @param green - (`0...255`)
     * @param blue - (`0...255`)
     */
    protected static rgbToAnsi256(red: number, green: number, blue: number) {
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
    protected static hexToRgb(hex: string): [red: number, green: number, blue: number] {
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
    protected static hexToAnsi256(hex: string): number {
        return this.rgbToAnsi256(...this.hexToRgb(hex));
    }
    /** Convert from the ANSI 256 color space to the ANSI 16 color space.
  		@param code - A number representing the ANSI 256 color.
	*/
    protected static ansi256ToAnsi(code: number) {
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
    protected static rgbToAnsi(red: number, green: number, blue: number): number {
        return this.ansi256ToAnsi(this.rgbToAnsi256(red, green, blue));
    }
    /** Convert from the RGB HEX color space to the ANSI 16 color space. */
    protected static hexToAnsi(hex: string): number {
        return this.ansi256ToAnsi(this.hexToAnsi256(hex));
    }
}

export class FontColor extends Color {
    readonly close = 39;

    static black = new this(30);
    static red = new this(31);
    static green = new this(32);
    static yellow = new this(33);
    static blue = new this(34);
    static magenta = new this(35);
    static cyan = new this(36);
    static white = new this(37);
    static blackBright = new this(90);
    static redBright = new this(91);
    static greenBright = new this(92);
    static yellowBright = new this(93);
    static blueBright = new this(94);
    static magentaBright = new this(95);
    static cyanBright = new this(96);
    static whiteBright = new this(97);
}
export class BgColor extends Color {
    readonly close = 49;
    static ansi = wrapAnsi16(ANSI_BACKGROUND_OFFSET);
    static ansi256 = wrapAnsi256(ANSI_BACKGROUND_OFFSET);
    static ansi16m = wrapAnsi16m(ANSI_BACKGROUND_OFFSET);

    static black = new this(40);
    static red = new this(41);
    static green = new this(42);
    static yellow = new this(43);
    static blue = new this(44);
    static magenta = new this(45);
    static cyan = new this(46);
    static white = new this(47);
    static blackBright = new this(100);
    static redBright = new this(101);
    static greenBright = new this(102);
    static yellowBright = new this(103);
    static blueBright = new this(104);
    static magentaBright = new this(105);
    static cyanBright = new this(106);
    static whiteBright = new this(107);
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
