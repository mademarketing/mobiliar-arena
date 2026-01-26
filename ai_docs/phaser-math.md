# Math

A Guide to the Phaser Math Functions

JavaScript itself has a pretty comprehensive Math API, which is of course optimized to run quickly in browser. Phaser extends this with its own set of Math functions, that are primarily geared around common use-cases in games. For example, there are Math functions for working with angles, distances, random numbers, interpolation, and more. Lots of these exist because they are required internally, so we expose them for you to use too. The rest are just functions we've found that we have come to require over the years.

All Phaser Math functions are contained in their own namespace. We do not, and never will, modify or pollute the native JavaScript Math namespace. This means that you can use both Phaser Math functions and native Math functions in your game, without any conflicts.

## Basic functions

### Average

Calculate the mean average of the given `values`.

#### Usage

```js
var result = Phaser.Math.Average(values);
```

- `result`: Average of all values provided.
- `values` : An array of numbers.

### Difference

Calculates the positive difference of two given numbers.

#### Usage

```js
var result = Phaser.Math.Difference(a, b);
```

- `a`: first number.
- `b`: second number.
- `result` : Positive difference between `a` and `b`.

### Factorial

Calculates the factorial of a given `value` for integer values greater than 0.

#### Usage

```js
var result = Phaser.Math.Factorial(value);
```

- `value` : A positive integer to calculate the factorial of.
- `result` : Factorial of the given number.

### IsEven

Check if a given `value` is an even number using abstract equality `==`.

#### Usage

```js
var result = Phaser.Math.IsEven(value); // returns true or false
```

### IsEvenStrict

Check if a given `value` is an even number using a strict equality `===`.

#### Usage

```js
var result = Phaser.Math.IsEvenStrict(value); // returns true or false
```

### Pow2

Check if values given are related to a power of two.

#### Usage

- Get the next nearest power of 2 to the given `value`.

```js
var result = Phaser.Math.Pow2.GetNext(value);
```

  - Examples:

    ```js
    var result = Phaser.Math.Pow2.GetNext(3); // returns 4
    // var result = Phaser.Math.Pow2.GetNext(4.1); // returns 8
    // var result = Phaser.Math.Pow2.GetNext(9); // returns 16
    ```

- Checks if both the given `width` and `height` are a power of two.

```js
var result = Phaser.Math.Pow2.IsSize(width, height);
```

  - Examples:

    ```js
    var result = Phaser.Math.Pow2.IsSize(2, 2); // returns true
    // var result = Phaser.Math.Pow2.IsSize(2, 3); // returns false
    // var result = Phaser.Math.Pow2.IsSize(4, 16); // returns true
    ```

- Tests the `value` and returns `true` if it is a power of two.

```js
var result = Phaser.Math.Pow2.IsValue(value);
```

  - Examples:

    ```js
    var result = Phaser.Math.Pow2.IsValue(2); // returns true
    // var result = Phaser.Math.Pow2.IsValue(3); // returns false
    // var result = Phaser.Math.Pow2.IsValue(16); // returns true
    ```

## Minimum, maximum

### Interpolation

Calculates interpolation value over t (0~1), built-in method of phaser.

#### Usage

- Linear interpolation (lerp) two values

```js
var result = Phaser.Math.Linear(p0, p1, t);
```

- Linear interpolation (lerp) two Vectors

```js
var result = Phaser.Math.LinearXY(vector0, vector1, t);
```

  - `vector0`, `vector1` : Phaser.Math.Vector2

- Smooth interpolation

```js
var result = Phaser.Math.Interpolation.SmoothStep(t, min, max);
```

  - `t` : 0~1

- Smoother interpolation

```js
var result = Phaser.Math.Interpolation.SmootherStep(t, min, max);
```

  - `t` : 0~1

- Quadratic bezier interpolation

```js
var result = Phaser.Math.Interpolation.QuadraticBezier(t, p0, p1, p2);
```

  - `t` : 0~1
  - `p0` : The start point.
  - `p1` : The control point.
  - `p2` : The end point.

- Cubic bezier interpolation

```js
var result = Phaser.Math.Interpolation.CubicBezier(t, p0, p1, p2, p3);
```

  - `t` : 0~1
  - `p0` : The start point.
  - `p1` : The first control point.
  - `p2` : The second control point.
  - `p3` : The end point.

### Percentage

Work out what percentage `value` is of the range between `min` and `max`, built-in method of phaser.

#### Usage

- Get percentage of `value` between `min` and `max`:

```js
var result = Phaser.Math.Percent(value, min, max, upperMax);
```

  - `result`: Percentage (0~1).
  - `value` : The number to determine the percentage.
  - `min` : Minimum number of range
  - `max` : Maximum number of range
  - `upperMax` : The mid-way point in the range that represents 100%.

- Get value based on the `percent` between `min` and `max`:

```js
var result = Phaser.Math.FromPercent(percent, min, max);
```

  - `result`: Number based on percentage between `min` and `max` range.
  - `percent` : A number between 0 and 1 representing the percentage.
  - `min` : Minimum number of range
  - `max` : Maximum number of range

### Clamp

Force a `value` within the boundaries by clamping it to the range `min`, `max`, built-in method of phaser.

