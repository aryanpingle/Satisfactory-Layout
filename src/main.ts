import "./style.css";
import Point from "@mapbox/point-geometry";

const FOUNDATION_SIZE = 8;

class Canvas {
    canvasElement: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    /** Auto-updated width */
    width: number;
    /** Auto-updated height */
    height: number;

    constructor(canvasElement: HTMLCanvasElement) {
        this.canvasElement = canvasElement;

        this.ctx = this.canvasElement.getContext("2d")!;
        this.width = this.canvasElement.width;
        this.height = this.canvasElement.height;

        // Add resize listener to the canvas element
        const options: AddEventListenerOptions = {
            passive: true,
        };
        this.canvasElement.addEventListener(
            "resize",
            () => this.onCanvasResize(),
            options
        );
    }

    onCanvasResize() {
        console.log("canvas resized", this);
        this.width = this.canvasElement.width;
        this.height = this.canvasElement.height;
    }

    // --- UTILITY METHODS

    clear() {
        // Set scale to 1:1
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.width, this.height);
    }
}

enum State {
    IDLE,
    PANNING,
}

class App {
    canvas: Canvas;
    state: State = State.IDLE;

    /**
     * Note:
     * I make sure that scaling zooms in/out into the center of the canvas
     */

    // Ensures that 512px on the canvas = 10 foundations = 80m
    scale: number = 512 / 10 / 8;
    /** The translation of the visible world space in pixels. */
    translation: Point;

    constructor() {
        const canvasElement = document.querySelector(
            "#canvas"
        ) as HTMLCanvasElement;
        this.canvas = new Canvas(canvasElement);

        // Center the world-space (0, 0) in the canvas
        this.translation = new Point(
            this.canvas.width / 2,
            this.canvas.height / 2
        );

        this.setCanvasEventListeners();
    }

    setCanvasEventListeners() {
        // Set event listeners
        this.canvas.canvasElement.onclick = (event) => {
            const canvasPoint = new Point(event.offsetX, event.offsetY);
            const worldPoint = this.canvasPointToWorldPoint(canvasPoint);
            console.log("clicked", worldPoint);
        };
        this.canvas.canvasElement.onmousedown = (event) => {
            const canvasPoint = new Point(event.offsetX, event.offsetY);

            console.log("DOWN");
        };
        this.canvas.canvasElement.onmouseup = (event) => {
            console.log("UP");
        };
        this.canvas.canvasElement.onmouseleave = (event) => {
            console.log("LEFT");
        };
        this.canvas.canvasElement.addEventListener(
            "wheel",
            (event) => {
                // TODO: Exponentially slow down zooming out
                const delta = event.deltaY;
                const canvasPoint = new Point(event.offsetX, event.offsetY);
                console.log(canvasPoint);
                this.scaleFromPoint(this.scale + delta * 0.1, canvasPoint);
            },
            { passive: true }
        );
    }

    /**
     * Rescale the canvas view using a fixed perspective point on the canvas.
     *
     * The old and new world point corresponding to the perspective point will
     * be the same.
     */
    scaleFromPoint(newScale: number, canvasPoint: Point) {
        // Constrain the new scale
        const MAX_SCALE = 100;
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
     * Draw the reference grid with the current stroke style and line width.
     * TODO: Draw only as many lines as needed on screen.
     */
    drawGrid(gridSize: number, strokeStyle: string, lineWidth: number) {
        // On either side
        const NUM_LINES = 10;
        const OVERLAY_SIZE = 20;

        const ctx = this.canvas.ctx;
        // Line style
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        // Label style
        ctx.textAlign = "center";
        ctx.textRendering = "optimizeLegibility";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "white";
        ctx.font = "normal 2px monospace";

        // Horizontal lines
        for (let i = -NUM_LINES; i <= NUM_LINES; ++i) {
            const x1 = -NUM_LINES * gridSize;
            const x2 = +NUM_LINES * gridSize;
            const y = i * gridSize;
            ctx.beginPath();
            ctx.moveTo(x1, y);
            ctx.lineTo(x2, y);
            ctx.stroke();

            // Label
            const worldOverlayPoint = this.canvasPointToWorldPoint(
                new Point(OVERLAY_SIZE / 2, 0)
            );
            ctx.fillText(String(y), worldOverlayPoint.x, y);
        }

        // Vertical lines
        for (let i = -NUM_LINES; i <= NUM_LINES; ++i) {
            const y1 = -NUM_LINES * gridSize;
            const y2 = +NUM_LINES * gridSize;
            const x = i * gridSize;

            ctx.beginPath();
            ctx.moveTo(x, y1);
            ctx.lineTo(x, y2);
            ctx.stroke();

            // Label
            const worldOverlayPoint = this.canvasPointToWorldPoint(
                new Point(0, OVERLAY_SIZE / 2)
            );
            ctx.fillText(String(x), x, worldOverlayPoint.y);
        }
    }

    setWorldSpaceTransform() {
        const ctx = this.canvas.ctx;
        ctx.setTransform(1, 0, 0, 1, 0, 0); // identity matrix
        ctx.translate(this.translation.x, this.translation.y);
        ctx.scale(this.scale, this.scale);
    }

    render() {
        this.canvas.clear();
        this.setWorldSpaceTransform();

        /** Background grid */
        // Every 8m i.e. every foundation
        this.drawGrid(8, "#333", 0.25);
    }
}

const app = new App();
app.render();
