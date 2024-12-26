import Point from "@mapbox/point-geometry";
import { Canvas } from "../canvas";
import { Rectangle } from "../utils";

export type EntityId = number;

export type EntityName = "Socket" | "TestEntity" | "IOConstruct" | "Text";

// --- Serialization

export interface EntitySerializedData {
    name: EntityName;
}

// --- Base entity class

export abstract class Entity {
    abstract name: EntityName;
    /** Whether this entity is attached to another entity. */
    abstract attachment: boolean;
    /** Width of the bounding box containing the rendered entity. */
    abstract width: number;
    /** Height of the bounding box containing the rendered entity. */
    abstract height: number;

    coords: Point = new Point(0, 0);

    /** Auto-generated by the Entity Manager */
    id: number = -1;

    manager: EntityManager;

    constructor(manager: EntityManager) {
        this.manager = manager;
        this.manager.registerEntity(this);
    }

    /**
     * Render the entity using the canvas object provided. Assumes scale and
     * translation have been set.
     */
    abstract render(canvas: Canvas): void;

    getBoundingRect(): Rectangle {
        return Rectangle.fromCenter(this.coords, this.width, this.height);
    }

    containsPoint(point: Point): boolean {
        return this.getBoundingRect().containsPoint(point);
    }

    /**
     * Check if the bounding box of this entity intersects with a
     * given rectangle represented by two diagonal points.
     *
     * TODO: Preprocess the parameters so you don't have to max() and min() every time
     */
    intersects(rect: Rectangle): boolean {
        return this.getBoundingRect().intersects(rect);
    }
}

export class EntityManager {
    entities: Entity[] = [];
    /** Functionally similar to `this.entities.length` */
    lastEntityId: number = 0;

    private createEntityId(): number {
        return this.lastEntityId++;
    }

    addEntity(entity: Entity) {
        this.entities.push(entity);
    }

    registerEntity(entity: Entity) {
        entity.id = this.createEntityId();
        this.addEntity(entity);
    }

    getEntity(id: number): Entity {
        if (id < 0 || id >= this.entities.length)
            throw new Error(`Entity with id ${id} does not exist.`);
        return this.entities[id];
    }

    getEntities(ids: Iterable<EntityId>): Entity[] {
        return Array.from(ids).map((id) => this.getEntity(id));
    }

    getActiveEntities(): Entity[] {
        return this.entities.filter((entity) => entity.attachment === false);
    }

    getEntitiesContaining(point: Point): Entity[] {
        const entities = this.getActiveEntities();
        return entities.filter((entity) => entity.containsPoint(point));
    }

    getEntitiesIntersecting(rect: Rectangle): Entity[] {
        const entities = this.getActiveEntities();
        return entities.filter((entity) => entity.intersects(rect));
    }

    // --- Static Methods

    static getMergedBounds(entities: Entity[]): Rectangle {
        return Rectangle.union(
            entities.map((entity) => entity.getBoundingRect()),
        );
    }

    static load(totalEntityData: EntitySerializedData[]) {
        totalEntityData.forEach((entityData) => {
            throw new Error(
                `Entity type '${entityData.name}' loading has not been implemented.`,
            );
        });
    }
}

// --- Entity Implementations