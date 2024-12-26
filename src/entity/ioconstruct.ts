import Point from "@mapbox/point-geometry";
import { Entity, EntityId, EntityManager } from "./entity";
import { SocketInput, SocketOutput, SocketParams } from "./socket";
import { Canvas } from "../canvas";

export interface SocketConfig extends SocketParams {
    coords: Point;
}

export interface IOConstructParams {
    socketInputConfigs: SocketConfig[];
    socketOutputConfigs: SocketConfig[];
}

/**
 * Abstract class denoting an entity having some number of input and output sockets.
 */
export abstract class IOConstruct extends Entity {
    // Inherited from Entity
    name = "IOConstruct";
    attachment = false;

    abstract constructName: string;

    inputs: SocketInput[];
    outputs: SocketOutput[];

    constructor(
        manager: EntityManager,
        socketInputConfigs: SocketConfig[],
        socketOutputConfigs: SocketConfig[],
    ) {
        super(manager);

        // Store `this` (for readability)
        const ioConstructRef = this;

        // Create input sockets
        this.inputs = socketInputConfigs.map((params) => {
            const socket = new SocketInput(manager, params);
            socket.output = ioConstructRef;
            socket.coords = params.coords;
            return socket;
        });
        // Create output sockets
        this.outputs = socketOutputConfigs.map((params) => {
            const socket = new SocketOutput(manager, params);
            socket.input = ioConstructRef;
            socket.coords = params.coords;
            return socket;
        });
    }

    abstract renderConstruct(canvas: Canvas): void;

    render(canvas: Canvas) {
        // Render sockets
        this.inputs.forEach((socket) => socket.render(canvas));
        this.outputs.forEach((socket) => socket.render(canvas));

        this.renderConstruct(canvas);
    }
}
