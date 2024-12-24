import { EventName, State, StateName } from "./state";

export type TransitionCallback = (state: State, ...args: any[]) => void;

export type TransitionTable = Partial<
    Record<StateName, Partial<Record<EventName, TransitionCallback>>>
>;

export class StateManager {
    currentState: State;
    transitionTable: TransitionTable;

    constructor(transitionTable: TransitionTable, initialState: State) {
        this.transitionTable = transitionTable;
        this.currentState = initialState;
    }

    // TODO: Remove?
    // registerTransition(
    //     stateName: StateName,
    //     eventName: EventName,
    //     callback: TransitionCallback
    // ) {
    //     if (!(stateName in this.transitionTable)) {
    //         this.transitionTable[stateName] = {};
    //     }

    //     const stateTransitions = this.transitionTable[stateName]!;

    //     if (eventName in stateTransitions) {
    //         throw new Error(
    //             `State '${stateName}' already has a transition for event ${eventName}`
    //         );
    //     }

    //     stateTransitions[eventName] = callback;
    // }

    /**
     * Initiate the transition callback from the current state in response to
     * an event.
     *
     * The callback will receive the current state and any arguments passed to
     * `triggerEvent`.
     */
    triggerEvent(eventName: EventName, ...args: any[]) {
        const stateName = this.currentState.name;

        const stateTransitions = this.transitionTable[stateName as StateName];

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
    }
}
