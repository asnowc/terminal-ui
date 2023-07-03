function getCharLen(charCode: number) {
    if (charCode > 127 || charCode == 94) return 2;
    return 1;
}

export function* scanLineFromStr(
    str: string,
    width: number,
    height: number
): Generator<[number, number, number], void, void> {
    if (str === "" || width <= 0 || height <= 0) return;

    let startIndex = 0;
    let currentWidth = 0;
    let y = 0;
    let nextWidth = 0;
    for (let i = 0; i < str.length && y < height; i++) {
        let charCode = str.charCodeAt(i);
        if (charCode !== 10) {
            nextWidth = currentWidth + getCharLen(charCode);
            if (nextWidth < width) {
                currentWidth = nextWidth;
                continue;
            } else if (nextWidth > width) {
                yield [startIndex, i, currentWidth];
                startIndex = i;
                i--;
            } else {
                yield [startIndex, i + 1, nextWidth];
                startIndex = i + 1;
            }
        } else {
            yield [startIndex, i, currentWidth];
            startIndex = i + 1;
        }
        currentWidth = 0;
        y++;
    }
    if (y < height && nextWidth >= 0) yield [startIndex, str.length, nextWidth];
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
