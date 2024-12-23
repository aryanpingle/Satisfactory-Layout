export class Canvas {
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
            options,
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
