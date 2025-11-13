import Point from "@mapbox/point-geometry";
import { Canvas } from "../../canvas";
import { IOConstruct, IOConstructParams } from "../ioconstruct";
import { SocketOutput, SocketPartType } from "../socket";
import { EntityManager } from "../entity";
import { PartId } from "../../database-types";
import { Directions } from "../../utils";

const socketInputConfigs: IOConstructParams["socketInputConfigs"] = [
    {
        partType: "solid",
        coords: new Point(0, -2),
        direction: Directions.UP,
    },
    {
        partType: "solid",
        coords: new Point(-2, 0),
        direction: Directions.LEFT,
    },
    {
        partType: "solid",
        coords: new Point(0, +2),
        direction: Directions.DOWN,
    },
];

const socketOutputConfigs: IOConstructParams["socketOutputConfigs"] = [
    {
        partType: "solid",
        coords: new Point(+2, 0),
        direction: Directions.RIGHT,
    },
];

export class Merger extends IOConstruct {
    constructName: string = "Merger";
    width: number = 4;
    height: number = 4;

    output: SocketOutput;

    constructor(manager: EntityManager, ioType: SocketPartType) {
        socketInputConfigs.forEach((config) => (config.partType = ioType));
        socketOutputConfigs.forEach((config) => (config.partType = ioType));
        super(manager, socketInputConfigs, socketOutputConfigs);

        this.output = this.outputs[0];
    }

    renderConstruct(canvas: Canvas): void {
        const ctx = canvas.ctx;

        ctx.fillStyle = "yellow";
        const r = this.getBoundingRect();
        ctx.fillRect(...r.xywh());
    }

    staticAnalysis(): void {
        this.inputs.forEach((s) => {
            s.setMaxPermitted(Number.POSITIVE_INFINITY);
        });

        // Ensure all inputs have the same partId
        let detectedPartIds: Set<PartId | undefined> = new Set();
        this.inputs.forEach((s) => {
            if (s.partId === undefined) return;
            detectedPartIds.add(s.partId);
        });

        if (detectedPartIds.size === 0) {
            this.output.propagate(undefined, 0);
            return;
        } else if (detectedPartIds.size === 1) {
            const detectedPartId = [...detectedPartIds.values()][0];
            this.output.propagate(detectedPartId, 0);
        } else {
            throw new Error(
                `Merger [${this.id}] has multiple types of input - ${detectedPartIds}`,
            );
        }
    }

    balance(): void {
        let detectedPartIds: Set<PartId | undefined> = new Set();
        let detectedFlow = 0;
        this.inputs.forEach((s) => {
            if (s.partId === undefined) return;

            detectedPartIds.add(s.partId);
            detectedFlow += s.flow;
        });

        if (detectedPartIds.size === 0) {
            this.output.propagate(undefined, 0);
            return;
        } else if (detectedPartIds.size > 1) {
            throw new Error(
                `Merger [${this.id}] has multiple types of input - ${detectedPartIds}`,
            );
        }

        const detectedPartId = [...detectedPartIds.values()][0];
        this.output.propagate(detectedPartId, detectedFlow);
    }
}