#### Usage

```js
var result = Phaser.Math.Clamp(value, min, max);
```

- `value` : The value to be clamped.
- `min` : Minimum number of range
- `max` : Maximum number of range

### MaxAdd

Add an `amount` to a `value`, limiting the maximum result to `max`.

#### Usage

```js
var result = Phaser.Math.MaxAdd(value, amount, max);
```

- `value` : The value to add to.
- `amount` : The amount to add.
- `max` : The maximum value to return.

### MinSub

Subtract an `amount` from `value`, limiting the minimum result to `min`.

#### Usage

```js
var result = Phaser.Math.MinSub(value, amount, min);
```

- `value` : The value to subtract to.
- `amount` : The amount to subtract.
- `min` : The minimum value to return.

### Wrap

Wrap the given `value` between `min` and `max`, built-in method of phaser.

#### Usage

```js
var result = Phaser.Math.Wrap(value, min, max);
```

- `value` : The value to wrap.
- `min` : Minimum number of range
- `max` : Maximum number of range

### Ease

Ease functions, built-in method of phaser.

#### Usage

##### Ease functions

- Linear : `Phaser.Math.Easing.Linear`
- Quadratic, Power1
  - Quadratic ease-out : `Phaser.Math.Easing.Quadratic.Out`
  - Quadratic ease-in : `Phaser.Math.Easing.Quadratic.In`
  - Quadratic ease-in/out : `Phaser.Math.Easing.Quadratic.InOut`
- Cubic, Power2
  - Cubic ease-out : `Phaser.Math.Easing.Cubic.Out`
  - Cubic ease-in : `Phaser.Math.Easing.Cubic.In`
  - Cubic ease-in/out : `Phaser.Math.Easing.Cubic.InOut`
- Quartic, Power3
  - Quartic ease-out : `Phaser.Math.Easing.Quartic.Out`
  - Quartic ease-in : `Phaser.Math.Easing.Quartic.In`
  - Quartic ease-in/out : `Phaser.Math.Easing.Quartic.InOut`
- Quintic, Power4
  - Quintic ease-out : `Phaser.Math.Easing.Quintic.Out`
  - Quintic ease-in : `Phaser.Math.Easing.Quintic.In`
  - Quintic ease-in/out : `Phaser.Math.Easing.Quintic.InOut`
- Sinusoidal
  - Sinusoidal ease-out : `Phaser.Math.Easing.Sine.Out`
  - Sinusoidal ease-in : `Phaser.Math.Easing.Sine.In`
  - Sinusoidal ease-in/out : `Phaser.Math.Easing.Sine.InOut`
- Exponential
  - Exponential ease-out : `Phaser.Math.Easing.Expo.Out`
  - Exponential ease-in : `Phaser.Math.Easing.Expo.In`
  - Exponential ease-in/out : `Phaser.Math.Easing.Expo.InOut`
- Circular
  - Circular ease-out : `Phaser.Math.Easing.Circular.Out`
  - Circular ease-in : `Phaser.Math.Easing.Circular.In`
  - Circular ease-in/out : `Phaser.Math.Easing.Circular.InOut`
- Elastic
  - Elastic ease-out : `Phaser.Math.Easing.Elastic.Out`
  - Elastic ease-in : `Phaser.Math.Easing.Elastic.In`
  - Elastic ease-in/out : `Phaser.Math.Easing.Elastic.InOut`
- Bounce
  - Bounce ease-out : `Phaser.Math.Easing.Bounce.Out`
  - Bounce ease-in : `Phaser.Math.Easing.Bounce.In`
  - Bounce ease-in/out : `Phaser.Math.Easing.Bounce.InOut`
- Back
  - Back ease-out : `Phaser.Math.Easing.Back.Out`
  - Back ease-in : `Phaser.Math.Easing.Back.In`
  - Back ease-in/out : `Phaser.Math.Easing.Back.InOut`
- Stepped : `Phaser.Math.Easing.Stepped(v, step)`

##### Get ease function via string

```js
var easeFunction = Phaser.Tweens.Builders.GetEaseFunction(ease);
// var easeFunction = Phaser.Tweens.Builders.GetEaseFunction(ease, easeParams);
```

- `ease` :
  - A string :
    - `Power0` : Linear
    - `Power1` : Quadratic.Out
    - `Power2` : Cubic.Out
    - `Power3` : Quartic.Out
    - `Power4` : Quintic.Out
    - `Linear`
    - `Quad` : Quadratic.Out
    - `Cubic` : Cubic.Out
    - `Quart` : Quartic.Out
    - `Quint` : Quintic.Out
    - `Sine` : Sine.Out
    - `Expo` : Expo.Out
    - `Circ` : Circular.Out
    - `Elastic` : Elastic.Out
    - `Back` : Back.Out
    - `Bounce` : Bounce.Out
    - `Stepped`
    - `Quad.easeIn`
    - `Cubic.easeIn`
    - `Quart.easeIn`
    - `Quint.easeIn`
    - `Sine.easeIn`
    - `Expo.easeIn`
    - `Circ.easeIn`
    - `Back.easeIn`
    - `Bounce.easeIn`
    - `Quad.easeOut`
    - `Cubic.easeOut`
    - `Quart.easeOut`
    - `Quint.easeOut`
    - `Sine.easeOut`
    - `Expo.easeOut`
    - `Circ.easeOut`
    - `Back.easeOut`
    - `Bounce.easeOut`
    - `Quad.easeInOut`
    - `Cubic.easeInOut`
    - `Quart.easeInOut`
    - `Quint.easeInOut`
    - `Sine.easeInOut`
    - `Expo.easeInOut`
    - `Circ.easeInOut`
    - `Back.easeInOut`
    - `Bounce.easeInOut`
  - A custom function

    ```js
    function(v) {
        return v;
    }
    ```

    ```js
    function(v, param0, param1, ...) {
        return v;
    }
    ```

    - `v` : `0` ~ `1`

