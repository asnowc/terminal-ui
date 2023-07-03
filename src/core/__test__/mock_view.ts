import { AreaBlock } from "../area_block.js";
import { Area, View } from "../view.js";
import { MockStdout, MockTerminal } from "./mock_terminal.js";
export function asyncTime(time?: number) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

export function setViewContent() {
    const area = new MockView([10, 10, 20, 20]);
    area.setContext("a的bc", true);
    area.render();
    return area;
}
export class MockView extends View {
    constructor(area: Area) {
        super();
        this.viewArea = [area[0], area[1], area[0] + area[2], area[1] + area[3]];
    }
    protected viewArea: Readonly<Area>;
    readonly root = new MockTerminal();
    get mockStdout(): MockStdout {
        return this.root.stdout as any;
    }

    getString(y: number, x = 0, len?: number) {
        let arr = this.mockStdout.context[y];
        let mex = len ? x + len : arr.length;
        let str = "";
        for (let i = x; i < mex; i++) {
            if (typeof arr[i] === "string") str += arr[i];
        }
        return str;
    }
    afterRender() {
        return asyncTime(this.root.renderBus?.time);
    }
}
export class MockAreaBlock extends AreaBlock {
    constructor(areaSize: [number, number] | Area) {
        super(new MockTerminal(), areaSize);
    }
    getString(y: number, x = 0, len?: number) {
        let arr = this.mockStdout.context[y];
        let mex = len ? x + len : arr.length;
        let str = "";
        for (let i = x; i < mex; i++) {
            if (typeof arr[i] === "string") str += arr[i];
        }
        return str;
    }
    get mockStdout(): MockStdout {
        return this.root.stdout as any;
    }
    afterRender() {
        return asyncTime(this.root.renderBus?.time);
    }
}
