import Point from "@mapbox/point-geometry";
import { EntityId } from "./entity/entity";

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

export type State =
    | IdleState
    | SelectingState
    | SelectionState
    | RelocatingState
    | PanningState;

export type StateName = State["name"];
