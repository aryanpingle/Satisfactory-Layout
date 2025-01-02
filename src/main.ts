import "./style.css";
import Point from "@mapbox/point-geometry";
import { drawConnectionLine, getMsAndFPS, Rectangle, snap } from "./utils";
import { Canvas } from "./canvas";
import { EntityManager } from "./entity/entity";
import { StateManager } from "./stateManager";
import { setupStateManagement } from "./events";
import {
    Colors,
    FOUNDATION_SIZE,
    SOCKET_ENTITY_NAME,
    SOCKET_SIZE,
} from "./constants";
import { Constructor } from "./entity/machines";
import { Supply } from "./entity/supply";
import { Socket } from "./entity/socket";
import { ConnectionState } from "./state";
import { SatisfactoryGraph } from "./graph";
import { Splitter } from "./entity/splitter";
import debounce from "debounce";
import { Merger } from "./entity/merger";
import { Sink } from "./entity/sink";

export class App {
    canvas: Canvas;
    // Will be initialized in events.ts
    stateManager: StateManager = null as any;
    entityManager: EntityManager;
    graph: SatisfactoryGraph;

    // Ensures that 750px on the canvas = 10 foundations = 80m
    scale: number = 750 / 10 / FOUNDATION_SIZE;
    /** The translation of the visible world space in pixels. */
    translation: Point;

    constructor() {
        const canvasElement = document.querySelector(
            "#canvas",
        ) as HTMLCanvasElement;
        this.canvas = new Canvas(canvasElement);

        setupStateManagement(this);

        this.entityManager = new EntityManager();
        this.graph = new SatisfactoryGraph(this.entityManager);

        // Center the world-space (0, 0) in the canvas
        this.translation = new Point(
            this.canvas.width / 2,
            this.canvas.height / 2,
        );

        this.load1To5();
    }

    loadTest() {
        for (let i = -50; i <= 50; ++i) {
            for (let j = -50; j <= 50; ++j) {
                const constructor = new Constructor(this.entityManager);
                constructor.setRecipe("Recipe_IngotIron_C");
                constructor.coords = new Point(
                    2 * FOUNDATION_SIZE * i,
                    2 * FOUNDATION_SIZE * j,
                );
            }
        }

        this.graph.initializeConstructs();
        this.graph.balance(5);
    }

    load1To5() {
        // Supply
        const supply = new Supply(this.entityManager);
        supply.partId = "Desc_OreIron_C";
        supply.flow = 120;
        supply.coords = new Point(-3 * FOUNDATION_SIZE, 0);

        for (let i = 0; i < 2; ++i) {
            const merger = new Merger(this.entityManager);
            merger.coords = new Point(0, -1 * FOUNDATION_SIZE * i);
        }

        for (let i = 0; i < 4; ++i) {
            const splitter = new Splitter(this.entityManager);
            splitter.coords = new Point(
                1.5 * FOUNDATION_SIZE,
                -1 * FOUNDATION_SIZE * i,
            );
        }

        for (let i = 0; i < 5; ++i) {
            const sink = new Sink(this.entityManager);
            sink.coords = new Point(
                3 * FOUNDATION_SIZE,
                -1 * FOUNDATION_SIZE * i,
            );
        }

        this.graph.initializeConstructs();
        this.graph.staticAnalysis(50);
    }

    loadManifoldTest() {
        // Load test entities
        // TODO: BRUH put this shit in the EntityManager or smth

        // Supply
        const supply = new Supply(this.entityManager);
        supply.partId = "Desc_OreIron_C";
        supply.flow = 120;
        supply.coords = new Point(-3 * FOUNDATION_SIZE, 0);

        // Manifold system

        const splitters = [];
        const constructors = [];
        const mergers = [];
        for (let index = 0; index < 10; ++index) {
            const y = -FOUNDATION_SIZE * index * 1;

            // Splitter
            const splitter = new Splitter(this.entityManager);
            splitter.coords = new Point(-1.5 * FOUNDATION_SIZE, y);
            splitters.push(splitter);

            // Constructor
            const constructor = new Constructor(this.entityManager);
            constructor.setRecipe("Recipe_IngotIron_C");
            constructor.coords = new Point(0, y);
            constructors.push(constructor);

            // Connect splitter to constructor
            Socket.connect(splitter.outputs[1], constructor.inputs[0]);

            // Merger
            const merger = new Merger(this.entityManager);
            merger.coords = new Point(+1.5 * FOUNDATION_SIZE, y);
            mergers.push(merger);

            // Connect constructor to merger
            Socket.connect(constructor.outputs[0], merger.inputs[1]);

            if (index > 0) {
                // Connect splitters
                Socket.connect(
                    splitters[index - 1].outputs[0],
                    splitters[index].inputs[0],
                );
                // Connect mergers
                Socket.connect(
                    mergers[index].outputs[0],
                    mergers[index - 1].inputs[0],
                );
            }
        }

        // Connect supply to first splitter
        Socket.connect(supply.outputs[0], splitters[0].inputs[0]);

        const sink = new Sink(this.entityManager);
        sink.coords = new Point(+3 * FOUNDATION_SIZE, 0);
        Socket.connect(mergers[0].outputs[0], sink.inputs[0]);

        this.graph.initializeConstructs();
        this.graph.staticAnalysis(50);
        this.graph.balance(1);
    }

