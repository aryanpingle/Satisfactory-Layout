import "./style.css";
import Point from "@mapbox/point-geometry";
import {
    assertType,
    getButton,
    mouseCoordsAsPoint,
    RectCoords,
    snap,
} from "./utils";
import { IdleState, SelectingState, StateManager } from "./state";
import { Canvas } from "./canvas";
import { TestEntity } from "./entity/tester";
import { EntityManager } from "./entity";

const FOUNDATION_SIZE = 8;

class App extends StateManager {
    currentState = new IdleState();

    canvas: Canvas;
    entityManager: EntityManager;

    // Ensures that 512px on the canvas = 10 foundations = 80m
    scale: number = 512 / 10 / FOUNDATION_SIZE;
    /** The translation of the visible world space in pixels. */
    translation: Point;

    constructor() {
        super();

        const canvasElement = document.querySelector(
            "#canvas",
        ) as HTMLCanvasElement;
        this.canvas = new Canvas(canvasElement);

        this.entityManager = new EntityManager();

        // Center the world-space (0, 0) in the canvas
        this.translation = new Point(
            this.canvas.width / 2,
            this.canvas.height / 2,
        );

        // Set event listeners
        this.canvas.canvasElement.addEventListener("click", () => {
            // NUTHIN'
            // onClick is not reliable as it registers even after dragging
        });
        this.canvas.canvasElement.addEventListener(
            "mousedown",
            this.onMouseDown.bind(this),
        );
        this.canvas.canvasElement.addEventListener(
            "mouseleave",
            this.onMouseLeave.bind(this),
        );
        this.canvas.canvasElement.addEventListener(
            "mousemove",
            this.onMouseMove.bind(this),
        );
        this.canvas.canvasElement.addEventListener(
            "mouseup",
            this.onMouseUp.bind(this),
        );
        this.canvas.canvasElement.addEventListener(
            "wheel",
            this.onWheel.bind(this),
        );

        // Load test entities
        // TODO: BRUH put this shit in the EntityManager or smth
        const ref1 = new TestEntity(this.entityManager);
        ref1.x = -8;
        ref1.y = -8;
        const ref2 = new TestEntity(this.entityManager);
        ref2.x = 8;
        ref2.y = 8;
    }

    // --- Event Handlers

    onMouseDown(event: MouseEvent) {
        switch (getButton(event)) {
            case "LMB":
                this.onMouseDownLMB(event);
                break;
            case "MMB":
                this.onMouseDownMMB(event);
                break;
            default:
                console.log(
                    `onMouseDown - button ${event.button} not supported`,
                );
                break;
        }
    }

    /**
     * The following actions occur when LMB is down:
     * 1. Selecting multiple objects
     * 2. Moving selected objects
     * 3. TODO: Connecting selected sockets (maybe shift + click?)
     */
    onMouseDownLMB(event: MouseEvent) {
        const state = this.currentState;

        // Idle state - select multiple objects
        if (state.name === "idle") {
            const mouseCoords = mouseCoordsAsPoint(event);
            const mouseWorldCoords = this.canvasPointToWorldPoint(mouseCoords);
            const newState = new SelectingState(mouseWorldCoords);
            this.transitionState(newState);
        }
    }

    onMouseDownMMB(event: MouseEvent) {}

    onMouseLeave(event: MouseEvent) {}

    onMouseMove(event: MouseEvent) {
        // No buttons pressed
        if (event.buttons === 0) {
        }

        switch (getButton(event)) {
            case "LMB":
                this.onMouseMoveLMB(event);
                break;
            case "MMB":
                this.onMouseMoveMMB(event);
                break;
            default:
                console.log(
                    `onMouseMove - button ${event.button} not supported`,
                );
                break;
        }
    }

    onMouseMoveLMB(event: MouseEvent) {
        const state = this.currentState;

        if (state.name === "idle") {
            // Doesn't make sense for the state to be idle
            // LMB is clicked, so it should be in some state
        }
        // Selecting state - update the state with the mouse coords
        else if (state.name === "selecting") {
            const selectingState = assertType<SelectingState>(state);

            const mouseCoords = mouseCoordsAsPoint(event);
            const mouseWorldCoords = this.canvasPointToWorldPoint(mouseCoords);
            selectingState.endCoords = mouseWorldCoords;

            this.render();
        }
    }

    onMouseMoveMMB(event: MouseEvent) {}

    /**
     * Note: I won't be caught DEAD handling multiple simultaneous
     * mouse buttons.
     */
    onMouseUp(event: MouseEvent) {
        const state = this.currentState;

        if (state.name === "idle") {
            // pass
        } else if (state.name === "selecting") {
            // TODO: Transition to selection state
            this.transitionState(new IdleState());

            this.render();
        }
    }

    onWheel(event: WheelEvent) {
        // Zooming in (touchpad gesture / ctrl+wheel) triggers ctrlKey
        if (event.ctrlKey) {
            // Exponential zoom
            const ZOOM_INTENSITY = 0.0075;
            const delta = -event.deltaY;
            const newScale = this.scale * Math.exp(delta * ZOOM_INTENSITY);
            const canvasPoint = new Point(event.offsetX, event.offsetY);
            this.scaleFromPoint(newScale, canvasPoint);

            // Prevent the browser's default zoom action
            event.preventDefault();
            event.stopPropagation();
        }
        // Scrolling up/down (for touchpads, all directions)
        else {
            // Translation
            const translationPx = new Point(-event.deltaX, -event.deltaY);
            this.translate(translationPx);

            // Prevent the browser's default zoom action
            event.preventDefault();
            event.stopPropagation();
        }
    }

    // --- End Event Handlers

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

    translate(delta: Point) {
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
     * TODO: Draw only as many lines as needed on screen.
     */
    drawGrid() {
        // On either side
        const OVERLAY_SIZE = 20;

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
        /** Reset the canvas */
        this.canvas.clear();
        this.setWorldSpaceTransform();

        /** Background grid */
        this.drawGrid();

        /** Render entities */
        this.entityManager.getActiveEntities().forEach((entity) => {
            entity.render(this.canvas);
        });

        // DEBUG: Checking if selection state works fine
        let state = this.currentState;
        if (state.name === "selecting") {
            const selectingState = assertType<SelectingState>(state);

            const ctx = this.canvas.ctx;
            ctx.fillStyle = "rgba(0, 191, 255, 0.1)";
            ctx.lineWidth = 0.2;
            ctx.strokeStyle = "rgb(0, 191, 255)";

            // Highlight selected entities
            const selected = this.entityManager.getEntitiesIntersecting(
                selectingState.startCoords,
                selectingState.endCoords,
            );
            selected.forEach((entity) => {
                const rectCoords: RectCoords = [
                    entity.x - entity.width / 2,
                    entity.y - entity.width / 2,
                    entity.width,
                    entity.height,
                ];
                ctx.fillRect(...rectCoords);
                ctx.strokeRect(...rectCoords);
            });

            // Draw selection rectangle
            ctx.fillRect(...selectingState.asRectCoords());
            ctx.strokeRect(...selectingState.asRectCoords());
        }
    }
}

const app = new App();
app.render();