##### Get result

```js
var result = easeFunction(t);
```

- `t` : `0` ~ `1`

## Round To

Round/ceil/floor to the given precision, built-in method of phaser.

### CeilTo

Ceils to some place comparative to a base, default is 10 for decimal place.

The place is represented by the power applied to base to get that place.

#### Usage

```js
var result = Phaser.Math.CeilTo(value);
```

or

```js
var result = Phaser.Math.CeilTo(value, place, base);
```

- `value` : The value to round.
- `place` : The place to round to. Positive to round the units, negative to round the decimal. Default is `0`.
- `base` : The base to round in. Default is `10` for decimal.

### FloorTo

Floors to some place comparative to a base, default is 10 for decimal place.

The place is represented by the power applied to base to get that place.

#### Usage

```js
var result = Phaser.Math.floorTo(value);
```

or

```js
var result = Phaser.Math.floorTo(value, place, base);
```

- `value` : The value to round.
- `place` : The place to round to. Positive to round the units, negative to round the decimal. Default is `0`.
- `base` : The base to round in. Default is `10` for decimal.

### RoundAwayFromZero

Round a given number so it is further away from zero. That is, positive numbers are rounded up, and negative numbers are rounded down.

#### Usage

```js
var result = Phaser.Math.RoundAwayFromZero(value);
```

- `value` : The value to round.

Examples:

```js
RoundAwayFromZero(10.5) = 11
RoundAwayFromZero(123.45) = 124
RoundAwayFromZero(-5.45) = -6
RoundAwayFromZero(-123.45) = -124
```

### RoundTo

Round a value to the given precision.

#### Usage

```js
var result = Phaser.Math.RoundTo(value);
```

or

```js
var result = Phaser.Math.RoundTo(value, place, base);
```

- `value` : The value to round.
- `place` : The place to round to. Positive to round the units, negative to round the decimal. Default is `0`.
- `base` : The base to round in. Default is `10` for decimal.

Examples:

```js
RoundTo(123.456789, 0) = 123
RoundTo(123.456789, -1) = 123.5
RoundTo(123.456789, -2) = 123.46
RoundTo(123.456789, -3) = 123.457
```

### Snap

Snap a value to nearest grid slice, built-in methods of phaser.

#### Usage

- Snap a value to nearest grid slice, using rounding.

```js
var out = Phaser.Math.Snap.To(value, gap);
// var out = Phaser.Math.Snap.To(value, gap, start);
```

Example: set `gap` to `5`
  - Set `value` to `12`, return `10`
  - Set `value` to `14`, return `15`

- Snap a value to nearest grid slice, using `Ceil`.

```js
var out = Phaser.Math.Snap.Ceil(value, gap);
// var out = Phaser.Math.Snap.Ceil(value, gap, start);
```

Example: set `gap` to `5`
  - Set `value` to `12`, return `15`
  - Set `value` to `14`, return `15`

- Snap a value to nearest grid slice, using `Floor`.

```js
var out = Phaser.Math.Snap.Floor(value, gap);
// var out = Phaser.Math.Snap.Floor(value, gap, start);
```

Example: set `gap` to `5`
  - Set `value` to `12`, return `10`
  - Set `value` to `14`, return `10`

## Distance

Get distance, built-in methods of phaser.

### Get distance between 2 points

```js
var d = Phaser.Math.Distance.Between(x1, y1, x2, y2);
```

or

```js
var d = Phaser.Math.Distance.BetweenPoints(a, b); // a, b: {x, y}
```

### Get squared distance between two points

```js
var d = Phaser.Math.Distance.BetweenPointsSquared(a, b); // a, b: {x, y}
```

or

```js
var d = Phaser.Math.Distance.Squared(x1, y1, x2, y2);
```

### Get Chebyshev distance (the maximum of the horizontal and vertical distances)

```js
var d = Phaser.Math.Distance.Chebyshev(x1, y1, x2, y2);
```

### Get power distance (the sum of the horizontal power distance and vertical power distance)

```js
var d = Phaser.Math.Distance.Power(x1, y1, x2, y2);
```

### Get snake distance(i.e. rectilinear distance, Manhattan distance, the sum of the horizontal and vertical distance)

```js
var d = Phaser.Math.Distance.Snake(x1, y1, x2, y2);
```

### Get speed

```js
var d = Phaser.Math.GetSpeed(distance, time);
```

