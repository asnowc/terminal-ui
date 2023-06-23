interface StringLine {
    str: string;
    len: number;
}

function getCharLen(charCode: number) {
    if (charCode > 127 || charCode == 94) return 2;
    return 1;
}
function getStrLen(str: string) {
    let len = 0;
    for (let i = 0; i < str.length; i++) {
        let charCode = str.charCodeAt(i);
        if (charCode > 127 || charCode == 94) len += 2;
        else len++;
    }
    return len;
}

export function createBlockStr(str: string, width: number, autoWarp?: boolean): StringLine[] {
    let lines: StringLine[] = [];
    if (str === "") return lines;
    else if (str.length === 1) return [{ str, len: getStrLen(str) }];

    let maxX = width;
    let i = 0; //当前索引
    let lineStartIndex = 0; //当前行起始索引
    let line: StringLine = { len: 0, str: str.slice(lineStartIndex, i) };

    for (; i < str.length; i++) {
        let char = str[i];
        if (char !== "\n") {
            let charLen = getCharLen(char.charCodeAt(0));

            if (line.len + charLen <= maxX) {
                line.str += char;
                line.len += charLen;
                continue;
            } else if (autoWarp) i--;
        }

        lines.push(line);
        lineStartIndex = i;
        line = { len: 0, str: str.slice(lineStartIndex, i) };
    }
    if (line.len) lines.push(line);
    return lines;
}

/**
 * @returns [修改字符串,长度变化量]
 */
export function toEllipsis(str: string, surplusLen: number): [string, number] {
    if (surplusLen >= 2) return [str + "..", 2];
    let i = str.length - 1;
    let sliceLen = 0;
    for (; i > 0 && surplusLen + sliceLen < 2; i--) {
        sliceLen += getCharLen(str.charCodeAt(i));
    }
    return [str.slice(0, i + 1) + "..", 2 - sliceLen];
}
