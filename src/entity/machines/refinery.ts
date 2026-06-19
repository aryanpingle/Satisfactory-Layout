import Point from "@mapbox/point-geometry";
import { Canvas } from "../../canvas";
import { EntityManager } from "../entity";
import { IOConstructParams } from "../ioconstruct";
import { Machine } from "../machine";
import { Directions } from "../../utils";
import { RecipeId } from "../../database-types";

const REFINERY_WIDTH = 20;
const REFINERY_HEIGHT = 10;

const socketInputConfigs: IOConstructParams["socketInputConfigs"] = [
    {
        partType: "fluid",
        coords: new Point(-REFINERY_WIDTH / 2, -REFINERY_HEIGHT / 4),
        direction: Directions.LEFT,
    },
    {
        partType: "solid",
        coords: new Point(-REFINERY_WIDTH / 2, +REFINERY_HEIGHT / 4),
        direction: Directions.LEFT,
    },
];
const socketOutputConfigs: IOConstructParams["socketOutputConfigs"] = [
    {
        partType: "fluid",
        coords: new Point(+REFINERY_WIDTH / 2, -REFINERY_HEIGHT / 4),
        direction: Directions.RIGHT,
    },
    {
        partType: "solid",
        coords: new Point(+REFINERY_WIDTH / 2, +REFINERY_HEIGHT / 4),
        direction: Directions.RIGHT,
    },
];

export class Refinery extends Machine {
    constructName: string = "Refinery";
    width: number = REFINERY_WIDTH;
    height: number = REFINERY_HEIGHT;

    constructor(manager: EntityManager, recipeId?: RecipeId) {
        super(manager, socketInputConfigs, socketOutputConfigs, recipeId);
    }

    clone() {
        const duplicate = new Refinery(this.manager, this.recipeId);
        return duplicate;
    }

    renderConstruct(canvas: Canvas): void {
        const ctx = canvas.ctx;

        ctx.fillStyle = "orange";
        ctx.fillRect(
            this.coords.x - REFINERY_WIDTH / 2,
            this.coords.y - REFINERY_HEIGHT / 2,
            REFINERY_WIDTH,
            REFINERY_HEIGHT,
        );
    }
}
