# JavaScript Fundamentals

## What is `typeof null`?
### Choices
* `"null"`
* `"undefined"`
* > `"object"`
* `"number"`
### Answer
This is a well-known quirk in JavaScript. Despite `null` being a primitive value, `typeof null` returns `"object"`. This is a bug from the first implementation of JavaScript that was never fixed for backwards compatibility reasons. The internal type tag for null was `0`, which was the same tag used for objects.

## Which of the following are falsy values in JavaScript?
### Choices
* > `0`
* > `""`
* `"false"`
* > `null`
* `[]`
* > `undefined`
### Answer
In JavaScript, the falsy values are: `false`, `0`, `-0`, `0n` (BigInt zero), `""` (empty string), `null`, `undefined`, and `NaN`. Note that `"false"` (the string) and `[]` (empty array) are truthy values. An empty array is truthy because it is still an object reference, even though it has no elements.

## What does `Array.isArray([])` return?
### Choices
* > `true`
* `false`
### Answer
`Array.isArray()` is the reliable way to check if a value is an array. Unlike `typeof`, which returns `"object"` for arrays, `Array.isArray()` correctly identifies arrays. It was introduced in ES5 to solve the problem of checking array types across different execution contexts (like iframes).

## What is the output of `0.1 + 0.2 === 0.3`?
### Choices
* `true`
* > `false`
### Answer
Due to IEEE 754 floating-point arithmetic, `0.1 + 0.2` actually equals `0.30000000000000004` in JavaScript, not exactly `0.3`. This is not unique to JavaScript — most programming languages using floating-point numbers have this behavior. To compare floating-point numbers, use a small epsilon value or `Number.EPSILON`.

## What does this code output?
```js
const arr = [1, 2, 3];
arr[10] = 11;
console.log(arr.length);
```
### Choices
* `3`
* `4`
* > `11`
* `10`
### Answer
Setting `arr[10] = 11` extends the array to length `11`. Indices 3 through 9 become "empty slots" (sparse array). The `length` property is always one more than the highest index.

```js
const arr = [1, 2, 3];
arr[10] = 11;
console.log(arr);       // [1, 2, 3, empty × 7, 11]
console.log(arr.length); // 11
```

## Which keywords declare block-scoped variables?
### Choices
* `var`
* > `let`
* > `const`
* `function`
### Answer
`let` and `const` are block-scoped, meaning they are only accessible within the nearest enclosing block (defined by curly braces). `var` is function-scoped and is hoisted to the top of its function. `function` declarations are also hoisted and are function-scoped (or block-scoped in strict mode, depending on the engine).
