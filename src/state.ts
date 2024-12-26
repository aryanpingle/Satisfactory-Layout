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
    | "zoom";

export class StateFactory {
    static createIdleState(): IdleState {
        return {
            name: "idle",
        };
    }

    static createSelectingState(coords: Point): SelectingState {
        return {
            name: "selecting",
            startCoords: coords,
            endCoords: coords,
        };
    }

    static createSelectionState(selection: EntityId[]): SelectionState {
        return {
            name: "selection",
            selectedIds: selection,
        };
    }

    static createRelocatingState(
        selection: EntityId[],
        selectionCoords: Point[],
        coords: Point,
    ): RelocatingState {
        return {
            name: "relocating",
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
            name: "panning",
            startCoords: coords,
            previousState: currentState,
        };
    }

    static createConnectionState(
        socket: Socket,
        mouseCoords: Point,
    ): ConnectionState {
        return {
            name: "connection",
            socket: socket,
            mouseCoords: mouseCoords,
        };
    }
}

export interface IdleState {
    name: "idle";
}

export interface SelectingState {
    name: "selecting";
    startCoords: Point;
    endCoords: Point;
}

export interface SelectionState {
    name: "selection";
    selectedIds: EntityId[];
}

export interface RelocatingState {
    name: "relocating";
    selectedIds: EntityId[];
    selectedEntityCoords: Point[];
    startMouseCoords: Point;
}

export interface PanningState {
    name: "panning";
    startCoords: Point;
    previousState: State;
}

export interface ConnectionState {
    name: "connection";
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

export type StateName = State["name"];
