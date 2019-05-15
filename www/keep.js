;(function(global) {

    function arrayToList(arr) {
        let list = null;
        for (let i = arr.length - 1; i >= 0; --i) {
            list = {
                value: arr[i],
                rest: list
            };
        }
        return list;
    }

    function listToArray(list) {
        let arr = [];
        while (list != null) {
            arr.push(list.value);
            list = list.rest;
        }
        return arr;
    }

    function prepend(el, list) {
        return {
            value: el,
            rest: list
        };
    }

    function nth(list, n) {
        while (n > 0 && list != null) {
            --n;
            list = list.rest;
        }

        if (list != null) {
            return list.value;
        }
    }

    function nthR(list, n) {
        if (list == null) {
            return;
        } else if (n === 0) {
            return list.value;
        } else {
            return nthR(list.rest, n - 1);
        }
    }

    function chunk(arr, size = 1) {
        var chunks = [];

        for (var i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
        }

        return chunks;
    }

    function deepEqual(a, b) {
        // CAVEAT: Does not look at prototypes.
        if (a === b) {
            return true;
        } else if (typeof a === "object" && a !== null && typeof b === "object" && b !== null) {
            let aKeys = Object.keys(a),
                bKeys = Object.keys(b);

            if (aKeys.length !== bKeys.length) {
                return false;
            }

            for (let key of aKeys) {
                if (!bKeys.includes(key)) {
                    return false;
                } else {
                    if (!deepEqual(a[key], b[key])) {
                        return false;
                    }
                }
            }

            return true;
        }

        return false;
    }

    function every(array, test) {
        return !array.some(val => !test(val));
    }

    function loop(value, test, update, body) {
        for (let i = value; test(i); i = update(i)) {
            body(i);
        }
    }

    function fizzBuzz(n) {
        for (let i = 1; i <= n; ++i) {
            let out = "";
            let divBy3 = i % 3 === 0;
            let divBy5 = i % 5 === 0;

            if (divBy3 || divBy5) {
                if (divBy3) {
                    out += "Fizz";
                }
                if (divBy5) {
                    out += "Buzz";
                }
            } else {
                out = String(i);
            }

            console.log(out);
        }
    }

    function flatten(arrOfarr) {
        return arrOfarr.reduce((combined, each) => combined.concat(each), []);
    }

    function range(start, end, step = 1) {
        if (step == 0) {
            throw `invalid step: ${step}`;
        } else if (end < start && step > 0 || end > start && step < 0) {
            throw `invalid step (${step}) for range [${start}, ${end}]`;
        }

        let compare = step > 0 ? (a, b) => a <= b :
            (a, b) => a >= b;

        let $range = [];
        for (let i = start; compare(i, end); i += step) {
            $range.push(i);
        }
        return $range;
    }

    function reverseArray(arr) {
        let reversed = [];
        for (let i = arr.length - 1; i >= 0; --i) {
            reversed.push(arr[i]);
        }
        return reversed;
    }

    function reverseArrayInPlace(arr) {
        for (let left = 0, right = arr.length - 1; left < right; ++left, --right) {
            let swap = arr[left];
            arr[left] = arr[right];
            arr[right] = swap;
        }
    }


    function sum(iter) {
        let $sum = 0;
        for (let value of iter) {
            $sum += value;
        }
        return $sum;
    }

    function repeat(n, fn) {
        for (var i = 0; i < n; ++i) {
            fn();
        }
    }

    global.util = {
        arrayToList,
        listToArray,
        chunk,
        deepEqual,
        every,
        fizzBuzz,
        flatten,
        loop,
        prepend,
        nth,
        nthR,
        range,
        reverseArray,
        reverseArrayInPlace,
        repeat,
        sum
    };
})(window);
