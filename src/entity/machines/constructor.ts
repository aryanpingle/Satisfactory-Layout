import Point from "@mapbox/point-geometry";
import { Canvas } from "../../canvas";
import { EntityManager } from "../entity";
import { IOConstructParams } from "../ioconstruct";
import { Machine } from "../machine";
import { Directions } from "../../utils";

const CONSTRUCTOR_WIDTH = 10;
const CONSTRUCTOR_HEIGHT = 8;

const socketInputConfigs: IOConstructParams["socketInputConfigs"] = [
    {
        partType: "solid",
        coords: new Point(-CONSTRUCTOR_WIDTH / 2, 0),
        direction: Directions.LEFT,
    },
];
const socketOutputConfigs: IOConstructParams["socketOutputConfigs"] = [
    {
        partType: "solid",
        coords: new Point(CONSTRUCTOR_WIDTH / 2, 0),
        direction: Directions.RIGHT,
    },
];

export class Constructor extends Machine {
    constructName: string = "Constructor";
    width: number = CONSTRUCTOR_WIDTH;
    height: number = CONSTRUCTOR_HEIGHT;

    constructor(manager: EntityManager) {
        super(manager, socketInputConfigs, socketOutputConfigs);
    }

    renderConstruct(canvas: Canvas): void {
        const ctx = canvas.ctx;

        ctx.fillStyle = "crimson";
        ctx.fillRect(
            this.coords.x - CONSTRUCTOR_WIDTH / 2,
            this.coords.y - CONSTRUCTOR_HEIGHT / 2,
            CONSTRUCTOR_WIDTH,
            CONSTRUCTOR_HEIGHT,
        );
    }
}
