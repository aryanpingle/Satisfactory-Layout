import "./style.css";
import Point from "@mapbox/point-geometry";
import { Rectangle, snap } from "./utils";
import { Canvas } from "./canvas";
import { TestEntity } from "./entity/tester";
import { EntityManager } from "./entity";
import { StateManager } from "./stateManager";
import { setupStateManagement } from "./events";

const FOUNDATION_SIZE = 8;

export class App {
    canvas: Canvas;
    // Will be initialized in events.ts
    stateManager: StateManager = null as any;
    entityManager: EntityManager;

    // Ensures that 512px on the canvas = 10 foundations = 80m
    scale: number = 512 / 10 / FOUNDATION_SIZE;
    /** The translation of the visible world space in pixels. */
    translation: Point;

    constructor() {
        const canvasElement = document.querySelector(
            "#canvas",
        ) as HTMLCanvasElement;
        this.canvas = new Canvas(canvasElement);

        setupStateManagement(this);

        this.entityManager = new EntityManager();

        // Center the world-space (0, 0) in the canvas
        this.translation = new Point(
            this.canvas.width / 2,
            this.canvas.height / 2,
        );

        // Load test entities
        // TODO: BRUH put this shit in the EntityManager or smth
        const ref1 = new TestEntity(this.entityManager);
        ref1.coords.x = -8;
        ref1.coords.y = -8;
        const ref2 = new TestEntity(this.entityManager);
        ref2.coords.x = 8;
        ref2.coords.y = 8;
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
        const ctx = this.canvas.ctx;
        let state = this.stateManager.currentState;
        if (state.name === "selecting") {
            ctx.fillStyle = "rgba(0, 191, 255, 0.1)";
            ctx.lineWidth = 0.2;
            ctx.strokeStyle = "rgb(0, 191, 255)";

            // Highlight intersecting entities
            const selectionRect = Rectangle.fromTwoPoints(
                state.startCoords,
                state.endCoords,
            );
            const entitiesCaughtInSelection =
                app.entityManager.getEntitiesIntersecting(selectionRect);

            entitiesCaughtInSelection.forEach((entity) => {
                const rectCoords = entity.getBoundingRect().xywh();
                ctx.fillRect(...rectCoords);
                ctx.strokeRect(...rectCoords);
            });

            // Draw selection rectangle
            ctx.fillRect(...selectionRect.xywh());
            ctx.strokeRect(...selectionRect.xywh());
        } else if (state.name === "selection" || state.name === "relocating") {
            ctx.fillStyle = "rgba(0, 191, 255, 0.1)";
            ctx.lineWidth = 0.2;
            ctx.strokeStyle = "rgb(0, 191, 255)";

            // Highlight selected entities
            const selected = Array.from(state.selectedIds).map((id) =>
                this.entityManager.getEntity(id),
            );
            const selectionUnionRect = EntityManager.getMergedBounds(selected);
            const selectionUnionXYWH = selectionUnionRect.xywh();
            ctx.fillRect(...selectionUnionXYWH);
            ctx.strokeRect(...selectionUnionXYWH);
        }

        this.debugState();
    }

    debugState() {
        const ctx = this.canvas.ctx;
        ctx.setTransform(1, 0, 0, 1, 0, 0); // identity matrix
        ctx.font = "bold 20px monospace";
        ctx.fillStyle = "crimson";
        ctx.fillText(
            this.stateManager.currentState.name,
            this.canvas.width / 2,
            20,
        );
    }
}

const app = new App();
app.render();
