import type { Terminal } from "./terminal.js";
import { Area, View } from "./view.js";

type PositionSize = number | [number, number] | Area;

export class AreaBlock extends View {
    protected viewArea: Area;
    constructor(root: Terminal, area: [width: number, height: number]);
    constructor(root: Terminal, area: [x: number, y: number, width: number, height: number]);
    constructor(root: Terminal, area: [number, number] | Area);
    constructor(readonly root: Terminal, area: [number, number] | Area) {
        super();
        let [x, y, width, height] = area;
        if (area.length < 4) {
            width = x;
            height = y;
            x = 0;
            y = 0;
        }

        if (typeof x !== "number" || typeof y !== "number")
            throw new Error("area[0] and area[1] must be a number");
        if (!(width! > 0 && height! > 0)) throw new Error("area[2] and area[3] must be greater than 0");

        this.viewArea = [x, y, x + width!, y + height!];
    }

    setBlockSize(width: number, height: number) {
        let oldWidth = this.width;
        let oldHeight = this.height;
        if (width == oldWidth && height === oldHeight) return;
        this.setArea(this.viewArea[0], this.viewArea[1]);
    }

    margin: PositionSize = 0;
    setArea(x: number, y: number, notClearOld?: boolean): void;
    setArea(x: number, y: number, maxX: number, maxY?: number, notClearOld?: boolean): void;
    setArea(x: number, y: number, maxX_notClearOld?: number | boolean, maxY = this.viewArea[3], notClearOld = false) {
        let newArea: Area;
        if (typeof maxX_notClearOld === "number") {
            newArea = [x, y, maxX_notClearOld, maxY];
        } else {
            notClearOld = Boolean(maxX_notClearOld);

            let dx = x - this.viewArea[0];
            let dy = y - this.viewArea[1];
            if (dx === 0 && dy === 0) return;
            newArea = [x, y, this.viewArea[2] + dx, this.viewArea[3] + dy];
        }

        if (!notClearOld) this.clearArea(this.viewArea);
        this.viewArea = newArea;
        this.asyncRender();
    }
}