- `distance` : The distance to travel in pixels.
- `time` : The time, in ms, to cover the distance in.

## Angle

Convert angle value, built-in methods of phaser.

### Degree <-> Radians

Convert the given angle from `degrees` to radians.

```js
var radians = Phaser.Math.DegToRad(degrees);
```

Convert the given angle from `radians` to degrees.

```js
var degrees = Phaser.Math.RadToDeg(radians); // degrees : -180 ~ 180
```

### Angle between points

Angle from (0,0) to vector (x2 - x1 , y2 - y1)

```js
var rad = Phaser.Math.Angle.Between(x1, y1, x2, y2);
```

or

```js
var rad = Phaser.Math.Angle.BetweenPoints(point1, point2);
```

### Angle between angles

Shortest angle (degrees) between 2 angles

```js
var deg = Phaser.Math.Angle.ShortestBetween(angle1, angle2);
```

- `angle1`, `angle2` : Angle in degrees in the range of -180 to 180
- `deg` : Shortest angle in degrees
  - deg > 0 : Counter-ClockWise rotation
  - deg < 0 : ClockWise rotation

### Clockwise to counter-clockwise

Converts Phasers default clockwise `angle` format to counter-clockwise.

```js
var deg = Phaser.Math.Angle.CounterClockwise(angle);
```

- `angle` : Angle in radians
- `deg` : Angle in radians

### Random angle

Returns a random angle in the range [-pi, pi].

```js
var angle = Phaser.Math.Angle.Random();
```

Returns a random angle in the range [-180, 180].

```js
var angle = Phaser.Math.Angle.RandomDegrees();
```

### Reverse

Reverse the given `angle` (rotates the angle by 180 degrees).

```js
var angle = Phaser.Math.Angle.Reverse(angle);
```

- `angle` : Angle in radians

### Rotate around position

Rotate a `point` around `x` and `y` by the given `angle`.

```js
var out = Phaser.Math.RotateAround(point, x, y, angle);
```

Rotate a `point` around `x` and `y` by the given `angle` and `distance`.

```js
var out = Phaser.Math.RotateAroundDistance(point, x, y, angle, distance);
```

### Rotate to angle

Rotates `currentAngle` towards `targetAngle`, taking the shortest rotation distance. `lerp` is the amount to rotate.

```js
var rad = Phaser.Math.Angle.RotateTo(currentAngle, targetAngle, lerp);
```

### Wrap Angle

- Wrap angle (radians) in the range of -PI to PI

```js
var rad = Phaser.Math.Angle.Wrap(angle);
```

- Wrap angle (radians) in the range of 0 to 2*PI

```js
var rad = Phaser.Math.Angle.Normalize(angle);
```

- Wrap angle (degrees) in the range of -180 to 180

```js
var deg = Phaser.Math.Angle.WrapDegrees(angle);
```

### RotateVec3

Rotates a vector in place by axis angle.

```js
var result = Phaser.Math.RotateVec3(vector, axis, angle);
```

- `vector` : The vector to be rotated.
- `axis` : The axis to rotate around.
- `angle` : The angle of rotation in radians.

Example:

```js
var vector = Phaser.Math.Vector3(1, 0, 0); // x = 1, y = 0, z = 0
var axis = new Phaser.Math.Vector3(0, 0, 1); // rotate along z-axis
var angle = Math.PI / 2; // rotate 90 degrees in radians
var result = Phaser.Math.vector(vec, axis, angle);
```

- `result` : Vector3 {x: 0, y: 1, z: 0}

## Random

### Between minimum and maximum

- Get a random value between `min` and `max` values, including `min` and `max`.

```js
var value = Phaser.Math.Between(min, max); // Returns a value >= min and <= max
```

- Get a random floating point number between `min` and `max`, including `min`, excluding `max`.

```js
var value = Phaser.Math.FloatBetween(min, max); // Returns a value >= min and < max
```

### Random vector

- Gets a random 2D `vector` between -1 and 1. Set the default `scale` value (default is 1) to multiply the resulting vector.

```js
var vec = Phaser.Math.RandomXY(vector); // return vec {x, y}
// var vec = Phaser.Math.RandomXY(vector, scale);
```

- Get a random 3D position `vector` in a spherical area. Set the default `radius` value (default is 1) to multiply the resulting vector.

```js
var vec = Phaser.Math.RandomXYZ(vector); // return vec {x, y, z}
// var vec = Phaser.Math.RandomXYZ(vector, radius);
```

- Gets a random 4D `vector`. Set the default `scale` value (default is 1) to multiply the resulting vector.

```js
var vec = Phaser.Math.RandomXYZW(vector); // return vec {x, y, z, w}
// var vec = Phaser.Math.RandomXYZW(vector, scale);
```

### RandomDataGenerator

A seeded Random Data Generator. Access via `Phaser.Math.RND` which is an instance of this class pre-defined by Phaser.

- Set seed in game config for pre-defined random data generator

```js
var config = {
    // ...
    seed: seed,
    // ...
};
var game = new Phaser.Game(config);
```

  - `seed` :
    - A string or an array of strings.

- Set seed at run time

