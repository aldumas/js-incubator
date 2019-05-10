;(function(global) {
    var lib = {};

    lib.chunk = function(arr, size=1) {
        var chunks = [];

        for (var i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
        }

        return chunks;
    };

    global._x = lib;

})(window);


//var chunks = _.chunk([1,2,3]);

// var personCreator = {

//     get fullName() {
//         return `${this.firstName} ${this.lastName}`;
//     },

//     create(params) {
//         return Object.assign(Object.create(this), params);
//     }

// };

// let person = personCreator.create({firstName: "Cali", lastName:"Dumas"});
// console.log(person.fullName);

//Object.create(null)

let myProto = Object.create(null);
myProto.valueOf = function() {return 42;};
//myProto.toString = function() {return "100";};
let almostBlankObject = Object.create(myProto);

let values = [0, +0, -0, "", "0", NaN, null, undefined, Infinity, [], function() {}, {}, almostBlankObject];


//console.log(values.map(val => Boolean(val)));
console.log(values.map(val => Number(val)));
// console.log(values.map(val => String(val)));
// console.log(values.map(val => val == 0));
// console.log(values.map(val => val == ""));





//Lessons:
//1. == might produce an error while doing the type conversion e.g. if one of the values is an object without access to valueOf() or toString() and the other is a primitive value.
//   a. Number(val) does the same thing.
//      i. When converting to a number using Number(), the engine will prefer valueOf() over toString(). Even neither are present, it is an error.
//   b. String(val) does the same thing.
//      i. When converting to a string using String(), the engine will prefer toString() over valueOf(). Even neither are present, it is an error.
//   c. Boolean(val) never fails. Even an empty object with no prototype becomes true.
//2. Coercion and casting follow different rules. E.g. coercion under == will not coerce null to 0 or 0 to null, so false is returned,
//   but if you do a cast of null to number, you do get 0.
//3. "0" is truthy.
//5. If you change the prototype of an Array object, Array.isArray will still return true.
//6. == will return false for any 2 distinct objects, regardless of whether all the internals are the same.


//LEFT OFF HERE: Why do we get NaN with Number({}) but an error when doing that with an object without valueOf() or toString()? Object.prototype.valueOf() returns an object. Does it return the object, itself, by default?
//And if valueOf does not return a primitive, does that get converted to NaN by Number()?

//TODO compare whether 2 distinct arrays are equal.




