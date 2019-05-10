const DOOR_COUNT = 3;

class LetsMakeADealGame {
    constructor(contestant, func_random) {
        this._func_random = func_random || function(n) {
          return Math.floor(Math.random() * n);
        };
      
        this._contestant = contestant;
        this._initial_choice_door = null;
        this._final_choice_door = null;
        this._revealed_door = null;
        this._prize_door = this._func_random(DOOR_COUNT); //0-based
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
        return this._final_choice_door == this._prize_door;
    }
  
    async run() {
        this._initial_choice_door = await this._contestant.requestFirstGuess(this);
        this._final_choice_door = await this._contestant.requestSecondGuess(this, this._findAGoatDoor(), this._initial_choice_door);
        this._contestant.announceGameOver(this, this.didContestantWin);
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
    requestFirstGuess: async function(game) {
        return new Promise(resolve => {
            let door = 2;
            console.log("First guest requested");
            console.log("X".repeat(game.doorCount));
            console.log("Guessing " + door + " on click");

            let domCallback;
            domCallback = function (event) {
                document.removeEventListener('click', domCallback);
                resolve(door);
            }

            document.addEventListener('click', domCallback);
        });
    },
    requestSecondGuess: async function(game, goat_door, initial_choice_door) {
        return new Promise(resolve => {
            let door = 2;
            console.log("Second guest requested");
            doors = [];
            for (let i = 0; i < game.doorCount; ++i) {
                if (i == initial_choice_door) {
                    doors.push("?");
                } else if (i == goat_door) {
                    doors.push("G");
                } else {
                    doors.push("X")
                }
            }
            console.log(doors.join(''));
            console.log("Guessing " + door + " on click");

            let domCallback;
            domCallback = function (event) {
                document.removeEventListener('click', domCallback);
                resolve(door);
            }

            document.addEventListener('click', domCallback);
        });
    },
    announceGameOver: function(game, didContestantWin) {
        if (didContestantWin) {
            console.log('You won!');
        } else {
            console.log('You lost!');
            console.log('Prize door: ' + game.doorWithPrize);
        }
    }
}

var game = new LetsMakeADealGame(contestant);
console.log("--- STARTING GAME ---");
game.run();