```js
rnd.init(seed);
```

  - `seed` : A string or an array of strings.

- Get pre-defined random data generator

```js
var rnd = Phaser.Math.RND;
```

- Create new random generator

```js
var rnd = new Phaser.Math.RandomDataGenerator(seed); // seed is a string
```

### Get random value

- Random real number between `0` and `1`.

```js
var value = rnd.frac();
```

- Random integer between `0` and `2^32`.

```js
var value = rnd.integer();
```

- Random real number between 0 and 2^32.

```js
var value = rnd.real();
```

- Random integer between and including min and max.

```js
var value = rnd.between(min, max);
// var value = rnd.integerInRange(min, max);
```

- Random real number between min and max.

```js
var value = rnd.realInRange(min, max);
```

- Random real number between -1 and 1.

```js
var value = rnd.normal();
```

- Random angle between `-180` and `180`.

```js
var angle = rnd.angle();
```

- Random rotation in radians, between `-3.141` and `3.141`.

```js
var angle = rnd.rotation();
```

- Random timestamp between min and max.

```js
var timestamp = rnd.timestamp(min, max);
```

  - `min` : Default value is the beginning of 2000.
  - `max` : Default value is the end of 2020.

- UUID

```js
var uuid = rnd.uuid();
```

- Random sign value

```js
var sign = rnd.sign();
```

  - `sign` : `-1` or `1`

### Get random item

- Random element from within the given array.

```js
var item = rnd.pick(array);
```

- Random element from within the given array, favoring the earlier entries.

```js
var item = rnd.weightedPick(array);
```

### Shuffle array

```js
var array = rnd.shuffle(array);
```

## Color

### Get color integer

- Hex string, or color integer

```js
var color = Phaser.Display.Color.ValueToColor(input);
```

  - `input` : Hex string, or color integer

- RGB to color

```js
var color = Phaser.Display.Color.GetColor(red, green, blue);
```

  - `red`, `green`, `blue` : 0 ~ 255

- RGBA to color

```js
var color = Phaser.Display.Color.GetColor32(red, green, blue, alpha);
```

  - `red`, `green`, `blue`, `alpha` : 0 ~ 255

- Hex string to color

```js
var color = Phaser.Display.Color.HexStringToColor(hex).color;
```

  - hex : `#0033ff`, `#03f`, `0x0033ff`, or `0x03f`

- RGB string to color

```js
var color = Phaser.Display.Color.RGBStringToColor(rgb);
```

  - rgb : `'rgb(r,g,b)'`, or `'rgba(r,g,b,a)'`
    - r, g, b : 0 ~ 255
    - a : 0 ~ 1

- HSV to color

```js
var color = Phaser.Display.Color.HSVToRGB(h, s, v).color;
```

  - `h`, `s`, `v` : 0 ~ 1

### Color integer to RGB

```js
var rgb = Phaser.Display.Color.IntegerToRGB(color);
```

- `color` : Color integer ( `0xAARRGGBB`)
- `rgb` : JSON object ( `{r, g, b, a}`)

### HSV color wheel

1. Create color array

```js
var colorArray = Phaser.Display.Color.HSVColorWheel(s, v);
```

2. Get color

```js
var color = colorArray[i].color; // i : 0 ~ 359
```

### Create color object

- Create via r,g,b,a components

```js
var color = new Phaser.Display.Color(red, green, blue); // alpha = 255
// var color = new Phaser.Display.Color(red, green, blue, alpha);
```

  - `red`, `green`, `blue`, `alpha`: 0 ~ 255

- Create via color integer

```js
var color = Phaser.Display.Color.IntegerToColor(colorInteger);
```

  - colorInteger : Color integer ( `0xAARRGGBB`)

#### Set color

- Set color

```js
color.setTo(red, green, blue); // alpha = 255
// color.setTo(red, green, blue, alpha);
```

  - `red`, `green`, `blue`, `alpha`: 0 ~ 255

- Set color in GL values

```js
color.setGLTo(red, green, blue); // alpha = 1
// color.setTo(red, green, blue, alpha);
```

  - `red`, `green`, `blue`, `alpha`: 0 ~ 1

- Set color from color object

```js
color.setFromRGB(rgba);
```

  - rgba :

    ```js
    {
        r: 0,
        g: 0,
        b: 0,
        // a: 0
    }
    ```

- Set color from HSV

```js
color.setFromHSV(h, s, v);
```

- Set to transparent ()

```js
color.transparent();
```

  - Set (red, green, blue) to `0`

- Set to gray color

```js
color.gray(value);
```

- Set to a random color

```js
color.random();
```

or

```js
color.random(min, max);
```

  - `min` : 0 ~ 255. Default value is 0.
  - `max` : 0 ~ 255. Default value is 255.

- Set to random gray

```js
color.randomGray();
```

or

```js
color.randomGray(min, max);
```

- Set red/green/blue/alpha channel : 0 ~ 255

```js
color.red = value;
// color.red += value;
color.green = value;
// color.green += value;
color.blue = value;
// color.blue += value;
color.alpha = value;
// color.alpha += value;
```

- Set H/S/V channel : 0 ~ 1

