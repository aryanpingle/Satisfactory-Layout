import Point from "@mapbox/point-geometry";
import { Canvas } from "../../canvas";
import { IOConstruct, IOConstructParams } from "../ioconstruct";
import { EntityManager } from "../entity";
import { SocketInput } from "../socket";
import { Directions } from "../../utils";

const socketInputConfigs: IOConstructParams["socketInputConfigs"] = [
    {
        partType: "solid",
        coords: new Point(-2, 0),
        direction: Directions.LEFT,
    },
];
const socketOutputConfigs: IOConstructParams["socketOutputConfigs"] = [
    {
        partType: "solid",
        coords: new Point(0, -2),
        direction: Directions.UP,
    },
    {
        partType: "solid",
        coords: new Point(+2, 0),
        direction: Directions.RIGHT,
    },
    {
        partType: "solid",
        coords: new Point(0, +2),
        direction: Directions.DOWN,
    },
];

export class Splitter extends IOConstruct {
    constructName: string = "Splitter";

    width: number = 4;
    height: number = 4;

    input: SocketInput;

    constructor(manager: EntityManager) {
        super(manager, socketInputConfigs, socketOutputConfigs);

        this.input = this.inputs[0];
    }

    renderConstruct(canvas: Canvas): void {
        const ctx = canvas.ctx;

        ctx.fillStyle = "yellow";
        const r = this.getBoundingRect();
        ctx.fillRect(...r.xywh());
    }

    staticAnalysis(): void {
        this.input.setMaxPermitted(Number.POSITIVE_INFINITY);

        const inputPartId = this.input.partId;
        this.outputs.forEach((s) => {
            s.propagate(inputPartId, 0);
        });
    }

    balance(): void {
        if (this.input.input === undefined || this.input.partId === undefined) {
            this.outputs.forEach((s) => s.propagate(undefined, 0));
            return;
        }

        // For all unconnected outputs, maxPermitted = 0
        this.outputs.forEach((s) => {
            if (s.output === undefined) s.maxPermitted = 0;
            s.flow = 0;
        });

        const inputFlow = this.input.flow;
        const inputPartId = this.input.partId;

        // Repeat the calculation until all sockets are saturated, or there is 0 balance
        // Ideally, this should be 3 definite repetitions (for each socket to become saturated)
        // But let's use an upper bound anyway
        let numSaturated = 0;
        let balance = inputFlow;
        const MAX_ITER_COUNT = 10;
        let iterCount = 0;
        while (balance > 0 && numSaturated < 3 && iterCount < MAX_ITER_COUNT) {
            iterCount++;

            const division = balance / (3 - numSaturated);

            numSaturated = 0;
            for (const s of this.outputs) {
                // if the socket is saturated, we can't give it anything
                if (s.flow === s.maxPermitted) {
                    numSaturated++;
                    continue;
                }

                // Assume each socket already has been given some amount, we
                // must calculate how much more to give.
                const canGive = s.maxPermitted - s.flow;
                const actuallyGiven = Math.min(canGive, division);
                s.propagate(inputPartId, s.flow + actuallyGiven);
                // Remove what we gave from the balance
                balance -= actuallyGiven;
            }
        }

        if (iterCount > 3) {
            console.warn(
                `Socket [${
                    this.id
                }] balancing took ${iterCount} iterations - ${this.outputs.map(
                    (s) => s.flow,
                )}.`,
            );
        }

        // If all the sockets are full (like at the end of a manifold)
        if (numSaturated === 3) {
            this.input.setMaxPermitted(inputFlow - balance);
        } else {
            this.input.setMaxPermitted(Number.POSITIVE_INFINITY);
        }
    }
}
