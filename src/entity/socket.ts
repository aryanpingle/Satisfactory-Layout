import { Canvas } from "../canvas";
import { Colors } from "../constants";
import { PartId } from "../database-types";
import { Direction, Directions, Rectangle, withMaxDecimal } from "../utils";
import { Entity, EntityManager } from "./entity";
import { IOConstruct } from "./ioconstruct";

export type SocketIOType = "input" | "output";

export type SocketPartType = "fluid" | "solid";

export interface SocketParams {
    partType: SocketPartType;
    input?: Socket["input"];
    output?: Socket["output"];
    relativeAngle?: number;
    direction: Direction;
}

export abstract class Socket extends Entity {
    // Inherited from Entity
    name: string = "Socket";
    attachment: boolean = true;
    width: number = 2;
    height: number = 2;

    input?: IOConstruct | SocketOutput;
    output?: IOConstruct | SocketInput;

    acceptType: SocketPartType;
    /** Angle of the socket relative to its East-facing construct. */
    relativeAngle: number;
    /** Direction in which a conveyer may enter/exit from.  */
    direction: Direction;
    /** Id of the part flowing through the socket. */
    partId?: PartId;
    // TODO: Use the Fraction class
    flow: number = 0;
    maxPermitted: number = Number.POSITIVE_INFINITY;

    abstract ioType: SocketIOType;

    constructor(manager: EntityManager, params: SocketParams) {
        super(manager);

        this.input = params.input;
        this.output = params.output;
        this.acceptType = params.partType;
        this.relativeAngle = params.relativeAngle ?? 0;
        this.direction = params.direction ?? Directions.RIGHT;
    }

    override getBoundingRect(): Rectangle {
        const construct = this.getConstruct();
        return Rectangle.fromCenter(
            construct.coords.add(this.coords),
            this.width,
            this.height,
        );
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

        const rect = this.getBoundingRect();
        ctx.fillRect(...rect.xywh());

        if (this.partId !== undefined) {
            const center = rect.getCenter();
            ctx.font = "normal 0.5px monospace";
            ctx.fillStyle = "black";
            ctx.fillText(withMaxDecimal(this.flow, 4), center.x, center.y);
        }
    }

    /**
     * Disconnect this socket's connection to any connected socket.
     */
    disconnect() {
        if (this.ioType === "input") {
            const inputSocket = this as any as SocketInput;
            const outputSocket = inputSocket.input as SocketOutput;

            if (outputSocket === undefined) return;

            outputSocket.propagate(undefined, 0);

            inputSocket.input = undefined;
            outputSocket.output = undefined;
        } else {
            const outputSocket = this as any as SocketOutput;
            const inputSocket = outputSocket.output as SocketInput;

            if (inputSocket === undefined) return;

            outputSocket.propagate(undefined, 0);

            inputSocket.input = undefined;
            outputSocket.output = undefined;
        }
    }

    // --- Static methods

    static connect(socket1: Socket, socket2: Socket) {
        const [inputSocket, outputSocket] = Socket.sort(socket1, socket2);

        // Remove their connections (if any)
        inputSocket.disconnect();
        outputSocket.disconnect();

        // Connect them
        outputSocket.output = inputSocket;
        inputSocket.input = outputSocket;
    }

    static sort(socket1: Socket, socket2: Socket): [SocketInput, SocketOutput] {
        if (socket1.ioType === socket2.ioType) {
            throw new Error(
                `Cannot sort sockets of the same type (ids: ${socket1.id}, ${socket2.id}).`,
            );
        }

        const inputSocket = socket1.ioType === "input" ? socket1 : socket2;
        const outputSocket = socket1.ioType === "output" ? socket1 : socket2;
        return [inputSocket, outputSocket] as any;
    }
}

export class SocketInput extends Socket {
    ioType: SocketIOType = "input";

    input?: SocketOutput;
    output: IOConstruct;

    constructor(manager: EntityManager, params: SocketParams) {
        super(manager, params);

        this.input = params.input as any;
        this.output = params.output as any;
    }

    setMaxPermitted(maxPermitted: number) {
        this.maxPermitted = maxPermitted;

        if (this.input === undefined) return;
        this.input.maxPermitted = maxPermitted;
    }
}

export class SocketOutput extends Socket {
    ioType: SocketIOType = "output";

    input: IOConstruct;
    output?: SocketInput;

    constructor(manager: EntityManager, params: SocketParams) {
        super(manager, params);

        this.input = params.input as any;
        this.output = params.output as any;
    }

    propagate(partId: PartId | undefined, flow: number) {
        this.partId = partId;
        this.flow = flow;

        const next = this.output;
        if (next === undefined) return;

        next.partId = this.partId;
        next.flow = this.flow;
    }
}
