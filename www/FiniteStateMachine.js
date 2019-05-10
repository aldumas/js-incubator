// This state machine implementation executes the user callbacks in the message
// queue instead of synchronously to avoid scenarios where the callback invokes
// state changes in the FSM while user functions from previous states are still
// on the call stack.
// There are 3 types of callbacks that can be specified:
// 1. entry: Called immediately after the state has been entered.
// 2. exit: Called immediately before leaving the state.
// 3. action: Called while changing the state, after exit if exit exists and
//      before entry if entry exists.

//TODO remove class syntax, add Fsm.createMachine().

export class FiniteStateMachine {
    constructor(fsm, start = 'START', end = 'END') {

        // This checks the FSM for errors on initialization, but if the caller
        // changes the FSM while it is running, those errors are discovered
        // later.
        this._throwErrorOnInvalidFsm(fsm, start, end);

        this._start = start;
        this._end = end;

        // The state machine description provided by the user will become the
        // 'this' binding for all callbacks.
        this._fsm = fsm;

        this._state = null;
        this._stateName = null;
    }

    /* Queues the start event, which places the state machine in the start
     * state, invoking an "entry" callback, if provided.
     * Returns a Promise.
     */
    postStart() {
        return this.postEvent(null);
    }

    /* Queues an event with the given arguments. The arguments will be passed
     * to an action callback, if provided.
     * Returns a Promise.
     */
    postEvent(event, ...args) {
        return new Promise((resolve, reject) => {
            // setTimeout just to make this code asynchronous. This is so any
            // methods that end up getting called in the entry, exit, or action
            // functions don't actually try to make a transition while the state
            // machine is in the middle of making one. The current transition
            // will complete and then the message queue will get processed, which
            // will end up processing this event.

            setTimeout(() => {
                let next_state = null;

                if (this._state == null) {
                    if (event != null) {
                        reject(this._fsmError(`received event '${event}' but state machine has not started`));
                        return;
                    }

                    next_state = this._start;
                } else {
                    if (!this._state.transitions.hasOwnProperty(event)) {
                        reject(this._fsmError(`unexpected event '${event}' encountered in state ${this._stateName}`));
                        return;
                    }

                    this._callUserFnIfExists(this._state.exit);

                    let transition = this._state.transitions[event];

                    this._callUserFnIfExists(transition.action, args);

                    next_state = transition.state;
                }

                if (this._fsm.hasOwnProperty(next_state)) {
                    this._state = this._fsm[next_state];
                    this._stateName = next_state;
                    this._callUserFnIfExists(this._state.entry);
                } else if (next_state != this._end) { // end is optional
                    // this can happen if the caller modifies the state machine
                    reject(this._fsmError(`invalid next state ${next_state} encountered while processing event '${event}' in state ${this._stateName}`));
                    return;
                }

                resolve();
            }, 0);
        });
    }

    /* Calls the given function with the given args, setting the user-provided
     * fsm object as the "this" value.
     */
    _callUserFnIfExists(fn, args) {
        if (fn) {
            fn.apply(this._fsm, args);
        }
    }

    _throwErrorOnInvalidFsm(fsm, start, end) {
        let { ok, errMsg } = this._validateFsm(fsm, start, end);
        if (!ok) {
            throw this._fsmError(errMsg);
        }
    }

    _validateFsm(fsm, start, end) {
        let ok = true, errMsg = "";

        let nextStates = this._allNextStates(fsm);

        // end is optional; ok if already present
        let validStates = Object.keys(fsm).concat(end);

        let invalidStates = nextStates.filter(state => validStates.indexOf(state) < 0);

        if (validStates.indexOf(start) < 0) {
            ok = false;
            errMsg = `missing start state ${start}`;
        } else if (invalidStates.length > 0) {
            ok = false;
            errMsg = `invalid next state${invalidStates.length > 1 ? 's': ''} -  ${invalidStates.join(', ')}`;
        }

        return {ok, errMsg};
    }

    _allNextStates(fsm) {
        return Object.values(fsm) // state objects
                        .map(stateObj => stateObj.transitions)
                        .filter(transition => typeof transition === "object" &&
                                                transition !== null)
                        // [
                        //     {event1: {state}, event2: {state}, ...},
                        //     {event3: {state}, ...}
                        // ]
                        .map(transition => Object.values(transition)
                            .map(eventObj => eventObj.state))
                        // [
                        //     [state, state, ...],
                        //     [state]
                        // ]
                        .flat()
                        // remove duplicates
                        .filter((() => {
                            let stateSet = {};
                            return (state) => {
                                let exists = stateSet.hasOwnProperty(state);
                                stateSet[state] = true;
                                return !exists;
                            };
                        })());
    }

    /* Returns a standard formatted Error object */
    _fsmError(message) {
        let error = new Error(message);
        error.name = "FiniteStateMachine";
        return error;
    }
}
