import { Area } from "@asnc/command-ui/area_render";

const stdin = process.stdin;
const stdout = process.stdout;
stdin.setRawMode(true);
stdin.on("data", (str) => {
    // let str = data.length > 1 ? data.toString("ascii") : data.toString("ascii");

    let out = "";
    for (let i = 0; i < str.length; i++) {
        out += str[i] + ",";
    }

    console.log(out.slice(0, -1));
});

function createArea(area) {
    return new Area(stdout, area);
}
const area1 = createArea([0, 0, 20, 5]);
const area2 = createArea([22, 2, 20, 5]);
area2.autoWarp = false;
let n1 = 0;

function update() {
    area1.render("是".repeat(20) + "n1: " + n1++ + "\n1\n2\n3\n4\n5\n6");
}
// setInterval(update, 100);
