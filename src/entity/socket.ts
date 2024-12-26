import { Canvas } from "../canvas";
import { Colors } from "../constants";
import { PartId } from "../dataset";
import { Rectangle } from "../utils";
import { Entity, EntityManager, EntityName } from "./entity";
import { IOConstruct } from "./ioconstruct";

export type SocketIOType = "input" | "output";

export type SocketPartType = "fluid" | "solid";

export interface SocketParams {
    partType: SocketPartType;
    input?: Socket["input"];
    output?: Socket["output"];
    relativeAngle?: number;
}

export abstract class Socket extends Entity {
    // Inherited from Entity
    name: EntityName = "Socket";
    attachment: boolean = true;
    width: number = 2;
    height: number = 2;

    input?: IOConstruct | SocketOutput;
    output?: IOConstruct | SocketInput;

    acceptType: SocketPartType;
    /** Angle of the socket relative to its East-facing construct. */
    relativeAngle: number;
    /** Id of the part flowing through the socket. */
    partId?: PartId;
    // TODO: Use the Fraction class
    flow: number = 0;

    abstract ioType: SocketIOType;

    constructor(manager: EntityManager, params: SocketParams) {
        super(manager);

        this.input = params.input;
        this.output = params.output;
        this.acceptType = params.partType;
        this.relativeAngle = params.relativeAngle ?? 0;
    }

    getConstruct(): IOConstruct {
        const noConstructError = new Error(``);
        if (this.ioType === "input") {
            if (this.output === undefined) throw noConstructError;
            return this.output as IOConstruct;
        } else {
            if (this.input === undefined) throw noConstructError;
            return this.input as IOConstruct;
        }
    }

    /**
     * Should be invoked within the parent construct.
     */
    render(canvas: Canvas) {
        const ctx = canvas.ctx;

        if (this.ioType === "input") {
            ctx.fillStyle = Colors.alignOrange.string();
        } else {
            ctx.fillStyle = Colors.alignGreen.string();
        }
        const construct = this.getConstruct();
        const rect = Rectangle.fromCenter(
            construct.coords.add(this.coords),
            this.width,
            this.height,
        );
        ctx.fillRect(...rect.xywh());
    }
}

export class SocketInput extends Socket {
    ioType: SocketIOType = "input";

    constructor(manager: EntityManager, params: SocketParams) {
        super(manager, params);
    }
}

export class SocketOutput extends Socket {
    ioType: SocketIOType = "output";

    constructor(manager: EntityManager, params: SocketParams) {
        super(manager, params);
    }
}

// from Satisfactory-TS:

//   export interface SocketParams extends EntityParams {
//     type: SocketType;
//     acceptType: SocketAcceptType;
//     parentConstruct: IOConstruct | null;
//     rotation: number;
//   }

//   export abstract class Socket extends Entity {
//     type: SocketType;
//     acceptType: SocketAcceptType;
//     input: SocketOutput | IOConstruct | null = null;
//     output: SocketInput | IOConstruct | null = null;
//     // TODO: Why should null be allowed?
//     parentConstruct: IOConstruct | null;

//     /**
//      * Indicates the direction in which the socket arrow should point
//      * independent of parent rotation.
//      */
//     rotation: number = 0;
//     flow: Fraction = new Fraction(0);
//     part: PartId | null = null;

//     constructor(params: SocketParams) {
//       super(params);
//       this.type = params.type;
//       this.acceptType = params.acceptType;
//       this.parentConstruct = params.parentConstruct;
//     }

//     abstract disconnect(): void;

//     abstract balance(part: PartId, flow: number): void;

//     getCoords(): Point {
//       const parent = this.parentConstruct!;
//       const coords = parent.coords.add(
//         this.coords.rotate((parent.rotation * Math.PI) / 180)
//       );
//       return coords;
//     }

//     getHeading(): Point {
//       const angle = this.rotation + this.parentConstruct!.rotation;
//       // Both input and output sockets should point away from the construct
//       const invert = this.type === SocketType.INPUT;
//       return new Point(invert ? -1 : +1, 0).rotate((angle * Math.PI) / 180);
//     }

//     toString(): string {
//       return `Socket{part=${this.part}, flow=${this.flow.simplify(0.1)}}`;
//     }
//   }

//   export const SOCKET_DIAMETER = 2;
