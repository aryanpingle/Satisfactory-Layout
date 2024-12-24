import Point from "@mapbox/point-geometry";
import { Rectangle } from "./utils";

export type StateName =
    | "idle"
    | "selecting"
    | "selection"
    | "moving"
    | "panning"
    | "buffer";

interface BaseState {
    name: StateName;
    enter(): void;
    exit(): void;
}

export abstract class StateManager {
    abstract currentState: BaseState;

    transitionState(nextState: BaseState) {
        this.currentState.exit();
        nextState.enter();
        this.currentState = nextState;
    }
}

// State implementations

export class IdleState implements BaseState {
    name: StateName = "idle";

    constructor() {}

    enter(): void {}
    exit(): void {}
}

/**
 * When the user is dragging their mouse with LMB to select one or more items.
 */
export class SelectingState implements BaseState {
    name: StateName = "selecting";

    startCoords: Point;
    endCoords: Point;

    constructor(startCoords: Point) {
        this.startCoords = startCoords;
        this.endCoords = startCoords;
    }

    enter(): void {}
    exit(): void {}

    getBoundingRect(): Rectangle {
        return Rectangle.fromTwoPoints(this.startCoords, this.endCoords);
    }
}

/**
 * When the user is dragging their mouse with LMB to select one or more items.
 */
export class SelectionState implements BaseState {
    name: StateName = "selection";

    selection: Set<number>;

    constructor(selection: Set<number>) {
        this.selection = selection;
    }

    enter(): void {}
    exit(): void {}
}

/**
 * When the user is dragging their mouse with LMB to select one or more items.
 */
export class MovingState implements BaseState {
    name: StateName = "selection";

    selection: Set<number>;

    constructor(selection: Set<number>) {
        this.selection = selection;
    }

    enter(): void {}
    exit(): void {}
}
