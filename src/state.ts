import Point from "@mapbox/point-geometry";
import { EntityId } from "./entity/entity";
import { Socket } from "./entity/socket";

export type EventName =
    | "keypress"
    | "mousedown_lmb"
    | "mousedown_mmb"
    | "mousedown_rmb"
    | "mouseenter"
    | "mouseleave"
    | "mousemove"
    | "mouseup"
    | "scroll"
    | "zoom"
    | "keydown";

export enum StateName {
    IDLE = "idle",
    SELECTING = "selecting",
    SELECTION = "selection",
    RELOCATING = "relocating",
    PANNING = "panning",
    CONNECTION = "connection",
}

export interface IdleState {
    name: StateName.IDLE;
}

export interface SelectingState {
    name: StateName.SELECTING;
    startCoords: Point;
    endCoords: Point;
}

export interface SelectionState {
    name: StateName.SELECTION;
    selectedIds: EntityId[];
}

export interface RelocatingState {
    name: StateName.RELOCATING;
    selectedIds: EntityId[];
    selectedEntityCoords: Point[];
    startMouseCoords: Point;
}

export interface PanningState {
    name: StateName.PANNING;
    startCoords: Point;
    previousState: State;
}

export interface ConnectionState {
    name: StateName.CONNECTION;
    socket: Socket;
    mouseCoords: Point;
}

export type State =
    | IdleState
    | SelectingState
    | SelectionState
    | RelocatingState
    | PanningState
    | ConnectionState;

export class StateFactory {
    static createIdleState(): IdleState {
        return {
            name: StateName.IDLE,
        };
    }

    static createSelectingState(coords: Point): SelectingState {
        return {
            name: StateName.SELECTING,
            startCoords: coords,
            endCoords: coords,
        };
    }

    static createSelectionState(selection: EntityId[]): SelectionState {
        return {
            name: StateName.SELECTION,
            selectedIds: selection,
        };
    }

    static createRelocatingState(
        selection: EntityId[],
        selectionCoords: Point[],
        coords: Point,
    ): RelocatingState {
        return {
            name: StateName.RELOCATING,
            selectedIds: selection,
            selectedEntityCoords: selectionCoords,
            startMouseCoords: coords,
        };
    }

    static createPanningState(
        coords: Point,
        currentState: State,
    ): PanningState {
        return {
            name: StateName.PANNING,
            startCoords: coords,
            previousState: currentState,
        };
    }

    static createConnectionState(
        socket: Socket,
        mouseCoords: Point,
    ): ConnectionState {
        return {
            name: StateName.CONNECTION,
            socket: socket,
            mouseCoords: mouseCoords,
        };
    }
}
