import Point from "@mapbox/point-geometry";
import { Canvas } from "../canvas";
import { EntityManager } from "./entity";
import { IOConstruct, IOConstructParams } from "./ioconstruct";
import { FOUNDATION_SIZE } from "../constants";
import { Directions, fillCircle } from "../utils";
import { PartId } from "../database-types";

const socketOutputConfigs: IOConstructParams["socketOutputConfigs"] = [
    {
        partType: "solid",
        coords: new Point(FOUNDATION_SIZE / 2, 0),
        direction: Directions.RIGHT,
    },
];

export class Supply extends IOConstruct {
    constructName: string = "Supply";
    width: number = FOUNDATION_SIZE;
    height: number = FOUNDATION_SIZE;

    partId?: PartId;
    flow: number = 0;

    constructor(manager: EntityManager) {
        super(manager, [], socketOutputConfigs);
    }

    staticAnalysis(): void {
        this.outputs[0].propagate(this.partId, this.flow);
    }

    balance(): void {
        const partId = this.partId;
        const outputSocket = this.outputs[0];
        outputSocket.propagate(partId, this.flow);
    }

    renderConstruct(canvas: Canvas): void {
        const ctx = canvas.ctx;

        ctx.fillStyle = "deepskyblue";
        fillCircle(ctx, this.coords.x, this.coords.y, FOUNDATION_SIZE / 2);
    }

    getOperatingInformation(): Object {
        return {
            id: this.id,
            name: this.constructName,
            partId: this.partId,
            flow: this.flow,
        };
    }
}
