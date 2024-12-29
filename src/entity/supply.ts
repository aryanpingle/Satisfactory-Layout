import Point from "@mapbox/point-geometry";
import { Canvas } from "../canvas";
import { EntityManager } from "./entity";
import { IOConstruct, IOConstructParams } from "./ioconstruct";
import { FOUNDATION_SIZE } from "../constants";
import { fillCircle } from "../utils";
import { PartId } from "../database-types";

const socketOutputConfigs: IOConstructParams["socketOutputConfigs"] = [
    {
        partType: "solid",
        coords: new Point(FOUNDATION_SIZE / 2, 0),
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

    balance(): void {
        if (this.partId === undefined)
            throw new Error(
                `'partId' has not been set for Supply [${this.id}].`,
            );

        const partId = this.partId;

        const outputSocket = this.outputs[0];
        outputSocket.partId = partId;
        outputSocket.flow = this.flow;
    }

    renderConstruct(canvas: Canvas): void {
        const ctx = canvas.ctx;

        ctx.fillStyle = "deepskyblue";
        fillCircle(ctx, this.coords.x, this.coords.y, FOUNDATION_SIZE / 2);
    }
}
