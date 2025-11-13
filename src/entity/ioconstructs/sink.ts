import Point from "@mapbox/point-geometry";
import { Canvas } from "../../canvas";
import { FOUNDATION_SIZE } from "../../constants";
import { PartId } from "../../database-types";
import { EntityManager } from "../entity";
import { IOConstruct, IOConstructParams } from "../ioconstruct";
import { SocketInput } from "../socket";
import { Directions, Rectangle, withMaxDecimal } from "../../utils";
import { Database } from "../../database";

const socketInputConfigs: IOConstructParams["socketInputConfigs"] = [
    {
        partType: "solid",
        coords: new Point(-FOUNDATION_SIZE / 2, 0),
        direction: Directions.LEFT,
    },
];

export class Sink extends IOConstruct {
    constructName: string = "Sink";
    width: number = FOUNDATION_SIZE;
    height: number = FOUNDATION_SIZE;

    input: SocketInput;

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
        ctx.fillText(withMaxDecimal(this.input.flow, 4), center.x, center.y);

        // Draw the part
        const icon = Database.getPartIcon(this.input.partId);
        const iconScale = 0.75;
        const iconRect = Rectangle.fromCenter(
            this.coords,
            iconScale * this.width,
            iconScale * this.height,
        );
        ctx.drawImage(icon, ...iconRect.xywh());
    }

    staticAnalysis(): void {
        this.input.setMaxPermitted(Number.POSITIVE_INFINITY);
    }

    balance(): void {}
}
