import Point from "@mapbox/point-geometry";
import { type App } from "./main";
import {
    IdleState,
    PanningState,
    RelocatingState,
    SelectingState,
    SelectionState,
    StateFactory,
} from "./state";
import { StateManager, TransitionTable } from "./stateManager";
import { getButton, modPoint, mouseCoordsAsPoint, Rectangle } from "./utils";
import { EntityManager } from "./entity/entity";

const myTransitionTable = {
    idle: {
        mousedown_lmb: (state: IdleState, event: MouseEvent, app: App) => {
            const mouseCoords = mouseCoordsAsPoint(event);
            const mouseWorldCoords = app.canvasPointToWorldPoint(mouseCoords);
            const selectingState =
                StateFactory.createSelectingState(mouseWorldCoords);
            app.stateManager.transition(selectingState);
        },
        // Middle mouse button - panning state
        mousedown_mmb: (state: IdleState, event: MouseEvent, app: App) => {
            const mouseCoords = mouseCoordsAsPoint(event);
            const panningState = StateFactory.createPanningState(
                mouseCoords,
                state,
            );
            app.stateManager.transition(panningState);
        },
        scroll: (state: IdleState, event: WheelEvent, app: App) => {
            simpleScroll(event, app);
        },
        zoom: (state: IdleState, event: WheelEvent, app: App) => {
            simpleZoom(event, app);
        },
    },
    selecting: {
        mousemove: (state: SelectingState, event: MouseEvent, app: App) => {
            const mouseCoords = mouseCoordsAsPoint(event);
            const mouseWorldCoords = app.canvasPointToWorldPoint(mouseCoords);
            state.endCoords = mouseWorldCoords;
            app.render();
        },
        mouseup: (state: SelectingState, event: MouseEvent, app: App) => {
            // Get selected entities
            const selectionRect = Rectangle.fromTwoPoints(
                state.startCoords,
                state.endCoords,
            );
            const entitiesCaughtInSelection =
                app.entityManager.getEntitiesIntersecting(selectionRect);

            // Nothing in the selection box - transition to idle
            if (entitiesCaughtInSelection.length === 0) {
                app.stateManager.transition(StateFactory.createIdleState());
                app.render();
                return;
            }

            // Something in the selection box - transition to selection
            const selectedIds = entitiesCaughtInSelection.map(
                (entity) => entity.id,
            );
            const selectionState =
                StateFactory.createSelectionState(selectedIds);
            app.stateManager.transition(selectionState);

            app.render();
        },
        scroll: (state: SelectingState, event: WheelEvent, app: App) => {
            simpleScroll(event, app);

            // Update the selection box
            const mouseCoords = mouseCoordsAsPoint(event);
            const mouseWorldCoords = app.canvasPointToWorldPoint(mouseCoords);
            state.endCoords = mouseWorldCoords;

            app.render();
        },
        zoom: (state: SelectingState, event: WheelEvent, app: App) => {
            simpleZoom(event, app);

            // Update the selection box
            const mouseCoords = mouseCoordsAsPoint(event);
            const mouseWorldCoords = app.canvasPointToWorldPoint(mouseCoords);
            state.endCoords = mouseWorldCoords;

            app.render();
        },
    },
    selection: {
        mousedown_lmb: (state: SelectionState, event: MouseEvent, app: App) => {
            // Get the bounding rect over the selection
            const selectedEntities = Array.from(state.selectedIds).map((id) =>
                app.entityManager.getEntity(id),
            );
            const selectionUnionRect =
                EntityManager.getMergedBounds(selectedEntities);

            const mouseCoords = mouseCoordsAsPoint(event);
            const mouseWorldCoords = app.canvasPointToWorldPoint(mouseCoords);

            // Mouse pressed over selection - move it
            if (selectionUnionRect.containsPoint(mouseWorldCoords)) {
                const selectionCoords = app.entityManager
                    .getEntities(state.selectedIds)
                    .map((entity) => entity.coords);
                const relocatingState = StateFactory.createRelocatingState(
                    state.selectedIds,
                    selectionCoords,
                    mouseWorldCoords,
                );
                app.stateManager.transition(relocatingState);
                app.render();
            }
            // outside selection - transition to selecting
            else {
                const selectingState =
                    StateFactory.createSelectingState(mouseWorldCoords);
                app.stateManager.transition(selectingState);
                app.render();
            }
        },
        mousedown_mmb: (state: SelectionState, event: MouseEvent, app: App) => {
            const mouseCoords = mouseCoordsAsPoint(event);
            const panningState = StateFactory.createPanningState(
                mouseCoords,
                state,
            );
            app.stateManager.transition(panningState);
        },
        scroll: (state: SelectionState, event: WheelEvent, app: App) => {
            simpleScroll(event, app);
        },
        zoom: (state: SelectionState, event: WheelEvent, app: App) => {
            simpleZoom(event, app);
        },
    },
    relocating: {
        mousemove: (state: RelocatingState, event: MouseEvent, app: App) => {
            const mouseCoords = mouseCoordsAsPoint(event);
            const mouseWorldCoords = app.canvasPointToWorldPoint(mouseCoords);

            // Update positions of selected entities
            const selectedEntities = app.entityManager.getEntities(
                state.selectedIds,
            );
            const displacement = mouseWorldCoords.sub(state.startMouseCoords);
            const snappedDisplacement = modPoint(displacement, 2);
            selectedEntities.forEach((entity, index) => {
                entity.coords =
                    state.selectedEntityCoords[index].add(snappedDisplacement);
            });

            app.render();
        },
        mouseup: (state: RelocatingState, event: MouseEvent, app: App) => {
            const selectionState = StateFactory.createSelectionState(
                state.selectedIds,
            );
            app.stateManager.transition(selectionState);

            app.render();
        },
        scroll: (state: SelectionState, event: WheelEvent, app: App) => {
            simpleScroll(event, app);
        },
        zoom: (state: SelectionState, event: WheelEvent, app: App) => {
            simpleZoom(event, app);
        },
    },
    panning: {
        mousemove: (state: PanningState, event: MouseEvent, app: App) => {
            const mouseCoords = mouseCoordsAsPoint(event);
            const translationPx = mouseCoords.sub(state.startCoords);

            state.startCoords = mouseCoords;

            app.translateBy(translationPx);
        },
        mouseup: (state: PanningState, event: MouseEvent, app: App) => {
            // Exit panning, go back to the previous state
            app.stateManager.transition(state.previousState);

            app.render();
        },
        zoom: (state: PanningState, event: WheelEvent, app: App) => {
            simpleZoom(event, app);
        },
    },
} as TransitionTable;

