import Point from "@mapbox/point-geometry";
import { Canvas } from "../canvas";
import { FOUNDATION_SIZE } from "../constants";
import { PartId } from "../database-types";
import { EntityManager } from "./entity";
import { IOConstruct, IOConstructParams } from "./ioconstruct";
import { SocketInput } from "./socket";

const socketInputConfigs: IOConstructParams["socketInputConfigs"] = [
    {
        partType: "solid",
        coords: new Point(-FOUNDATION_SIZE / 2, 0),
    },
];

export class Sink extends IOConstruct {
    constructName: string = "Sink";
    width: number = FOUNDATION_SIZE;
    height: number = FOUNDATION_SIZE;

    input: SocketInput;

    partId?: PartId;
    flow: number = 0;

    constructor(manager: EntityManager) {
        super(manager, socketInputConfigs, []);

        this.input = this.inputs[0];
    }

    renderConstruct(canvas: Canvas): void {
        const ctx = canvas.ctx;

        ctx.fillStyle = "greenyellow";
        const r = this.getBoundingRect();
        ctx.fillRect(...r.xywh());

        const center = this.getBoundingRect().getCenter();
        ctx.font = "normal 0.5px monospace";
        ctx.fillStyle = "black";
        ctx.fillText(String(this.flow), center.x, center.y);
    }

    staticAnalysis(): void {
        this.input.setMaxPermitted(Number.POSITIVE_INFINITY);
    }

    balance(): void {
        this.partId = this.input.partId;
        this.flow = this.input.flow;
    }

    getOperatingInformation(): Object {
        return {
            id: this.id,
            name: this.constructName,
        };
    }
}
