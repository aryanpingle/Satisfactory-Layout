import Point from "@mapbox/point-geometry";
import { type App } from "./main";
import { IdleState, SelectingState, StateFactory } from "./state";
import { StateManager, TransitionTable } from "./stateManager";
import { getButton, mouseCoordsAsPoint, Rectangle } from "./utils";

const myTransitionTable = {
    idle: {
        mousedown_lmb: (state: IdleState, event: MouseEvent, app: App) => {
            const mouseCoords = mouseCoordsAsPoint(event);
            const mouseWorldCoords = app.canvasPointToWorldPoint(mouseCoords);
            const selectingState =
                StateFactory.createSelectingState(mouseWorldCoords);
            app.stateManager.transition(selectingState);
        },
        scroll: (state: IdleState, event: WheelEvent, app: App) => {
            // Translation
            const translationPx = new Point(-event.deltaX, -event.deltaY);
            app.translate(translationPx);

            // Prevent the browser's default zoom action
            event.preventDefault();
            event.stopPropagation();
        },
        zoom: (state: IdleState, event: WheelEvent, app: App) => {
            // Exponential zoom
            const ZOOM_INTENSITY = 0.0075;
            const delta = -event.deltaY;
            const newScale = app.scale * Math.exp(delta * ZOOM_INTENSITY);
            const canvasPoint = new Point(event.offsetX, event.offsetY);
            app.scaleFromPoint(newScale, canvasPoint);

            // Prevent the browser's default zoom action
            event.preventDefault();
            event.stopPropagation();
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
                state.endCoords
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
                (entity) => entity.id
            );
            const selectionState = StateFactory.createSelectionState(
                new Set(selectedIds)
            );
            app.stateManager.transition(selectionState);

            app.render();
        },
    },
} as TransitionTable;

export function setupStateManagement(app: App) {
    // Set up state manager
    app.stateManager = new StateManager(
        myTransitionTable,
        StateFactory.createIdleState()
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