// --- Common Functions

export function simpleScroll(event: WheelEvent, app: App) {
    // Translation
    const translationPx = new Point(-event.deltaX, -event.deltaY);
    app.translateBy(translationPx);

    // Prevent the browser's default zoom action
    event.preventDefault();
    event.stopPropagation();
}

export function simpleZoom(event: WheelEvent, app: App) {
    // Exponential zoom
    const ZOOM_INTENSITY = 0.0075;
    const delta = -event.deltaY;
    const newScale = app.scale * Math.exp(delta * ZOOM_INTENSITY);
    const canvasPoint = new Point(event.offsetX, event.offsetY);
    app.scaleFromPoint(newScale, canvasPoint);

    // Prevent the browser's default zoom action
    event.preventDefault();
    event.stopPropagation();
}

export function setupStateManagement(app: App) {
    // Set up state manager
    app.stateManager = new StateManager(
        myTransitionTable,
        StateFactory.createIdleState(),
    );

    // Set up transition trigger listeners

    // export type EventName =
    //     | "mousedown_lmb"
    //     | "mousedown_mmb"
    //     | "mousedown_rmb"
    //     | "mouseenter"
    //     | "mouseleave"
    //     | "mousemove"
    //     | "mouseup"
    //     | "scroll"
    //     | "zoom";

    // mousedown - lmb, mmb, rmb
    app.canvas.canvasElement.addEventListener("mousedown", (event) => {
        const button = getButton(event);
        if (button === "LMB")
            app.stateManager.triggerEvent("mousedown_lmb", event, app);
        else if (button === "MMB")
            app.stateManager.triggerEvent("mousedown_mmb", event, app);
        else if (button === "RMB")
            app.stateManager.triggerEvent("mousedown_rmb", event, app);
    });
    // mouseenter
    app.canvas.canvasElement.addEventListener("mouseenter", (event) => {
        app.stateManager.triggerEvent("mouseenter", event, app);
    });
    // mouseleave
    app.canvas.canvasElement.addEventListener("mouseleave", (event) => {
        app.stateManager.triggerEvent("mouseleave", event, app);
    });
    // mousemove
    app.canvas.canvasElement.addEventListener("mousemove", (event) => {
        app.stateManager.triggerEvent("mousemove", event, app);
    });
    // mouseup
    app.canvas.canvasElement.addEventListener("mouseup", (event) => {
        app.stateManager.triggerEvent("mouseup", event, app);
    });
    // scroll / zoom
    app.canvas.canvasElement.addEventListener("wheel", (event) => {
        // Zooming in (touchpad gesture / ctrl+wheel) triggers ctrlKey
        if (event.ctrlKey) {
            app.stateManager.triggerEvent("zoom", event, app);
        } else {
            app.stateManager.triggerEvent("scroll", event, app);
        }
    });
}
