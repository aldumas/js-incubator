// This state machine implementation executes the user callbacks in the message
// queue instead of synchronously to avoid scenarios where the callback invokes
// state changes in the FSM while user functions from previous states are still
// on the call stack.
// There are 3 types of callbacks that can be specified:
// 1. entry: Called immediately after the state has been entered.
// 2. exit: Called immediately before leaving the state.
// 3. action: Called while changing the state, after exit if exit exists and
//      before entry if entry exists.

export class FiniteStateMachine {
    constructor(spec, start = 'START', end = 'END') {

        // This checks the FSM for errors on initialization, but if the caller
        // changes the FSM while it is running, those errors are discovered
        // later.
        throwErrorOnInvalidFsmSpec(spec, start, end);

        this.start = start;
        this.end = end;

        // The state machine description provided by the user will become the
        // 'this' binding for all callbacks.
        this.spec = spec;

        this.state = null;
        this.stateName = null;
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

                if (this.state == null) {
                    if (event != null) {
                        reject(fsmError(`received event '${event}' but state machine has not started`));
                        return;
                    }

                    next_state = this.start;
                } else {
                    if (!this.state.transitions.hasOwnProperty(event)) {
                        reject(fsmError(`unexpected event '${event}' encountered in state ${this.stateName}`));
                        return;
                    }

                    callFnIfExists(this.state.exit, this.spec);

                    let transition = this.state.transitions[event];

                    callFnIfExists(transition.action, this.spec, args);

                    next_state = transition.state;
                }

                if (this.spec.hasOwnProperty(next_state)) {
                    this.state = this.spec[next_state];
                    this.stateName = next_state;
                    callFnIfExists(this.state.entry, this.spec);
                } else if (next_state != this.end) { // end is optional
                    // this can happen if the caller modifies the state machine
                    reject(fsmError(`invalid next state ${next_state} encountered while processing event '${event}' in state ${this.stateName}`));
                    return;
                }

                resolve();
            }, 0);
        });
    }
}

/* Calls the given function with the given args, setting the user-provided
 * fsm specification object as the "this" value.
 */
function callFnIfExists(fn, spec, args) {
    if (fn) {
        fn.apply(spec, args);
    }
}

function throwErrorOnInvalidFsmSpec(spec, start, end) {
    let { ok, errMsg } = validateFsm(spec, start, end);
    if (!ok) {
        throw fsmError(errMsg);
    }
}

function validateFsm(spec, start, end) {
    let ok = true, errMsg = "";

    let nextStates = allNextStates(spec);

    // end is optional; ok if already present
    let validStates = Object.keys(spec).concat(end);

    let invalidStates = nextStates.filter(state => validStates.indexOf(state) < 0);

    if (validStates.indexOf(start) < 0) {
        ok = false;
        errMsg = `missing start state ${start}`;
    } else if (invalidStates.length > 0) {
        ok = false;
        errMsg = `invalid next state${invalidStates.length > 1 ? 's' : ''} -  ${invalidStates.join(', ')}`;
    }

    return { ok, errMsg };
}

function allNextStates(spec) {
    return Object.values(spec) // state objects
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

function fsmError(message) {
    let error = new Error(message);
    error.name = "FiniteStateMachine";
    return error;
}
