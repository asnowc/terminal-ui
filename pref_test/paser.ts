export function paseStrList(str: string, width: number): { lines: string[]; lengths: number[] } {
    let lines: string[] = [];
    let lengths: number[] = [];

    let maxX = width;
    let i = 0, //当前索引
        lineStartIndex = 0; //当前行起始索引
    let lineLen = 0;
    for (; i < str.length; ) {
        let char = str[i];
        if (char !== "\n") {
            let charLen = getCharLen(char.charCodeAt(0));

            if (lineLen + charLen <= maxX) {
                lineLen += charLen;
                i++;
                continue;
            }
            lines.push(str.slice(lineStartIndex, i));
        } else {
            lines.push(str.slice(lineStartIndex, i));
            i++;
        }

        lengths.push(lineLen);
        lineLen = 0;
        lineStartIndex = i;
    }
    if (lineLen) {
        lines.push(str.slice(lineStartIndex, i));
        lengths.push(lineLen);
    }
    return { lines, lengths };
}

export function paseCharList(str: string, width: number): { lines: string[][]; lengths: number[] } {
    let lines: string[][] = [];
    let lengths: number[] = [];

    let maxX = width;
    let i = 0; //当前索引
    let lineLen = 0,
        lineStr: string[] = [];
    for (; i < str.length; ) {
        let char = str[i];
        if (char !== "\n") {
            let charLen = getCharLen(char.charCodeAt(0));

            if (lineLen + charLen <= maxX) {
                lineLen += charLen;
                lineStr.push(char);
                i++;
                continue;
            }
            lines.push(lineStr);
        } else {
            lines.push(lineStr);
            i++;
        }

        lengths.push(lineLen);
        lineLen = 0;
        lineStr = [];
    }
    if (lineLen) {
        lines.push(lineStr);
        lengths.push(lineLen);
    }
    return { lines, lengths };
}
export function paseCodeList(str: string, width: number): { lines: Uint32Array[]; lengths: number[] } {
    let lines: Uint32Array[] = [];
    let lengths: number[] = [];

    let maxX = width;
    let i = 0; //当前索引
    let strLen = 0;
    let lineLen = 0,
        lineStr: number[] = [];
    for (; i < str.length; ) {
        let charCode = str.charCodeAt(i);
        if (charCode !== 10) {
            let charLen = getCharLen(charCode);

            if (lineLen + charLen <= maxX) {
                lineLen += charLen;
                lineStr[i - strLen] = charCode;
                i++;
                continue;
            }
            lines.push(new Uint32Array(lineStr));
        } else {
            lines.push(new Uint32Array(lineStr));
            i++;
        }

        lengths.push(lineLen);
        lineLen = 0;
        lineStr = [];
        strLen = i;
    }
    if (lineLen) {
        lines.push(new Uint32Array(lineStr));
        lengths.push(lineLen);
    }
    return { lines, lengths };
}

export function getCharLen(charCode: number) {
    if (charCode > 127 || charCode == 94) return 2;
    return 1;
}