    /**
     * Rescale the canvas view using a fixed perspective point on the canvas.
     *
     * The old and new world point corresponding to the perspective point will
     * be the same.
     */
    scaleFromPoint(newScale: number, canvasPoint: Point) {
        // Constrain the new scale
        const MAX_SCALE = 50;
        const MIN_SCALE = 1;

        newScale = Math.max(MIN_SCALE, newScale);
        newScale = Math.min(MAX_SCALE, newScale);

        // Ignore if there's no change
        if (newScale === this.scale) return;

        // Convert mouse position on canvas to world position before scaling
        const oldWorldPoint = this.canvasPointToWorldPoint(canvasPoint);
        // Set the new scale
        this.scale = newScale;
        // Convert mouse position on canvas to world position after scaling
        const newWorldPoint = this.canvasPointToWorldPoint(canvasPoint);

        // The same canvas position should point to the
        // same world position before and after
        const offset = newWorldPoint.sub(oldWorldPoint);
        // In world-space, we should translate by `-offset`
        // So in canvas-space, we should translate by `newScale * offset`
        // (negative removed because translation of canvas is inverted)
        this.translation._add(offset.mult(newScale));

        this.render();
    }

    translateBy(delta: Point) {
        this.translation._add(delta);
        this.render();
    }

    canvasPointToWorldPoint(canvasPoint: Point) {
        // worldPoint = -translation/scale + canvasPoint/scale
        const worldTopLeft = this.translation.mult(-1).div(this.scale);
        const displacement = canvasPoint.div(this.scale);
        const worldPoint = worldTopLeft.add(displacement);
        return worldPoint;
    }

    worldPointToCanvasPoint(worldPoint: Point) {
        // worldPoint = -translation/scale + canvasPoint/scale
        // canvasPoint = worldPoint*scale + translation
        const canvasPoint = worldPoint.mult(this.scale).add(this.translation);
        return canvasPoint;
    }

    /**
     * Draw the reference grid.
     */
    drawGrid() {
        const ctx = this.canvas.ctx;
        // Line style
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 0.25;
        // Label style
        ctx.textAlign = "center";
        ctx.textRendering = "optimizeLegibility";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "white";
        ctx.font = "normal 2px monospace";

        // Render only the lines in view
        const topLeftWorldPoint = this.canvasPointToWorldPoint(new Point(0, 0));
        const canvasWidthInWorldSpace = this.canvas.width * this.scale;
        const canvasHeightInWorldSpace = this.canvas.height * this.scale;

        // Horizontal lines
        const topStart = snap(topLeftWorldPoint.y, FOUNDATION_SIZE);
        for (
            let y = topStart;
            y <= topStart + canvasHeightInWorldSpace;
            y += FOUNDATION_SIZE
        ) {
            const x1 = topLeftWorldPoint.x;
            const x2 = topLeftWorldPoint.x + canvasWidthInWorldSpace;

            ctx.beginPath();
            ctx.moveTo(x1, y);
            ctx.lineTo(x2, y);
            ctx.stroke();

            // Label
            // const worldOverlayPoint = this.canvasPointToWorldPoint(
            //     new Point(OVERLAY_SIZE / 2, 0)
            // );
            // ctx.fillText(String(y), worldOverlayPoint.x, y);
        }

        // Vertical lines
        const leftStart = snap(topLeftWorldPoint.x, FOUNDATION_SIZE);
        for (
            let x = leftStart;
            x <= leftStart + canvasWidthInWorldSpace;
            x += FOUNDATION_SIZE
        ) {
            const y1 = topLeftWorldPoint.y;
            const y2 = topLeftWorldPoint.y + canvasHeightInWorldSpace;

            ctx.beginPath();
            ctx.moveTo(x, y1);
            ctx.lineTo(x, y2);
            ctx.stroke();

            // Label
            // const worldOverlayPoint = this.canvasPointToWorldPoint(
            //     new Point(0, OVERLAY_SIZE / 2)
            // );
            // ctx.fillText(String(x), x, worldOverlayPoint.y);
        }
    }

    setWorldSpaceTransform() {
        const ctx = this.canvas.ctx;
        ctx.setTransform(1, 0, 0, 1, 0, 0); // identity matrix
        ctx.translate(this.translation.x, this.translation.y);
        ctx.scale(this.scale, this.scale);
    }

    render() {
        debounce(this._render.bind(this), 1000 / 120, { immediate: true })();
    }