```js
color.h = value;
// color.h += value;
color.s = value;
// color.s += value;
color.v = value;
// color.v += value;
```

- Set normalized red, green, blue, alpha : 0 ~ 1

```js
color.redGL = value;
// color.redGL += value;
color.greenGL = value;
// color.greenGL += value;
color.blueGL = value;
// color.blueGL += value;
color.alphaGL = value;
// color.alphaGL += value;
```

- Set brighten

```js
color.brighten(value);
```

  - `value` : Percentage, 0 ~ 100

- Saturate : Increase the saturation (S) of this Color by the percentage amount given.

```js
color.saturate(value);
```

  - `value` : Percentage, 0 ~ 100

- Desaturate : Decrease the saturation (S) of this Color by the percentage amount given.

```js
color.desaturate(value);
```

  - `value` : Percentage, 0 ~ 100

- Lighten : Increase the lightness (V) of this Color by the percentage amount given.

```js
color.lighten(value);
```

  - `value` : Percentage, 0 ~ 100

- Darken : Decrease the lightness (V) of this Color by the percentage amount given.

```js
color.darken(value);
```

  - `value` : Percentage, 0 ~ 100

#### Color Properties

- RGB Color, not including the alpha channel

```js
var c = color.color;
```

- RGB Color, including the alpha channel.

```js
var c = color.color32;
```

- RGB color string which can be used in CSS color values.

```js
var c = color.rgba;
```

- Red, green, blue, alpha : 0 ~ 255

```js
var r = color.red;
var g = color.green;
var b = color.blue;
var a = color.alpha;
```

- H, S, V : 0 ~ 1

```js
var h = color.h;
var s = color.s;
var v = color.v;
```

- Normalized red, green, blue, alpha : 0 ~ 1

```js
var r = color.redGL;
var g = color.greenGL;
var b = color.blueGL;
var a = color.alphaGL;
```

#### Clone

```js
var newColor = color.clone();
```

### To hex string

```js
var hexString = Phaser.Display.Color.RGBToString(
  color.r,
  color.g,
  color.b,
  color.a
);
// var hexString = Phaser.Display.Color.RGBToString(color.r, color.g, color.b, color.a, prefix);
```

### Interpolation

Interpolate between 2 colors.

```js
var colorOut = Phaser.Display.Color.Interpolate.RGBWithRGB(
  r1,
  g1,
  b1,
  r2,
  g2,
  b2,
  length,
  index
);
var colorOut = Phaser.Display.Color.Interpolate.ColorWithColor(
  color1,
  color2,
  length,
  index
);
var colorOut = Phaser.Display.Color.Interpolate.ColorWithRGB(
  color,
  r,
  g,
  b,
  length,
  index
);
```

- `length`, `index` : t = `index/length` (0~1)

## Vector

A representation of a vector in 2D space ( `{x, y}`), built-in object of phaser.

### Create vector

```js
var vector = new Phaser.Math.Vector2();
// var vector = new Phaser.Math.Vector2(x, y);
// var vector = new Phaser.Math.Vector2({x, y});
```

### Clone vector

```js
var newVector = vector.clone();
```

### Set vector components

- Set (x, y)

```js
vector.set(x, y);
// vector.setTo(x, y);
```

or

```js
vector.copy({ x, y });
// vector.setFromObject({x, y});
```

- Set angle

```js
vector.setAngle(angle);
```

  - `angle` : Angle in radians.

- Rotate

```js
vector.rotate(delta);
```

  - `delta` : The angle to rotate by, in radians.

- Project

```js
vector.project(srcVector2);
```

- Set length

```js
vector.setLength(length);
```

- Set from polar coordinate

```js
vector.setToPolar(azimuth, radius);
```

  - `azimuth` : The angular coordinate, in radians.
  - `radius` : The radial coordinate (length). Default is `1`.

- Reset to (0, 0)

```js
vector.reset();
```

### Get vector componments

- X, Y

```js
var x = vector.x;
var y = vector.y;
```

- Angle

```js
var angle = vector.angle(); // angle in radians
```

- Length

```js
var length = vector.length();
```

or

```js
var lengthSq = vector.lengthSq(); // squared
```

### Methods

- Scale

```js
vector.scale(value);
```

- Limit the length

```js
vector.limit(value);
```

- Normalize

```js
vector.normalize();
```

- Negate

```js
vector.negate();
```

- Rotate perpendicular

```js
vector.normalizeRightHand();
vector.normalizeLeftHand();
```

- Reflect
  - Reflect this Vector off a line defined by a normal.

    ```js
    vector.reflect(normal);
    ```

    - `normal` : A vector perpendicular to the line.

  - Reflect this Vector across another.

    ```js
    vector.mirror(axis);
    ```

    - `axis` : A vector to reflect across.

#### Vector methods

- Add

```js
vector.add(src); // src: {x, y}
```

- Subtract

```js
vector.subtract(src); // src: {x, y}
```

- Multiply

```js
vector.multiply(src); // src: {x, y}
```

- Divide

```js
vector.divide(src); // src: {x, y}
```

- Dot

```js
var value = vector.dot(src); // src: {x, y}
```

- Cross

```js
var value = vector.cross(src); // src: {x, y}
```

