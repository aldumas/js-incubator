import * as fsm from '../node_modules/fsm.js/src/fsm.js';

const DOOR_COUNT = 3;

class LetsMakeADealGameStateMachine {
    constructor(contestant, func_random) {
        this._contestant = contestant;
        this._func_random = func_random || function (n) {
            return Math.floor(Math.random() * n);
        };

        this._initial_choice_door = null;
        this._final_choice_door = null;
        this._revealed_goat_door = null;
        this._prize_door = this._func_random(DOOR_COUNT); //0-based

        this._fsm = fsm.createMachine({
            spec: {
                START: {
                    entry: () => { this._contestant.requestFirstGuess(this); },
                    transitions: {
                        guess: {
                            nextState: "HAVE_INITIAL_GUESS",
                            action: (pass, initial_choice_door) => {
                                this._initial_choice_door = initial_choice_door;
                                this._revealed_goat_door = this._findAGoatDoor();
                                this._contestant.requestSecondGuess(this, this._revealed_goat_door, this._initial_choice_door);
                            }
                        }
                    }
                },
                HAVE_INITIAL_GUESS: {
                    transitions: {
                        guess: {
                            nextState: "END",
                            action: (pass, final_choice_door) => {
                                this._final_choice_door = final_choice_door;
                                this._contestant.announceGameOver(this, this.didContestantWin);
                            }
                        }
                    }
                }
            }
        });
    }

    startGame() {
        return this._fsm.queueStart();
    }

    guess(door) {
        return this._fsm.queueEvent('guess', door);
    }

    get doorCount() {
        return DOOR_COUNT;
    }

    get doorWithPrize() {
        return this._prize_door;
    }

    get isGameFinished() {
        return this._final_choice_door != null;
    }

    get didContestantWin() {
        return this.isGameFinished && this._final_choice_door == this._prize_door;
    }

    _findAGoatDoor() {
        let goat_doors = [];
        for (let i = 0; i < this.doorCount; ++i) {
            if (i != this.doorWithPrize && i != this._initial_choice_door) {
                goat_doors.push(i);
            }
        }
        return goat_doors[this._func_random(goat_doors.length)];
    }
}

let contestant = {
    requestFirstGuess: function (game) {
        let door = 2;
        console.log("First guess requested");
        console.log("X".repeat(game.doorCount));
        console.log("Guessing " + door);

        // in reality, this callback would set up the DOM to show we are ready for the first guess
        // and would set up a callback to listen for the guess. That callback would call game.guess().
        setTimeout(() => {
            game.guess(door);
        }, 0);
    },
    requestSecondGuess: function (game, goat_door) {
        let door = 2;
        console.log("Second guess requested");
        let doors = [];
        for (let i = 0; i < game.doorCount; ++i) {
            if (i == door) {
                doors.push("?");
            } else if (i == goat_door) {
                doors.push("G");
            } else {
                doors.push("X");
            }
        }
        console.log(doors.join(''));
        console.log("Guessing " + door);
        // same note as above

        setTimeout(() => {
            game.guess(door);
        }, 0);
    },
    announceGameOver: function (game, didContestantWin) {
        if (didContestantWin) {
            console.log('You won!');
        } else {
            console.log('You lost!');
            console.log('Prize door: ' + game.doorWithPrize);
        }
    }
};





function run() {
    var game = new LetsMakeADealGameStateMachine(contestant);
    console.log("--- STARTING GAME ---");
    game.startGame();
}

run();