    private _render() {
        const renderStartTime = performance.now();

        /** Reset the canvas */
        this.canvas.clear();
        this.setWorldSpaceTransform();

        /** Background grid */
        this.drawGrid();

        this.drawConnections();

        /** Render entities */
        const worldTopLeft = this.canvasPointToWorldPoint(new Point(0, 0));
        const worldBottomRight = this.canvasPointToWorldPoint(
            new Point(this.canvas.width, this.canvas.height),
        );
        const visibleRect = Rectangle.fromTwoPoints(
            worldTopLeft,
            worldBottomRight,
        );
        this.entityManager.getActiveEntities().forEach((entity) => {
            if (entity.attachment === true) return;
            if (!entity.getBoundingRect().intersects(visibleRect)) return;
            entity.render(this.canvas);
        });

        // DEBUG: Checking if selection state works fine
        const ctx = this.canvas.ctx;
        let state = this.stateManager.currentState;
        if (state.name === "selecting") {
            ctx.fillStyle = Colors.figmaBlue.alpha(0.1).string();
            ctx.lineWidth = 0.2;
            ctx.strokeStyle = Colors.figmaBlue.string();

            // Highlight intersecting entities
            const selectionRect = Rectangle.fromTwoPoints(
                state.startCoords,
                state.endCoords,
            );
            const entitiesCaughtInSelection = app.entityManager
                .getEntitiesIntersecting(selectionRect)
                .filter((entity) => entity.attachment === false);

            entitiesCaughtInSelection.forEach((entity) => {
                const rectCoords = entity.getBoundingRect().xywh();
                ctx.fillRect(...rectCoords);
                ctx.strokeRect(...rectCoords);
            });

            // Draw selection rectangle
            ctx.fillRect(...selectionRect.xywh());
            ctx.strokeRect(...selectionRect.xywh());
        } else if (state.name === "selection" || state.name === "relocating") {
            ctx.fillStyle = Colors.figmaBlue.alpha(0.1).string();
            ctx.lineWidth = 0.2;
            ctx.strokeStyle = Colors.figmaBlue.string();

            // Highlight selected entities
            const selected = Array.from(state.selectedIds).map((id) =>
                this.entityManager.getEntity(id),
            );
            const selectionUnionRect = EntityManager.getMergedBounds(selected);
            const selectionUnionXYWH = selectionUnionRect.xywh();
            ctx.fillRect(...selectionUnionXYWH);
            ctx.strokeRect(...selectionUnionXYWH);
        }

        if (state.name === "connection") {
            const connectionState = state as ConnectionState;
            const socket = connectionState.socket;
            const socketCoords = socket.getBoundingRect().getCenter();
            const mouseCoords = connectionState.mouseCoords;

            const delta = mouseCoords.sub(socketCoords);
            // If delta is 0, make it face right
            if (delta.x === 0 && delta.y === 0) delta.x = 1;
            // Remove the lesser component
            if (Math.abs(delta.x) > Math.abs(delta.y)) {
                delta.y = 0;
            } else {
                delta.x = 0;
            }
            // Convert it to a unit vector
            delta._unit();

            drawConnectionLine(
                ctx,
                socketCoords,
                socket.direction,
                mouseCoords,
                delta.mult(-1),
            );
        }

        const renderEndTime = performance.now();
        const renderDuration = renderEndTime - renderStartTime;

        this.renderDebug(
            this.stateManager.currentState.name,
            "Render: " + getMsAndFPS(renderDuration),
        );
    }

    drawConnections() {
        const ctx = this.canvas.ctx;

        const sockets = this.entityManager
            .getActiveEntities()
            .filter((entity) => entity.name === SOCKET_ENTITY_NAME) as Socket[];
        const outputSockets = sockets.filter(
            (socket) => socket.ioType === "output",
        );
        const connectedSockets = outputSockets.filter(
            (socket) => socket.output !== undefined,
        );

        connectedSockets.forEach((socketOut) => {
            const socketIn = socketOut.output as Socket;

            const socketOutCoords = socketOut.getBoundingRect().getCenter();
            const socketInCoords = socketIn.getBoundingRect().getCenter();

            drawConnectionLine(
                ctx,
                socketOutCoords,
                socketOut.direction,
                socketInCoords,
                socketIn.direction,
            );
        });
    }

    renderDebug(...data: string[]) {
        const ctx = this.canvas.ctx;
        ctx.setTransform(1, 0, 0, 1, 0, 0); // identity matrix

        // Debug
        ctx.font = "bold 20px monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "hanging";

        // Calculate dimensions of the debug box
        const debugBoxHeight = data.length * 20 + 20;
        const maxLineWidth = Math.max(
            ...data.map((line) => ctx.measureText(line).width),
        );
        const debugBoxWidth = maxLineWidth + 20;

        // Draw the debug box
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, debugBoxWidth, debugBoxHeight);

        ctx.fillStyle = Colors.ficsitOrange.string();

        // Actually render the strings
        for (let i = 0; i < data.length; ++i) {
            ctx.fillText(data[i], 10, (i + 0.5) * 20);
        }
    }
}

const app = new App();
app.render();
