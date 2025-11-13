import Point from "@mapbox/point-geometry";
import { Canvas } from "../../canvas";
import { EntityManager } from "../entity";
import { IOConstruct, IOConstructParams } from "../ioconstruct";
import { FOUNDATION_SIZE } from "../../constants";
import { Directions, fillCircle, Rectangle } from "../../utils";
import { PartId } from "../../database-types";
import { SocketOutput } from "../socket";
import { Database } from "../../database";

const socketOutputConfigs: IOConstructParams["socketOutputConfigs"] = [
    {
        partType: "fluid",
        coords: new Point(FOUNDATION_SIZE / 2, 0),
        direction: Directions.RIGHT,
    },
];

export class Supply extends IOConstruct {
    constructName: string = "Supply";
    width: number = FOUNDATION_SIZE;
    height: number = FOUNDATION_SIZE;

    output: SocketOutput;

    partId?: PartId;
    flow: number = 0;

    constructor(manager: EntityManager) {
        super(manager, [], socketOutputConfigs);
        this.output = this.outputs[0];
    }

    staticAnalysis(): void {
        this.outputs[0].propagate(this.partId, this.flow);
    }

    setPartAndFlow(partId: PartId, flow: number) {
        this.partId = partId;
        this.flow = flow;

        const partType = Database.isSolid(partId) ? "solid" : "fluid";
        this.output.acceptType = partType;
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

        // Draw the part
        const icon = Database.getPartIcon(this.partId);
        const iconScale = 0.75;
        const r = Rectangle.fromCenter(
            this.coords,
            iconScale * this.width,
            iconScale * this.height,
        );
        ctx.drawImage(icon, ...r.xywh());
    }
}