- Fuzzy Equal

```js
var equal = vector.fuzzyEquals(src); // src: {x, y}
// var equal = vector.fuzzyEquals(src, epsilon);
```

#### Vector points method

- Distance between 2 points.

```js
var distance = vector.distance(src);
```

or

```js
var distanceSq = vector.distanceSq(src); // squared
```

- Linearly interpolate between 2 points.

```js
vector.lerp(src, t); // src: {x, y}
```

  - `t` : The interpolation percentage, between 0 and 1.

#### Constant

- Zero `(0,0)`

```js
var vector = Phaser.Math.Vector2.ZERO;
```

- One `(1,1)`

```js
var vector = Phaser.Math.Vector2.ONE;
```

- Right `(1,0)`

```js
var vector = Phaser.Math.Vector2.RIGHT;
```

- Left `(-1,0)`

```js
var vector = Phaser.Math.Vector2.LEFT;
```

- Up `(0,-1)`

```js
var vector = Phaser.Math.Vector2.UP;
```

- Down `(0,1)`

```js
var vector = Phaser.Math.Vector2.DOWN;
```

## Curve

### Path

#### Add path object

```js
var path = scene.add.path();
// var path = scene.add.path(x, y);  // curve start from (x, y)
```

or

```js
var path = new Phaser.Curves.Path();
// var path = new Phaser.Curves.Path(x, y);  // curve start from (x, y)
```

#### Add path object with curves

```js
var path = scene.add.path(json);
```

or

```js
var path = new Phaser.Curves.Path(json);
```

### Add curve

#### Line

- Add line object
1. Create line object

     ```js
     var curve = new Phaser.Curves.Line({ x: x0, y: y0 }, { x: x1, y: y1 });
     ```

     or

     ```js
     var curve = new Phaser.Curves.Line([x0, y0, x1, y1]);
     ```

2. Add to path

     ```js
     path.add(curve);
     ```

- Add line started from previous end point to next point

```js
path.lineTo(endX, endY);
```

or

```js
path.lineTo(new Phaser.Math.Vector2({ x, y }));
```

Properties:

- `curve.p0` : The first endpoint.
  - `curve.p0.x`, `curve.p0.y`
- `curve.p1` : The second endpoint.
  - `curve.p1.x`, `curve.p1.y`

#### Circle/ellipse/arc

- Add circle/ellipse/arc object
1. Create circle/ellipse/arc object
     - Circle

       ```js
       var curve = new Phaser.Curves.Ellipse(x, y, radius);
       ```

     - Ellipse

       ```js
       var curve = new Phaser.Curves.Ellipse(x, y, xRadius, yRadius);
       ```

     - Arc

       ```js
       var curve = new Phaser.Curves.Ellipse(
         x,
         y,
         xRadius,
         yRadius,
         startAngle,
         endAngle,
         clockwise,
         rotation
       );
       ```

2. Add to path

     ```js
     path.add(curve);
     ```

- Add circle/ellipse/arc started from previous end point to next point
  - Circle

    ```js
    path.circleTo(radius);
    ```

  - Ellipse

    ```js
    path.ellipseTo(xRadius, yRadius);
    ```

  - Arc

    ```js
    path.ellipseTo(xRadius, yRadius, startAngle, endAngle, clockwise, rotation);
    ```

Properties:

- `curve.p0` : Center point.
  - `curve.p0.x`, `curve.p0.y`
- `curve.xRadius`, `curve.yRadius` : Horizontal/vertical radiuse.
- `curve.startAngle`, `curve.endAngle` : Start/end angle, in degrees.
- `curve.clockwise` : `true` if Clockwise, `false` if anti-clockwise.
- `curve.angle` : Rotation, in degrees.
  - `curve.rotation` : Rotation, in radians.

#### Spline

- Add spline object
1. Create spline object

     ```js
     var curve = new Phaser.Curves.Spline([
       p0, // {x, y}, or [x, y]
       p1, // {x, y}, or [x, y]
       // ...
     ]);
     ```

     or

     ```js
     var curve = new Phaser.Curves.Spline([
       x0,
       y0,
       x1,
       y1,
       // ...
     ]);
     ```

2. Add to path

     ```js
     path.add(curve);
     ```

- Add spline started from previous end point to next point

```js
var points = ;
path.splineTo([
      p0,            // {x, y}, or [x, y]
      p1,            // {x, y}, or [x, y]
      // ...
]);
```

or

```js
path.splineTo([
    x0,
    y0,
    x1,
    y1,
    // ...
]);
```

##### Append point

```js
var point = curve.addPoint(x, y);
```

#### Quadratic bezier curve

1. Create quadratic bezier curve object

```js
var curve = new Phaser.Curves.QuadraticBezier(
     startPoint,
     controlPoint,
     endPoint
); // point: {x, y}
```

or

```js
var points = [
     x0,
     y0, // start point
     x1,
     y1, // control point
     x2,
     y2, // end point
];
var curve = new Phaser.Curves.QuadraticBezier(points);
```

2. Add to path

```js
path.add(curve);
```

Add quadratic bezier curve started from previous end point to next point

```js
path.quadraticBezierTo(endX, endY, controlX, controlY);
```

