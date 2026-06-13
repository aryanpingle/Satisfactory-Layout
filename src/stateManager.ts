import { create } from "zustand";
import { EventName, State, StateFactory, StateName } from "./state";

export type TransitionCallback = (state: State, ...args: any[]) => void;

export type TransitionTable = Partial<
    Record<StateName, Partial<Record<EventName, TransitionCallback>>>
>;

export const store = create<{
    currentState: State;
    transitionTable: TransitionTable;
    setTransitionTable: (t: TransitionTable) => void;
    triggerEvent: (eventName: EventName, ...args: any[]) => void;
    transition: (newState: State) => void;
}>((set, get) => ({
    currentState: StateFactory.createIdleState(),
    transitionTable: {},
    setTransitionTable: (t) => set({ transitionTable: t }),
    triggerEvent: (eventName, ...args) => {
        const obj = get();
        const stateName = obj.currentState.name;

        const stateTransitions = obj.transitionTable[stateName];
        if (stateTransitions === undefined) return;

        const transitionCallback = stateTransitions[eventName];
        if (transitionCallback === undefined) return;

        transitionCallback(obj.currentState, ...args);
    },
    transition: (newState) => set({ currentState: newState }),
}));

export class StateManager {
    currentState: State;
    transitionTable: TransitionTable;

    constructor(transitionTable: TransitionTable, initialState: State) {
        this.transitionTable = transitionTable;
        this.currentState = initialState;

        // For refactoring to zustand:
        store.getState().setTransitionTable(transitionTable); // Assume idle state is initial (for convenience)
    }

    /**
     * Initiate the transition callback from the current state in response to
     * an event.
     *
     * The callback will receive the current state and any arguments passed to
     * `triggerEvent`.
     */
    triggerEvent(eventName: EventName, ...args: any[]) {
        const stateName = this.currentState.name;

        const stateTransitions = this.transitionTable[stateName];

        if (stateTransitions === undefined) {
            // throw new Error(
            //     `State '${stateName}' not found in transition table.`
            // );
            return;
        }

        const transitionCallback = stateTransitions[eventName];

        if (transitionCallback === undefined) {
            // throw new Error(
            //     `State '${stateName}' does not have a transition for event '${eventName}'.`
            // );
            return;
        }

        transitionCallback(this.currentState, ...args);
    }

    transition(newState: State) {
        this.currentState = newState;

        // For refactoring to zustand:
        store.getState().transition(newState);
    }
}
