import Point from "@mapbox/point-geometry";
import { Canvas } from "../canvas";
import { EntityManager } from "./entity";
import { IOConstructParams } from "./ioconstruct";
import { FOUNDATION_SIZE } from "../constants";
import { Machine } from "./machine";
import { fillCircle } from "../utils";

const socketOutputConfigs: IOConstructParams["socketOutputConfigs"] = [
    {
        partType: "solid",
        coords: new Point(+4, 0),
    },
];

export class Supply extends Machine {
    constructName: string = "Supply";
    width: number = FOUNDATION_SIZE;
    height: number = FOUNDATION_SIZE;

    constructor(manager: EntityManager) {
        super(manager, [], socketOutputConfigs);
    }

    renderConstruct(canvas: Canvas): void {
        const ctx = canvas.ctx;

        ctx.fillStyle = "deepskyblue";
        fillCircle(ctx, this.coords.x, this.coords.y, FOUNDATION_SIZE / 2);
    }
}