or

```js
path.quadraticBezierTo(endPoint, controlPoint); // point : Phaser.Math.Vector2
```

#### Cubic bezier curve

1. Create quadratic bezier curve object

```js
var curve = new Phaser.Curves.CubicBezier(
     startPoint,
     controlPoint1,
     controlPoint2,
     endPoint
); // point: {x, y}
```

or

```js
var points = [
     x0,
     y0, // start point
     x1,
     y1, // control point1
     x2,
     y2, // control point2
     x3,
     y3, // end point
];
var curve = new Phaser.Curves.CubicBezier(points);
```

2. Add to path

```js
path.add(curve);
```

Add cubic bezier curve started from previous end point to next point

```js
path.cubicBezierTo(endX, endY, control1X, control1Y, control2X, control2Y);
```

or

```js
path.cubicBezierTo(endPoint, controlPoint1, controlPoint2); // point : Phaser.Math.Vector2
```

#### Move to point

```js
path.moveTo(x, y);
```

#### Add curves from JSON

```js
path.fromJSON(json);
```

### Get curves

```js
var curves = path.curves;
```

#### Get curve at t

```js
var curve = path.getCurveAt(t);
```

- `t` : The normalized location on the Path. Between `0` and `1`

### Draw on graphics

```js
path.draw(graphics);
// path.draw(graphics, pointsTotal);
```

- `pointsTotal` : The number of points to draw for each Curve.

or

```js
curve.draw(graphics);
// curve.draw(graphics, pointsTotal);
```

- `pointsTotal` : The resolution of the curve.

### Point

- Get point

```js
var out = path.getPoint(t); // t: 0 ~ 1
// var out = path.getPoint(t, out);  // modify out
```

or

```js
var out = curve.getPoint(t); // t: 0 ~ 1
// var out = curve.getPoint(t, out);  // modify out
```

Distance of path from start point to target point (out) might not linear with t.

- Get random point

```js
var out = path.getRandomPoint();
// var out = path.getRandomPoint(out);  // modify out
```

or

```js
var out = curve.getRandomPoint();
// var out = curve.getRandomPoint(out);  // modify out
```

- Get n points
  - Path

    ```js
    var points = path.getPoints(divisions);
    ```

    - `divisions` : The number of divisions per resolution **per curve**.

  - Curve

    ```js
    var points = curve.getPoints(divisions);
    // var points = curve.getPoints(divisions, undefined, out);
    ```

    or

    ```js
    var points = curve.getPoints(undefined, stepRate);
    // var points = curve.getPoints(undefined, stepRate, out);
    ```

    - `divisions` : The number of divisions in this curve.
      1. `divisions`, if `divisions > 0`, else
      2. `this.getLength / stepRate`, if `stepRate > 0`, else
      3. `defaultDivisions`
    - `points` : Return `1 + divisions` points.

- Get (n+1) points equally spaced out along the curve

```js
var points = path.getSpacedPoints(n);
```

or

```js
var points = curve.getSpacedPoints(n);
// var points = curve.getSpacedPoints(undefined, stepRate);
// var points = curve.getSpacedPoints(divisions, stepRate, out);
```

- Get points spaced out n distance pixels apart

```js
var points = curve.getDistancePoints(n);
```

The smaller the distance, the larger the array will be.

Path object does **NOT** support this feature yet.

- Get start point

```js
var out = path.getStartPoint();
// var out = path.getStartPoint(out);  // modify out
```

or

```js
var out = curve.getStartPoint();
// var out = curve.getStartPoint(out);  // modify out
```

- Get end point

```js
var out = path.getEndPoint();
// var out = path.getEndPoint(out);  // modify out
```

or

```js
var out = curve.getEndPoint();
// var out = curve.getEndPoint(out);  // modify out
```

- Get t (0~1) from distance

```js
var t = curve.getTFromDistance(d);
```

Path object does **NOT** support this feature yet.

- Get tangent

```js
var out = path.getTangent(t); // t: 0~1
// var out = path.getTangent(t, out);  // modify out
```

or

```js
var out = curve.getTangent(t); // t: 0~1
// var out = curve.getTangent(t, out);  // modify out
```

### Length of path

```js
var l = path.getLength();
```

or

```js
var l = curve.getLength();
```

Length of path/curve will be cached.

#### Update length

```js
path.updateArcLengths();
```

or

```js
curve.updateArcLengths();
```

### Curves to JSON

```js
var json = path.toJSON();
```

or

```js
var json = curve.toJSON();
```

### Path Bounds

Get bounds

```js
var out = path.getBounds(); // accuracy = 16
// var out = path.getBounds(out);
// var out = path.getBounds(out, accuracy);
```

or

```js
var out = curve.getBounds(); // accuracy = 16
// var out = curve.getBounds(out);
// var out = curve.getBounds(out, accuracy);
```

- `out` : A rectangle object

### Destroy path

```js
path.destroy();
```

## Author Credits

Content on this page includes work by:

- [RexRainbow](https://github.com/rexrainbow)

---

**Updated:** July 30, 2025, 3:14 PM UTC

**Source URL:** https://docs.phaser.io/phaser/concepts/math
