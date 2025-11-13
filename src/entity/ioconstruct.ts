import Point from "@mapbox/point-geometry";
import { Canvas } from "../canvas";
import { IOCONSTRUCT_ENTITY_NAME } from "../constants";
import { Entity, EntityManager } from "./entity";
import { SocketParams, SocketInput, SocketOutput } from "./socket";
import { PartFlowDict } from "../pfd";
import { Direction } from "../utils";

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
     * Creates a PFD object from input sockets which are connected to some input.
     */
    getInputPFD(): PartFlowDict {
        const pfd = new PartFlowDict();
        this.inputs.forEach((s) => {
            if (s.partId === undefined) return;
            if (s.input === undefined) return;
            pfd._add(s.partId, s.flow);
        });
        return pfd;
    }

    /**
     * Creates a PFD object from the output sockets.
     *
     * Not particularly useful, except for debugging.
     */
    getOutputPFD(): PartFlowDict {
        const pfd = new PartFlowDict();
        this.outputs.forEach((s) => {
            if (s.partId === undefined) return;
            pfd._add(s.partId, s.flow);
        });
        return pfd;
    }

    render(canvas: Canvas) {
        this.renderConstruct(canvas);
        // Render sockets
        this.inputs.forEach((socket) => socket.render(canvas));
        this.outputs.forEach((socket) => socket.render(canvas));
    }

    /**
     * Set the partId of output sockets using information from the input sockets and any other factors.
     */
    abstract staticAnalysis(): void;
}
