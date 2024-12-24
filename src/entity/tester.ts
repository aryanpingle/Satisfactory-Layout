import { Canvas } from "../canvas";
import { Entity, EntityManager, EntityName } from "../entity";

export interface TestEntityParams {
    manager: EntityManager;
}

export class TestEntity extends Entity {
    name: EntityName = "TestEntity";
    moveable: boolean = true;
    width: number = 8;
    height: number = 8;

    constructor(manager: EntityManager) {
        super(manager);
    }

    render(canvas: Canvas): void {
        const ctx = canvas.ctx;

        ctx.fillStyle = "crimson";
        ctx.fillRect(
            this.coords.x - this.width / 2,
            this.coords.y - this.height / 2,
            this.width,
            this.height,
        );
    }
}
