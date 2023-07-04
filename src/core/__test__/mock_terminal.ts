import { Writable } from "node:stream";
import { Terminal, RenderBus } from "../terminal.js";

export class MockStdout extends Writable {
    constructor(windowSize = [100, 100]) {
        super();
        this.setWindowSize(windowSize[0], windowSize[1]);
    }
    cursorTo(x: number, y?: number | undefined, callback?: (() => void) | undefined): boolean;
    cursorTo(x: number, callback: () => void): boolean;
    cursorTo(x: number, y?: number | (() => void), callback?: () => void): boolean {
        if (typeof y === "function") callback = y as any;
        if (typeof y !== "number" || y < 0) y = 0;

        let maxX = this.columns;
        let maxY = this.rows;
        if (x >= maxX) x = maxX - 1;
        if (y >= maxY) y = maxY - 1;
        this.x = x;
        this.y = y;

        callback?.();
        return true;
    }
    private x = 0;
    private y = 0;
    private windowSize!: [number, number];
    context!: string[][];
    getWindowSize(): [number, number] {
        return this.windowSize.slice() as [number, number];
    }
    setWindowSize(x: number, y: number) {
        this.windowSize = [x, y];
        let context: string[][] = [];
        for (let i = 0; i < y; i++) {
            context[i] = [];
        }
        this.context = context;

        this.emit("resize");
    }
    _write(
        chunk: string | Buffer,
        encoding: BufferEncoding,
        callback: (error?: Error | null | undefined) => void
    ): void {
        if (chunk instanceof Buffer) chunk = chunk.toString("utf-8");
        for (let i = 0; i < chunk.length; ) {
            let y = this.y,
                x = this.x;
            let char = chunk.charAt(i);
            let charLen = this.getCharLen(char);
            this.x += charLen;

            if (this.x > this.columns) {
                if (y + 1 >= this.rows) break;
                this.y++;
                this.x = 0;
                continue;
            }

            this.context[y][x] = char;
            if (charLen > 1) this.context[y][x + 1] = undefined as any;
            i++;
        }
        callback();
    }
    private getCharLen(char: string) {
        let charCode = char.charCodeAt(0);
        if (charCode > 127 || charCode == 94) return 2;
        return 1;
    }
    get rows() {
        return this.windowSize[1];
    }
    get columns() {
        return this.windowSize[0];
    }
}

export class MockTerminal extends Terminal {
    private mockStdout: MockStdout;
    constructor() {
        let mockStdout = new MockStdout();
        super(mockStdout as any);
        this.mockStdout = mockStdout;
    }
    mockResizeEvent(width: number, height: number) {
        this.mockStdout.setWindowSize(width, height);
    }
}
