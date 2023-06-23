import type { Terminal } from "./terminal.js";
import { Area, View } from "./view.js";

type PositionSize = number | [number, number] | Area;
export interface AreaBlockOption {
    position?: [x: number, y: number];
    areaSize?: [width: number, height: number];
}
export class AreaBlock extends View {
    protected viewArea: Area;
    constructor(readonly root: Terminal, option: AreaBlockOption = {}) {
        super();
        const { position = [0, 0], areaSize = [4, 1] } = option;
        this.viewArea = [...position, position[0] + areaSize[0], position[1] + areaSize[1]];
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
