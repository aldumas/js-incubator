//TODO set this up with testing.
//TODO Change back to using private variables.

// This state machine implementation executes the user callbacks in the message
// queue instead of synchronously to avoid scenarios where the callback invokes
// state changes in the FSM while user functions from previous states are still
// on the call stack.
// There are 3 types of callbacks that can be specified:
// 1. entry: Called immediately after the state has been entered.
// 2. exit: Called immediately before leaving the state.
// 3. action: Called while changing the state, after exit if exit exists and
//      before entry if entry exists.

// See createMachine() to create FSMs using this as the prototype.
let fsm = {
    start: 'START',
    end: 'END',
    pass: "Some value, any type, even undefined",
    options: {
        ignoreUnexpectedEvents: false
    },

    // The specification for the machine. Here's the default specification as an example.
    spec: {
        // The keys in this object are the state names.
        START: {
            entry: pass => console.log("Optional. Called immediately after entering a state. Argument is pass. " + pass),
            exit: pass => console.log("Optional. Called immediately before leaving a state.  Argument is pass. " + pass),
            transitions: {
                // The keys in this object are the event names.
                EXAMPLE_EVENT: {
                    state: "SOME_NEXT_STATE",
                    action: (pass, exampleArg) => console.log(
                        "Optional. Called while transitioning from one state " +
                        "the next state in response to an event. Any " +
                        "arguments after the event name given to postEvent() " +
                        "are passed into this callback after the pass argument: " + pass + " " + exampleArg),
                },
            }
        },
        SOME_NEXT_STATE: {
            transitions: {
                OK_EXAMPLE_OVER: {
                    state: "END",
                    action: pass => console.log(
                        "The end state does not need its own entry in spec " +
                        "unless you need to execute an entry action. " + pass)
                }
            }
        }
    },

    /* Queues the start event, which places the state machine in the start
     * state, invoking an "entry" callback, if provided.
     *
     * Calling postStart() after the machine has already started resets the
     * machine back to the start state, calling the entry action for the
     * start state if one was specified.

     * Returns a Promise.
     */
    postStart() {
        return this.postEvent(null);
    },

    /* Queues an event with the given arguments. The arguments will be passed
     * to an action callback, if provided.
     * Returns a Promise.
     */
    postEvent(event, ...eventArgs) {
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
                        return this._handleUnexpectedEvent(event, resolve, reject);
                    }

                    next_state = this.start;
                } else if (event == null) {
                        // Machine reset is being requested.
                        next_state = this.start;
                } else {
                    if (!this.state.spec.transitions.hasOwnProperty(event)) {
                        return this._handleUnexpectedEvent(event, resolve, reject);
                    }

                    callOptionalFn(this.state.spec.exit, this.pass);

                    let transition = this.state.spec.transitions[event];

                    callOptionalFn(transition.action, this.pass, eventArgs);

                    next_state = transition.state;
                }

                if (this.spec.hasOwnProperty(next_state)) {
                    this.state = {
                        name: next_state,
                        spec: this.spec[next_state]
                    };
                    callOptionalFn(this.state.spec.entry, this.pass);
                } else if (next_state != this.end) { // end is optional
                    // this can happen if the caller modifies the state machine
                    reject(fsmError(this.state, `invalid next state ${next_state} encountered while processing event '${event}' in state ${this.state.name}`));
                    return;
                }

                resolve();
            }, 0);
        });
    },

    _handleUnexpectedEvent(event, resolve, reject) {
        if (this.options.ignoreUnexpectedEvents) {
            resolve();
        } else {
            reject(fsmError(this.state, `unexpected event ${event}`));
        }
    }
};

/**
 * Create a finite state machine from a specification.
 * 
 * @param {Object} [config] - Machine configuration.
 * @param {Object} [config.spec={...}] - Specification of the FSM. See the fsm
 * object's default spec for an example. If not provided, the default spec is
 * used.
 * @param {Object} [config.pass] - User-defined value that is passed to entry,
 * exit, and action callbacks as the first argument. This value is never read
 * or modified by the FSM.
 * @param {string} [config.start=START] - Name of the start state.
 * @param {string} [config.end=END] - Name of the end state.
 * @param {Object} [config.options] - Options.
 * @param {bool} [config.options.ignoreUnexpectedEvents=false] - Ignore
 * events received prior to machine start or while in a state which does not
 * have an entry for the event in its transitions object.
 */
export function createMachine(config) {
    let machine = Object.create(fsm);

    let {spec, pass, start, end, options} = config;
    spec = spec || machine.spec;
    start = start || "START";
    end = end || "END";
    options = options || {};

    // This checks the FSM for errors on initialization, but if the caller
    // changes the FSM while it is running, those errors are discovered
    // later.
    throwErrorOnInvalidFsmSpec(spec, start, end);

    // This is the only data that changes during the execution of the machine.
    // Each machine needs its own values, so it must be set on this machine
    // object; otherwise the corresponding values in the prototype FSM would
    // be changed during the execution of this machine.
    let state = null;

    return Object.assign(machine, {spec, start, end, pass, options, state});
}

export function runDemo() {
    let demo = createMachine({
        //start - use default
        //end   - use default
        //spec  - use default; see fsm.spec
        //pass  - use default
        //options - use default
    });

    demo.postStart(); // must be called to start or reset the machine.
    demo.postEvent("EXAMPLE_EVENT", "An example argument.");
}

// Helpers /////////////////////////////////////////////////////////////////////

/* Calls the given function with the given args if the function exists.
 */
function callOptionalFn(fn, pass, args) {
    if (fn) {
        fn(pass, args);
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

function fsmError(state, message) {
    let error = new Error(message);
    error.name = `FiniteStateMachine [STATE: ${state == null ? '<Not started>' : state.name}]`;
    error.state = state;
    return error;
}
