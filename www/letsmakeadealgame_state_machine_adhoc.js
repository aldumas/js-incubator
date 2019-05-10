const DOOR_COUNT = 3;

const GAME_STATE = Object.freeze({
    NOT_STARTED: "NOT_STARTED",
    WAIT_FIRST_GUESS: "WAIT_FIRST_GUESS",
    WAIT_SECOND_GUESS: "WAIT_SECOND_GUESS",
    FINISHED: "FINISHED"
});

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

        this._state = GAME_STATE.NOT_STARTED;
    }

    get doorCount() {
        return DOOR_COUNT;
    }
  
    get doorWithPrize() {
      return this._prize_door;
    }
  
    get isGameFinished() {
      return this._state == GAME_STATE.FINISHED;
    }

    get didContestantWin() {
        return this._state == GAME_STATE.FINISHED && this._final_choice_door == this._prize_door;
    }
  
    startGame() {
        this._state = GAME_STATE.WAIT_FIRST_GUESS;
        this._contestant.requestFirstGuess(this);
    }
    
    guess(door) {
        switch (this._state) {
        case GAME_STATE.NOT_STARTED:
            console.log("ERROR: Game has not started but a guess was made");
            break;
        case GAME_STATE.WAIT_FIRST_GUESS:
            this._initial_choice_door = door;
            let goat_door = this._findAGoatDoor();
            this._revealed_door = goat_door;

            this._state = GAME_STATE.WAIT_SECOND_GUESS;
            this._contestant.requestSecondGuess(this, goat_door, this._initial_choice_door);
            break;
        case GAME_STATE.WAIT_SECOND_GUESS:
            this._final_choice_door = door;
            this._state = GAME_STATE.FINISHED;
            
            this._contestant.announceGameOver(this, this.didContestantWin);
            break;
        case GAME_STATE.FINISHED:
            console.log("ERROR: Game is finished but a guess was made");
            break;
        default:
            console.log("ERROR: Unknown game state encountered");
        }
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
    requestFirstGuess: function(game) {
        let door = 2;
        console.log("First guess requested");
        console.log("X".repeat(game.doorCount));
        console.log("Guessing " + door);
        
        // in reality, this callback would set up the DOM to show we are ready for the first guess
        // and would set up a callback to listen for the guess. That callback would call game.guess().
        setTimeout(function() {
            game.guess(door);
        }, 1000);
    },
    requestSecondGuess: function(game, goat_door, initial_choice_door) {
        let door = 2;
        console.log("Second guess requested");
        doors = [];
        for (let i = 0; i < game.doorCount; ++i) {
          if (i == door) {
            doors.push("?");
          } else if (i == goat_door) {
            doors.push("G");
          } else {
            doors.push("X")
          }
        }
        console.log(doors.join(''));
        console.log("Guessing " + door);
        // same note as above
        
        setTimeout(function() {
            game.guess(door);
        }, 1000);
    },
    announceGameOver: function(game, didContestantWin) {
        //TODO BUG: because are calling this from the transition, 
        if (didContestantWin) {
            console.log('You won!');
        } else {
            console.log('You lost!');
            console.log('Prize door: ' + game.doorWithPrize);
        }
    }
}

var game = new LetsMakeADealGameStateMachine(contestant);
console.log("--- STARTING GAME ---");
//game.startGame();



//contestant.requestFirstGuess() could be an async function which registers a callback on the DOM.
//Will that work? How do I indicate to JS that the return value is being returned?
//Can I await the DOM listener somehow?



