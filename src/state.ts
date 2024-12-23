import Point from "@mapbox/point-geometry";

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

export class StateManager {
    currentState: BaseState;

    constructor() {
        this.currentState = new IdleState();
    }

    transition(nextState: BaseState) {
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

// --- Selecting State

export interface SelectingStateData {
    startingMouseCoords: Point;
}

/**
 * When the user is dragging their mouse with LMB to select one or more items.
 */
export class SelectingState implements BaseState {
    name: StateName = "selecting";

    data: SelectingStateData;

    constructor(data: SelectingStateData) {
        this.data = data;
    }

    enter(): void {}
    exit(): void {}
}

// --- Selection State

export interface SelectionStateData {
    selection: Set<number>;
}

/**
 * When the user is dragging their mouse with LMB to select one or more items.
 */
export class SelectionState implements BaseState {
    name: StateName = "selection";

    data: SelectionStateData;

    constructor(data: SelectionStateData) {
        this.data = data;
    }

    enter(): void {}
    exit(): void {}
}
