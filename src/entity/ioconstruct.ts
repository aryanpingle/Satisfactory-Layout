import Point from "@mapbox/point-geometry";
import { Entity, EntityManager } from "./entity";
import { Socket, SocketInput, SocketOutput, SocketParams } from "./socket";
import { Canvas } from "../canvas";
import { IOCONSTRUCT_ENTITY_NAME } from "../constants";
import { PartFlowDict } from "../database";

export interface SocketConfig extends SocketParams {
    coords: Point;
}

export interface IOConstructParams {
    socketInputConfigs: SocketConfig[];
    socketOutputConfigs: SocketConfig[];
}

/**
 * Abstract class denoting an entity having some number of input and output sockets,
 * and a way to output parts based on its inputs.
 */
export abstract class IOConstruct extends Entity {
    // Inherited from Entity
    name = IOCONSTRUCT_ENTITY_NAME;
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

    /**
     * Set the parts and flows of output sockets based on input socket.
     *
     * IMPORTANT: This function should set the maxPermitted variable on the
     * input sockets depending on a combination of the output sockets' maxPermitted
     * variable and also the minimum input ratio.
     */
    abstract balance(): void;

    /**
     * Preparatory step to assign a part id to any input or output sockets, if applicable.
     *
     * Will be called on all IOConstruct objects once before one or more balance() calls.
     */
    abstract assignSocketParts(): void;

    private _getPFDFromSockets(sockets: Socket[]): PartFlowDict {
        const pfd: PartFlowDict = {};
        sockets.forEach((s) => {
            if (s.partId === undefined) return;
            if (!(s.partId in pfd)) pfd[s.partId] = 0;
            pfd[s.partId] = s.flow;
        });
        return pfd;
    }

    getInputPFD(): PartFlowDict {
        return this._getPFDFromSockets(this.inputs);
    }

    getOutputPFD(): PartFlowDict {
        return this._getPFDFromSockets(this.outputs);
    }

    render(canvas: Canvas) {
        this.renderConstruct(canvas);
        // Render sockets
        this.inputs.forEach((socket) => socket.render(canvas));
        this.outputs.forEach((socket) => socket.render(canvas));
    }

    abstract getOperatingInformation(): Object;
}
