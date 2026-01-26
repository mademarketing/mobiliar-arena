# Geometry

Phaser has an extensive set of Geometry classes. These are used internally by the physics and input systems, but are also available for you to use in your own games. The geometry classes on offer include: Circle, Ellipse, Line, Point, Polygon, Rectangle, Triangle and the Mesh class.

Each of these classes has a set of methods and support functions that allow you to perform geometric operations on them. For example, you can check if a point is contained within a circle, get the bounds of an ellipse, or the nearest point from a line, as well as many other features.

There are also a wide range of intersection functions. You can test for conditions such as a Circle intersecting with a Rectangle, or getting the rays from a point to a polygon.

The Geometry classes are not Game Objects. You cannot add them on to the Display List. Instead, think of them as data structures that you can use to perform geometric operations on, of which most games tend to have quite a few.

## Circle

### Create circle

```js
var circle = new Phaser.Geom.Circle(x, y, radius);
```

### Clone circle

```js
var circle1 = Phaser.Geom.Circle.Clone(circle0);
```

### Draw on Graphics object

- Fill shape

```js
// graphics.fillStyle(color, alpha);   // color: 0xRRGGBB
graphics.fillCircleShape(circle);
```

- Stroke shape

```js
// graphics.lineStyle(lineWidth, color, alpha);   // color: 0xRRGGBB
graphics.strokeCircleShape(circle);
```

> **Note:** Negative radius will be treated as positive radius. i.e. `Math.abs(radius)`

### Set circle properties

- All properties

```js
circle.setTo(x, y, radius);
```

or

```js
Phaser.Geom.Circle.CopyFrom(source, dest);
```

> **Note:** `CopyFrom` requires source and dest circles that already exist

- Position

```js
circle.setPosition(x, y);
```

or

```js
circle.x = 0;
circle.y = 0;
```

or

```js
circle.left = 0; // circle.x
circle.top = 0; // circle.y
// circle.right = 0;   // circle.x
// circle.bottom = 0;  // circle.y
```

or

```js
Phaser.Geom.Circle.Offset(circle, dx, dy); // circle.x += dx, circle.y += dy
```

or

```js
Phaser.Geom.Circle.OffsetPoint(circle, point); // circle.x += point.x, circle.y += point.y
```

- Radius

```js
circle.radius = radius;
```

or

```js
circle.diameter = diameter; // diameter = 2 * radius
```

### Get properties

- Position

```js
var x = circle.x;
var y = circle.y;
var top = circle.top;
var left = circle.left;
var right = circle.right;
var bottom = circle.bottom;
```

- Radius

```js
var radius = circle.radius;
// var diameter = circle.diameter;
```

- Bounds

```js
var bound = Phaser.Geom.Circle.GetBounds(circle);
// var bound = Phaser.Geom.Circle.GetBounds(circle, bound);  // push bound
```

  - `bound` : `GetBounds` returns a Rectangle shape

- Area

```js
var area = Phaser.Geom.Circle.Area(circle);
```

- Circumference

```js
var circumference = Phaser.Geom.Circle.Circumference(circle);
```

- Type:

```js
var type = circle.type; // GEOM_CONST.CIRCLE or 0
```

### Point(s) & shape

- Get point at circle's edge

```js
var point = circle.getPoint(t);
// var point = circle.getPoint(t, point);
```

  - Arguments:
    - `t` : A value between 0 and 1, where 0 equals 0 degrees, 0.5 equals 180 degrees and 1 equals 360 around the circle.
    - `point` : an existing point or returns a new point if point is not provided

or

```js
var point = Phaser.Geom.Circle.CircumferencePoint(circle, angle); // angle in radians
// var point = Phaser.Geom.Circle.CircumferencePoint(circle, angle, point);  // modify existing point or returns a new point if point is not provided
```

- Get a random point inside circle

```js
var point = circle.getRandomPoint();
// var point = circle.getRandomPoint(point);  // modify existing point or returns a new point if point is not provided
```

- Get points around circle's edge.

  - Based on quantity:

```js
var points = circle.getPoints(quantity);
// var points = circle.getPoints(quantity, null, pointsArray);  // If pointsArray not provided a new array will be created.
```

  - Based on stepRate:

```js
var points = circle.getPoints(false, stepRate);
// var points = circle.getPoints(false, stepRate, pointsArray);  // If pointsArray not provided a new array will be created.
```

  - `pointsArray` : an existing array
  - `stepRate` : sets the quantity by getting the circumference of the circle divided by the stepRate

- Point is inside circle

```js
var isInside = circle.contains(x, y);
```

or

```js
var isInside = Phaser.Geom.Circle.ContainsPoint(circle, point);
```

- Rectangle is inside shape

```js
var isInside = Phaser.Geom.Circle.ContainsRect(circle, rect); // rect : 4 points
```

### Empty

- Set empty

```js
circle.setEmpty(); // circle.radius = 0
```

- Is empty

```js
var isEmpty = circle.isEmpty(); // circle.radius <= 0
```

### Equal

```js
var isEqual = Phaser.Geom.Circle.Equals(circle0, circle1);
```

Position and radius are equal.

### Intersection

#### Circle to circle

- Is intersection

```js
var result = Phaser.Geom.Intersects.CircleToCircle(circleA, circleB);
```

- Get intersection points

```js
var result = Phaser.Geom.Intersects.GetCircleToCircle(circleA, circleB);
// var out = Phaser.Geom.Intersects.GetCircleToCircle(circleA, circleB, out);
```

#### Circle to rectangle

- Is intersection

```js
var result = Phaser.Geom.Intersects.CircleToRectangle(circle, rect);
```

- Get intersection points

```js
var result = Phaser.Geom.Intersects.GetCircleToRectangle(circle, rect);
// var out = Phaser.Geom.Intersects.GetCircleToRectangle(circle, rect, out);
```

#### Circle to triangle

- Is intersection

```js
var result = Phaser.Geom.Intersects.TriangleToCircle(triangle, circle);
```

- Get intersection points

```js
var result = Phaser.Geom.Intersects.GetTriangleToCircle(triangle, circle);
// var out = Phaser.Geom.Intersects.GetTriangleToCircle(triangle, circle, out);
```

#### Circle to line

- Is intersection

```js
var result = Phaser.Geom.Intersects.LineToCircle(line, circle);
// var result = Phaser.Geom.Intersects.LineToCircle(line, circle, nearest);
```

  - `nearest` : Nearest point on line.

- Get intersection points

```js
var result = Phaser.Geom.Intersects.GetLineToCircle(line, circle);
// var out = Phaser.Geom.Intersects.GetLineToCircle(line, circle, out);
```

## Ellipse

### Create ellipse

```js
var ellipse = new Phaser.Geom.Ellipse(x, y, width, height);
```

### Clone ellipse

```js
var ellipse1 = Phaser.Geom.Ellipse.Clone(ellipse0);
```

### Draw on Graphics object

- Fill shape

```js
// graphics.fillStyle(color, alpha);   // color: 0xRRGGBB
graphics.fillEllipseShape(ellipse);
```

- Stroke shape

```js
// graphics.lineStyle(lineWidth, color, alpha);   // color: 0xRRGGBB
graphics.strokeEllipseShape(ellipse);
```

> **Note:** Negative width, height will be treated as positive width, height. i.e. `Math.abs(width)`, `Math.abs(height)`

### Set properties

- All properties

```js
ellipse.setTo(x, y, width, height);
```

or

```js
Phaser.Geom.Ellipse.CopyFrom(source, dest);
```

> **Note:** `CopyFrom` requires source and dest circles that already exist

- Position

```js
ellipse.setPosition(x, y);
```

or

```js
ellipse.x = 0;
ellipse.y = 0;
```

or

```js
ellipse.left = 0; // ellipse.x
ellipse.top = 0; // ellipse.y
// ellipse.right = 0;   // ellipse.x
// ellipse.bottom = 0;  // ellipse.y
```

or

```js
Phaser.Geom.Ellipse.Offset(ellipse, dx, dy); // ellipse.x += dx, ellipse.y += dy
```

or

```js
Phaser.Geom.Ellipse.OffsetPoint(ellipse, point); // ellipse.x += point.x, ellipse.y += point.y
```

- Width, height

```js
ellipse.width = width;
ellipse.height = height;
```

### Get properties

- Position

```js
var x = ellipse.x;
var y = ellipse.y;
var top = ellipse.top;
var left = ellipse.left;
var right = ellipse.right;
var bottom = ellipse.bottom;
```

- Width, height

```js
var width = ellipse.width;
var height = ellipse.height;
```

- Bounds

```js
var bound = Phaser.Geom.Ellipse.GetBounds(ellipse);
// var bound = Phaser.Geom.Ellipse.GetBounds(ellipse, bound);  // push bound
```

  - `bound` : `GetBounds` returns a Rectangle shape

- Area

```js
var area = Phaser.Geom.Ellipse.Area(ellipse);
```

- Circumference

```js
var circumference = Phaser.Geom.Ellipse.Circumference(ellipse);
```

- Type:

```js
var type = ellipse.type; // GEOM_CONST.ELLIPSE or 1
```

### Point(s) & shape

- Get point at shape's edge

```js
var point = ellipse.getPoint(t);
// var point = ellipse.getPoint(t, point);
```

  - Arguments:
    - `t` : A value between 0 and 1, where 0 equals 0 degrees, 0.5 equals 180 degrees and 1 equals 360 around the circle.
    - `point` : an existing point or returns a new point if point is not provided

or

```js
var point = Phaser.Geom.Ellipse.CircumferencePoint(ellipse, angle); // angle in degrees
// var point = Phaser.Geom.Ellipse.CircumferencePoint(ellipse, angle, point);  // modify point
```

- Get a random point inside shape

```js
var point = ellipse.getRandomPoint();
// var point = ellipse.getRandomPoint(point);  // modify point
```

- Get points around shape's edge

  - Based on quantity:

```js
var points = ellipse.getPoints(quantity);
// var points = ellipse.getPoints(quantity, null, pointsArray);  // If pointsArray not provided a new array will be created.
```

  - Based on stepRate:

```js
var points = ellipse.getPoints(false, stepRate);
// var points = ellipse.getPoints(false, stepRate, pointsArray);  // If pointsArray not provided a new array will be created.
```

  - `pointsArray` : an existing array
  - `stepRate` : sets the quantity by getting the circumference of the ellipse divided by the stepRate

- Point is inside shape

```js
var isInside = ellipse.contains(x, y);
```

or

```js
var isInside = Phaser.Geom.Ellipse.ContainsPoint(ellipse, point);
```

- Rectangle is inside shape

```js
var isInside = Phaser.Geom.Ellipse.ContainsRect(ellipse, rect); // rect : 4 points
```

### Empty

- Set empty

```js
ellipse.setEmpty(); // ellipse.width = 0, ellipse.height = 0
```

- Is empty

```js
var isEmpty = ellipse.isEmpty(); // ellipse.width <= 0 || ellipse.height <= 0
```

### Equal

```js
var isEqual = Phaser.Geom.Ellipse.Equals(ellipse0, ellipse1);
```

Position and width, height are equal.

## Line

### Create line

```js
var line = new Phaser.Geom.Line(x1, y1, x2, y2);
```

### Clone line

```js
var line1 = Phaser.Geom.Line.Clone(line0);
```

### Draw on Graphics object

```js
// graphics.lineStyle(lineWidth, color, alpha);   // color: 0xRRGGBB
graphics.strokeLineShape(line);
```

### Set properties

- All properties

```js
line.setTo(x1, y1, x2, y2);
```

or

```js
Phaser.Geom.Line.CopyFrom(source, dest);
```

- Position

```js
line.x1 = 0;
line.y1 = 0;
line.x2 = 0;
line.y2 = 0;
```

or

```js
line.left = 0; // min(x1, x2)
line.top = 0; // min(y1, y2)
line.right = 0; // max(x1, x2)
line.bottom = 0; // max(y1, y2)
```

  - Offset start, end

    ```js
    var line = Phaser.Geom.Line.Offset(line, dx, dy);
    // line.x1 += dx, line.y1 += dy, line.x2 += dx, line.y2 += dy
    ```

  - Set center position

    ```js
    var line = Phaser.Geom.Line.CenterOn(line, x, y);
    ```

- Start point, angle, length

```js
var line = Phaser.Geom.Line.SetToAngle(line, x, y, angle, length);
```

  - `line` : The line to set
  - `x` , `y` : start point
  - `angle` : The angle of the line in **radians**

    ```js
    var rad = Phaser.Math.DegToRad(deg);
    ```

  - `length` :　 The length of the line

- Rotate
  - Rotate around **midpoint**

    ```js
    var line = Phaser.Geom.Line.Rotate(line, angle);
    ```

    - `line` : The line to set
    - `angle` : The angle of the line in **radians**

      ```js
      var rad = Phaser.Math.DegToRad(deg);
      ```

  - Rotate around point

    ```js
    var line = Phaser.Geom.Line.RotateAroundPoint(line, point, angle);
    ```

    or

    ```js
    var line = Phaser.Geom.Line.RotateAroundXY(line, x, y, angle);
    ```

    - `line` : The line to set
    - `angle` : The angle of the line in **radians**

      ```js
      var rad = Phaser.Math.DegToRad(deg);
      ```

- Extend

```js
var line = Phaser.Geom.Line.Extend(line, left, right);
```

### Get properties

- Position

```js
var x1 = line.x1;
var y1 = line.y1;
var x2 = line.x2;
var y2 = line.y2;
var top = line.top; // min(x1, x2)
var left = line.left; // min(y1, y2)
var right = line.right; // max(x1, x2)
var bottom = line.bottom; // max(y1, y2)
```

  - Start point

    ```js
    var start = line.getPointA(); // start: {x, y}
    var start = line.getPointA(start); // push start
    ```

  - End point

    ```js
    var end = line.getPointB(); // end: {x, y}
    var end = line.getPointB(end); // push end
    ```

  - Middle point

    ```js
    var middle = Phaser.Geom.Line.GetMidPoint(line); // middle: {x, y}
    // var middle = Phaser.Geom.Line.GetMidPoint(line, middle);
    ```

- Length

```js
var length = Phaser.Geom.Line.Length(line);
```

  - Width : Abs(x1 - x2)

    ```js
    var width = Phaser.Geom.Line.Width(line);
    ```

  - Height : Abs(y1 - y2)

    ```js
    var width = Phaser.Geom.Line.Height(line);
    ```

- Slope
  - Slope : (y2 - y1) / (x2 - x1)

    ```js
    var slope = Phaser.Geom.Line.Slope(line);
    ```

  - Perpendicular slope : -((x2 - x1) / (y2 - y1))

    ```js
    var perpSlope = Phaser.Geom.Line.PerpSlope(line);
    ```

- Angle
  - Angle

    ```js
    var angle = Phaser.Geom.Line.Angle(line);
    ```

    - `angle` : The angle of the line in **radians**

      ```js
      var deg = Phaser.Math.RadToDeg(rad); // deg : -180 ~ 180
      ```

  - Normal angle (angle - 90 degrees)
    - Normal angle

      ```js
      var normalAngle = Phaser.Geom.Line.NormalAngle(line);
      ```

    - Normal vector

      ```js
      var normal = Phaser.Geom.Line.GetNormal(line); // normal: {x, y}
      // var normal = Phaser.Geom.Line.GetNormal(line, normal);  // push normal
      ```

      or

      ```js
      var normalX = Phaser.Geom.Line.NormalX(line);
      var normalY = Phaser.Geom.Line.NormalY(line);
      ```

  - Reflect angle

    ```js
    var reflectAngle = Phaser.Geom.Line.ReflectAngle(aimLine, reflectingLine);
    ```

- Type:

```js
var type = line.type; // GEOM_CONST.LINE or 2
```

### Point(s) & shape

- Get point at shape's edge

```js
var point = line.getPoint(t);
// var point = line.getPoint(t, point);
```

  - Arguments:
    - `t` : A value between 0 and 1, where 0 is the start, 0.5 is the middle and 1 is the end point of the line.
    - `point` : an existing point or returns a new point if point is not provided

- Get a random point inside shape

```js
var point = line.getRandomPoint();
// var point = line.getRandomPoint(point);  // modify point
```

- Get points around shape's edge

  - Based on quantity:

```js
var points = line.getPoints(quantity);
// var points = line.getPoints(quantity, null, pointsArray);  // push points
```

  - Based on stepRate:

```js
var points = line.getPoints(false, stepRate);
// var points = line.getPoints(false, stepRate, pointsArray);  // If pointsArray not provided a new array will be created.
```

  - `pointsArray` : an existing array
  - `stepRate` : distance between each point on the line

- Get points using _Bresenham_'s line algorithm

```js
var points = Phaser.Geom.Line.BresenhamPoints(line, step);
// var points = Phaser.Geom.Line.BresenhamPoints(line, step, points);  // push points
```

- Get points using easing function

```js
var points = Phaser.Geom.Line.GetEasedPoints(line, ease, quantity);
// var points = Phaser.Geom.Line.GetEasedPoints(line, ease, quantity, collinearThreshold, easeParams);
```

  - `ease` : String of ease function, or a custom function ( `function (t) { return value}`).
  - `quantity` : The number of points to return.
  - `collinearThreshold` : Each point is spaced out at least this distance apart. This helps reduce clustering in noisey eases.
  - `easeParams` : Array of ease parameters to go with the ease.

- Get the nearest point on a line perpendicular to the given point.

```js
var point = Phaser.Geom.Line.GetNearestPoint(line, pointIn);
// var point = Phaser.Geom.Line.GetNearestPoint(line, pointIn, point);
```

- Get the shortest distance from a Line to the given Point.

```js
var distance = Phaser.Geom.Line.GetShortestDistance(line, point);
```

### Equal

```js
var isEqual = Phaser.Geom.Line.Equals(line0, line1);
```

x1, y2, x2, y2 are equal.

### Intersection

#### Line to circle

- Is intersection

```js
var result = Phaser.Geom.Intersects.LineToCircle(line, circle);
// var result = Phaser.Geom.Intersects.LineToCircle(line, circle, nearest);
```

  - `nearest` : Nearest point on line.

- Get intersection points

```js
var result = Phaser.Geom.Intersects.GetLineToCircle(line, circle);
// var out = Phaser.Geom.Intersects.GetLineToCircle(line, circle, out);
```

#### Line to rectangle

- Is intersection

```js
var result = Phaser.Geom.Intersects.LineToRectangle(line, rect);
```

- Get intersection points

```js
var result = Phaser.Geom.Intersects.GetLineToRectangle(line, rect);
// var out = Phaser.Geom.Intersects.GetLineToRectangle(line, rect, out);
```

#### Line to triangle

- Is intersection

```js
var result = Phaser.Geom.Intersects.TriangleToLine(triangle, line);
```

- Get intersection points

```js
var result = Phaser.Geom.Intersects.GetTriangleToLine(triangle, line);
// var out = Phaser.Geom.Intersects.GetTriangleToLine(triangle, line, out);
```

#### Line to line

- Is intersection

```js
var isIntersection = Phaser.Geom.Intersects.LineToLine(line1, line2);
```

  - `isIntersection` : Return `true` if line1 and line2 are intersectioned

- Get intersection point

```js
var isIntersection = Phaser.Geom.Intersects.LineToLine(line1, line2, out);
```

  - `isIntersection` : Return `true` if line1 and line2 are intersectioned
  - `out` : intersected point

## Point

### Create point

```js
var point = new Phaser.Geom.Point(x, y);
```

### Clone point

```js
var point1 = Phaser.Geom.Point.Clone(point0);
```

### Draw on Graphics object

```js
// graphics.fillStyle(color, alpha);   // color: 0xRRGGBB
graphics.fillPointShape(point, size);
```

### Set properties

- All properties

```js
point.setTo(x, y);
```

or

```js
Phaser.Geom.Point.CopyFrom(source, dest);
```

- Position

```js
point.x = 0;
point.y = 0;
```

- Round
  - Ceil : Apply `Math.ceil()` to each coordinate of the given Point

    ```js
    var point = Phaser.Geom.Point.Ceil(point);
    ```

  - Floor : Apply `Math.floor()` to each coordinate of the given Point.

    ```js
    var point = Phaser.Geom.Point.Floor(point);
    ```

### Symmetry

- Invert : x = y, y = x

```js
var point = Phaser.Geom.Point.Invert(point);
```

- Negative : x = -x, y = -y

```js
var out = Phaser.Geom.Point.Negative(point);
// var out = Phaser.Geom.Point.Negative(point, out);  // modify out
```

### Get properties

- Position

```js
var x = point.x;
var y = point.y;
```

- Type:

```js
var type = point.type; // GEOM_CONST.POINT or 3
```

### Equal

```js
var isEqual = Phaser.Geom.Point.Equals(point0, point1);
```

x, y are equal.

### Points

- Centroid : center-point over some points

```js
var out = Phaser.Geom.Point.GetCentroid(points);
// var out = Phaser.Geom.Point.GetCentroid(points, out);  // modify out
```

- Calculates the Axis Aligned Bounding Box (or aabb) from an array of points (rectangle)

```js
var rect = Phaser.Geom.Point.GetRectangleFromPoints(points);
// var rect = Phaser.Geom.Point.GetRectangleFromPoints(points, rect);  // modify rect
```

- Interpolate

```js
var out = Phaser.Geom.Point.Interpolate(pointA, pointB, t); // out : point
// var out = Phaser.Geom.Point.Interpolate(pointA, pointB, t, out);  // modify out
```

### Intersection

- Point to line

```js
var result = Phaser.Geom.Intersects.PointToLine(point, line);
// var result = Phaser.Geom.Intersects.PointToLine(point, line, lineThickness);
```

```js
var result = Phaser.Geom.Intersects.PointToLineSegment(point, line);
```

### Point as Vector

Vector starting at (0,0)

- Magnitude : sqrt( (x * x) + (y * y) )

```js
var magnitude = Phaser.Geom.Point.GetMagnitude(point);
```

or

```js
var magnitudeSq = Phaser.Geom.Point.GetMagnitudeSq(point);
```

- Project

```js
var out = Phaser.Geom.Point.Project(from, to);
// var out = Phaser.Geom.Point.Project(from, to, out);  // modify out
```

or

```js
var out = Phaser.Geom.Point.ProjectUnit(from, to); // vector `from` and `to` are unit vector (length = 1)
// var out = Phaser.Geom.Point.ProjectUnit(from, to, out);  // modify out
```

## Polygon

### Create polygon

```js
var polygon = new Phaser.Geom.Polygon(points);
```

- `points` :
  - An array of number : `[x0, y0, x1, y1, ...]`
  - An array of points : `[{x:x0, y:y0}, {x:x1, y:y1}, ...]`
  - A string : `'x0 y0 x1 y1 ...'`

### Clone polygon

```js
var polygon1 = Phaser.Geom.Polygon.Clone(polygon0);
```

### Draw on Graphics object

- Fill shape

```js
// graphics.fillStyle(color, alpha);   // color: 0xRRGGBB
graphics.fillPoints(polygon.points, true);
```

- Stroke shape

```js
// graphics.lineStyle(lineWidth, color, alpha);   // color: 0xRRGGBB
graphics.strokePoints(polygon.points, true);
```

### Set properties

```js
polygon.setTo(points);
// points = [x0, y0, x1, y1, x2, y2, ...] , or [{x,y}, {x,y}, {x,y}, ...]
```

### Get properties

- Points

```js
var points = polygon.points; // array of points {x,y}
```

- Area

```js
var area = polygon.area;
```

- Number array

```js
var out = Phaser.Geom.Polygon.GetNumberArray(polygon);
// var out = Phaser.Geom.Polygon.GetNumberArray(polygon, out);  // modify out
```

  - `arr` : [x0, y0, x1, y1, x2, y2, ...]

- AABB (A minimum rectangle to cover this polygon)

```js
var out = Phaser.Geom.Polygon.GetAABB(polygon);
// var out = Phaser.Geom.Polygon.GetAABB(polygon, out);
```

  - `out` : A rectangle

- Type:

```js
var type = polygon.type; // GEOM_CONST.POLYGON or 4
```

### Point(s) & shape

- Point is inside shape

```js
var isInside = polygon.contains(x, y);
```

or

```js
var isInside = Phaser.Geom.Polygon.ContainsPoint(polygon, point);
```

- Translate : Shift points.

```js
Phaser.Geom.Polygon.Translate(polygon, x, y);
```

- Reverse the order of points.

```js
var polygon = Phaser.Geom.Polygon.Reverse(polygon);
```

- Smooth : Takes a Polygon object and applies Chaikin's smoothing algorithm on its points.

```js
Phaser.Geom.Polygon.Smooth(polygon);
```

- Simplify : Simplifies the points by running them through a combination of Douglas-Peucker and Radial Distance algorithms. Simplification dramatically reduces the number of points in a polygon while retaining its shape, giving a huge performance boost when processing it and also reducing visual noise.

```js
var polygon = Phaser.Geom.Polygon.Simplify(polygon);
// var polygon = Phaser.Geom.Polygon.Simplify(polygon, tolerance, highestQuality);
```

- Get points around the polygon's perimeter.

  - Based on quantity:

```js
var points = polygon.getPoints(quantity);
// var points = polygon.getPoints(quantity, null, pointsArray);  // If pointsArray not provided a new array will be created.
```

  - Based on stepRate:

```js
var points = polygon.getPoints(false, stepRate);
// var points = polygon.getPoints(false, stepRate, pointsArray);  // If pointsArray not provided a new array will be created.
```

  - `pointsArray` : an existing array
  - `stepRate` : sets the quantity by getting the perimeter of the Polygon divided it by the stepRate

### Vector to polygon

- Get closest point of intersection between a vector and an array of polygons

```js
var result = Phaser.Geom.Intersects.GetLineToPolygon(line, polygons);
// var out = Phaser.Geom.Intersects.GetLineToPolygon(line, polygons, isRay, out);
```

  - `line` : Vector of line object
  - `polygons` : A single polygon, or array of polygons
  - `isRay` : Is `line` a ray or a line segment?
  - `out` :
    - `out.x`, `out.y` : Intersection point
    - `out.z` : Closest intersection distance
    - `out.w` : Index of the polygon

- Projects rays out from the given point to each line segment of the polygons.

```js
var out = Phaser.Geom.Intersects.GetRaysFromPointToPolygon(x, y, polygons);
```

  - `x`, `y` : The point to project the rays from.
  - `polygons` : A single polygon, or array of polygons
  - `out` : An array containing all intersections
    - `out[i].x`, `out[i].y` : Intersection point
    - `out[i].z` : Angle of intersection
    - `out[i].w` : Index of the polygon

## Rectangle

### Create rectangle

```js
var rect = new Phaser.Geom.Rectangle(x, y, width, height);
```

### Create rectangle from points

All of the given points are on or within its bounds.

```js
var rect = Phaser.Geom.Rectangle.FromPoints(points);
// var rect = Phaser.Geom.Rectangle.FromPoints(points, rect);  // push rect
```

- `points` : an array with 4 points. `[x, y]`, or `{x:0, y:0}`

or

```js
var rect = Phaser.Geom.Rectangle.FromXY(x1, y1, x2, y2);
// var rect = Phaser.Geom.Rectangle.FromXY(x1, y1, x2, y2, rect);  // push rect
```

### Clone rectangle

```js
var rect1 = Phaser.Geom.Rectangle.Clone(rect0);
```

### Draw on Graphics object

- Fill shape

```js
// graphics.fillStyle(color, alpha);   // color: 0xRRGGBB
graphics.fillRectShape(rect);
```

- Stroke shape

```js
// graphics.lineStyle(lineWidth, color, alpha);   // color: 0xRRGGBB
graphics.strokeRectShape(rect);
```

> **Note:** `x` with positive/negative width is left/right bound; `y` with positive/negative height is top/bottom bound

### Set properties

- All properties

```js
rect.setTo(x, y, width, height);
```

or

```js
Phaser.Geom.Rectangle.CopyFrom(source, dest);
```

- Position

```js
rect.setPosition(x, y);
```

or

```js
rect.x = 0;
rect.y = 0;
```

or

```js
rect.left = 0; // rect.x, rect.width
rect.top = 0; // rect.y, rect.height
// rect.right = 0;   // rect.x, rect.width
// rect.bottom = 0;  // rect.y, rect.height
rect.centerX = 0; // rect.x
rect.centerY = 0; // rect.y
```

or

```js
Phaser.Geom.Rectangle.Offset(rect, dx, dy); // rect.x += dx, rect.y += dy
```

or

```js
Phaser.Geom.Rectangle.OffsetPoint(rect, point); // rect.x += point.x, rect.y += point.y
```

or

```js
Phaser.Geom.Rectangle.CenterOn(rect, x, y); // rect.x = x - (rect.width / 2), rect.y = y - (rect.height / 2)
```

- Size

```js
rect.setSize(width, height);
// rect.setSize(width);   // height = width
```

or

```js
rect.width = 0;
rect.height = 0;
```

  - Scale

    ```js
    Phaser.Geom.Rectangle.Scale(rect, x, y); // rect.width *= x, rect.height *= y;
    // Phaser.Geom.Rectangle.Scale(rect, x);   // y = x
    ```

  - Extend size to include points

    ```js
    Phaser.Geom.Rectangle.MergePoints(rect, points);
    ```

    - `points` : an array of points. `[x, y]`, or `{x:0, y:0}`

  - Extend size to include another rectangle

    ```js
    Phaser.Geom.Rectangle.MergeRect(target, source);
    ```

- Inflate

```js
Phaser.Geom.Rectangle.Inflate(rect, x, y);
```

1. change size to `width += x*2, height += y*2`
2. center on previous position

- Fits the target rectangle into the source rectangle

```js
Phaser.Geom.Rectangle.FitInside(target, source);
```

Preserves aspect ratio, scales and centers the target rectangle to the source rectangle

- Fits the target rectangle around the source rectangle

```js
Phaser.Geom.Rectangle.FitOutside(target, source);
```

Preserves aspect ratio, scales and centers the target rectangle to the source rectangle

- Ceil

```js
Phaser.Geom.Rectangle.Ceil(rect); // ceil x, y
```

```js
Phaser.Geom.Rectangle.CeilAll(rect); // ceil x, y, width, height
```

- Floor

```js
Phaser.Geom.Rectangle.Floor(rect); // floor x, y
```

```js
Phaser.Geom.Rectangle.FloorAll(rect); // floor x, y, width, height
```

### Get properties

- Position

```js
var x = rect.x;
var y = rect.y;
```

  - Bound

    ```js
    var top = rect.top;
    var left = rect.left;
    var right = rect.right;
    var bottom = rect.bottom;
    ```

    or

    ```js
    var points = Phaser.Geom.Rectangle.Decompose(rect);
    // var points = Phaser.Geom.Rectangle.Decompose(rect, points); // push result points
    ```

    - `points` : top-left, top-right, bottom-right, bottom-left

  - Center

    ```js
    var centerX = rect.centerX;
    var centerY = rect.centerY;
    ```

    or

    ```js
    var point = Phaser.Geom.Rectangle.GetCenter(rect);
    // var point = Phaser.Geom.Rectangle.GetCenter(rect, point);
    ```

- Size

```js
var width = rect.width;
var height = rect.height;
```

or

```js
var point = Phaser.Geom.Rectangle.GetSize(rect); // {x: rect.width, y: rect.height}
```

- Area

```js
var area = Phaser.Geom.Rectangle.Area(rect);
```

- Perimeter

```js
var perimeter = Phaser.Geom.Rectangle.Perimeter(rect); // 2 * (rect.width + rect.height)
```

- Aspect ratio

```js
var aspectRatio = Phaser.Geom.Rectangle.GetAspectRatio(rect); // rect.width / rect.height
```

- Lines around rectangle

```js
var topLine = rect.getLineA(); // top line of this rectangle
var rightLine = rect.getLineB(); // right line of this rectangle
var bottomLine = rect.getLineC(); // bottom line of this rectangle
var leftLine = rect.getLineD(); // left line of this rectangle
// var out = rect.getLineA(out);  // top line of this rectangle
```

- Type:

```js
var type = rect.type; // GEOM_CONST.RECTANGLE or 5
```

### Point(s) & shape

- Get point at shape's edge

```js
var point = rect.getPoint(t); // t : 0 ~ 1 (0= top-left, 0.5= bottom-right, 1= top-left)
// var point = rect.getPoint(t, point);
```

  - Arguments:
    - `t` : A value of 0 or 1 is at the top left corner, 0.5 is at the bottom right corner. Values 0 to 0.5 are on the top or the right side, values 0.5 to 1 are on the bottom or the left side.
    - `point` : an existing point or returns a new point if point is not provided

or

```js
var point = Phaser.Geom.Rectangle.PerimeterPoint(rect, angle); // angle in degrees
// var point = Phaser.Geom.Rectangle.PerimeterPoint(rect, angle, point);  // push point
```

- Get points around shape's edge

  - Based on quantity:

```js
var points = rect.getPoints(quantity);
// var points = rect.getPoints(quantity, null, pointsArray);  // push points
```

  - Based on stepRate:

```js
var points = rect.getPoints(false, stepRate);
// var points = rect.getPoints(false, stepRate, pointsArray);  // If pointsArray not provided a new array will be created.
```

  - `pointsArray` : an existing array
  - `stepRate` : if quantity is 0, determines the normalized distance between each returned point

- Point is inside shape

```js
var isInside = rect.contains(x, y);
```

or

```js
var isInside = Phaser.Geom.Rectangle.ContainsPoint(rect, point);
```

- Get a random point inside shape

```js
var point = rect.getRandomPoint();
// var point = rect.getRandomPoint(point);  // modify point
```

- Get a random point outside shape

```js
var point = Phaser.Geom.Rectangle.RandomOutside(outer, inner);
// var point = Phaser.Geom.Rectangle.RandomOutside(outer, inner, point); // modify point
```

- Rectangle is inside shape

```js
var isInside = Phaser.Geom.Rectangle.ContainsRect(rectA, rectB); // rectB is inside rectA
```

### Multiple rectangles

- Is overlapping

```js
var isOverlapping = Phaser.Geom.Rectangle.Overlaps(rectA, rectB);
```

- Get intersection rectangle

```js
var rect = Phaser.Geom.Rectangle.Intersection(rectA, rectB);
var rect = Phaser.Geom.Rectangle.Intersection(rectA, rectB, rect); // push rect
```

- Get union rectangle

```js
var rect = Phaser.Geom.Rectangle.Union(rectA, rectB);
var rect = Phaser.Geom.Rectangle.Union(rectA, rectB, rect); // push rect
```

### Empty

- Set empty

```js
rect.setEmpty(); // rect.x = 0, rect.y = 0, rect.width = 0, rect.height = 0
```

- Is empty

```js
var isEmpty = rect.isEmpty(); // rect.radius <= 0;
```

### Equal

- Position, width, and height are the same

```js
var isEqual = Phaser.Geom.Rectangle.Equals(rect0, rect1);
```

- Width and height are the same

```js
var isEqual = Phaser.Geom.Rectangle.SameDimensions(rect0, rect1);
```

### Intersection

#### Rectangle to circle

- Is intersection

```js
var result = Phaser.Geom.Intersects.CircleToRectangle(circle, rect);
```

- Get intersection points

```js
var result = Phaser.Geom.Intersects.GetCircleToRectangle(circle, rect);
// var out = Phaser.Geom.Intersects.GetCircleToRectangle(circle, rect, out);
```

#### Rectangle to rectangle

- Is intersection

```js
var result = Phaser.Geom.Intersects.RectangleToRectangle(rectA, rectB);
```

- Get intersection points

```js
var result = Phaser.Geom.Intersects.GetRectangleToRectangle(rectA, rectB);
// var out = Phaser.Geom.Intersects.GetRectangleToRectangle(rectA, rectB, out);
```

#### Rectangle to triangle

- Is intersection

```js
var result = Phaser.Geom.Intersects.RectangleToTriangle(rect, triangle);
```

- Get intersection points

```js
var result = Phaser.Geom.Intersects.GetRectangleToTriangle(rect, triangle);
// var out = Phaser.Geom.Intersects.GetRectangleToTriangle(rect, triangle, out);
```

#### Rectangle to line

- Is intersection

```js
var result = Phaser.Geom.Intersects.LineToRectangle(line, rect);
```

- Get intersection points

```js
var result = Phaser.Geom.Intersects.GetLineToRectangle(line, rect);
// var out = Phaser.Geom.Intersects.GetLineToRectangle(line, rect, out);
```

## Triangle

### Create triangle

```js
var triangle = new Phaser.Geom.Triangle(x1, y1, x2, y2, x3, y3);
```

### Clone triangle

```js
var triangle1 = Phaser.Geom.Triangle.Clone(triangle0);
```

### Equilateral triangle

```js
var triangle = Phaser.Geom.Triangle.BuildEquilateral(x1, y1, length);
```

### Right triangle

```js
var triangle = Phaser.Geom.Triangle.BuildRight(x1, y1, width, height);
```

### Polygon to triangles

```js
var out = Phaser.Geom.Triangle.BuildFromPolygon(data);
// var out = Phaser.Geom.Triangle.BuildFromPolygon(data, holes, scaleX, scaleY);
// out = Phaser.Geom.Triangle.BuildFromPolygon(data, holes, scaleX, scaleY, out);
```

- `data` : A flat array of vertice coordinates like `[x0,y0, x1,y1, x2,y2, ...]`
- `out` : Array of triangles

### Draw on Graphics object

- Fill shape

```js
// graphics.fillStyle(color, alpha);   // color: 0xRRGGBB
graphics.fillTriangleShape(triangle);
```

- Stroke shape

```js
// graphics.lineStyle(lineWidth, color, alpha);   // color: 0xRRGGBB
graphics.strokeTriangleShape(triangle);
```

### Set properties

- All properties

```js
triangle.setTo(x1, y1, x2, y2, x3, y3);
```

or

```js
Phaser.Geom.Triangle.CopyFrom(source, dest);
```

- Position

```js
triangle.x1 = 0;
triangle.y1 = 0;
triangle.x2 = 0;
triangle.y2 = 0;
triangle.x3 = 0;
triangle.y3 = 0;
```

or

```js
triangle.left = 0; // triangle.x1, triangle.x2, triangle.x3
triangle.top = 0; // triangle.y1, triangle.y2, triangle.y3
// triangle.right = 0;   // triangle.x1, triangle.x2, triangle.x3
// triangle.bottom = 0;  // triangle.y1, triangle.y2, triangle.y3
```

or

```js
Phaser.Geom.Triangle.Offset(triangle, dx, dy); // triangle.x += dx, triangle.y += dy
```

or

```js
Phaser.Geom.Triangle.CenterOn(triangle, x, y);
```

- Rotate
  - Rotate around center (incenter)

    ```js
    var triangle = Phaser.Geom.Triangle.Rotate(triangle, angle);
    ```

    - `angle` : Radian

  - Rotate around point

    ```js
    var triangle = Phaser.Geom.Triangle.RotateAroundPoint(
      triangle,
      point,
      angle
    );
    ```

    - `point` : `{x, y}`
    - `angle` : Radian

  - Rotate around (x,y)

    ```js
    var triangle = Phaser.Geom.Triangle.RotateAroundXY(triangle, x, y, angle);
    ```

    - `angle` : Radian

### Get properties

- Position

```js
var x1 = triangle.x1;
var y1 = triangle.y1;
var x2 = triangle.x2;
var y2 = triangle.y2;
var x3 = triangle.x3;
var y3 = triangle.y3;
var top = triangle.top;
var left = triangle.left;
var right = triangle.right;
var bottom = triangle.bottom;
```

or

```js
var out = Phaser.Geom.Triangle.Decompose(triangle); // out: [{x1,y1}, {x2,y2}, {x3,y3}]
// var out = Phaser.Geom.Triangle.Decompose(triangle, out);
```

- Perimeter

```js
var perimeter = Phaser.Geom.Triangle.Perimeter(triangle);
```

- Area

```js
var area = Phaser.Geom.Triangle.Area(triangle);
```

- Lines around triangle

```js
var line12 = rect.getLineA(); // line from (x1, y1) to (x2, y2)
var line23 = rect.getLineB(); // line from (x2, y2) to (x3, y3)
var line31 = rect.getLineC(); // line from (x3, y3) to (x1, y1)
```

- Centroid

```js
var out = Phaser.Geom.Triangle.Centroid(triangle); // out: {x,y}
```

- Incenter

```js
var out = Phaser.Geom.Triangle.InCenter(triangle); // out: {x,y}
// var out = Phaser.Geom.Triangle.InCenter(triangle, out);
```

- Circumcenter

```js
var out = Phaser.Geom.Triangle.CircumCenter(triangle); // out: {x,y}
// var out = Phaser.Geom.Triangle.CircumCenter(triangle, out);
```

- Circumcircle

```js
var out = Phaser.Geom.Triangle.CircumCircle(triangle); // out: a circle object
// var out = Phaser.Geom.Triangle.CircumCircle(triangle, out);
```

- Type:

```js
var type = triangle.type; // GEOM_CONST.TRIANGLE or 6
```

### Point(s) & shape

- Get point at shape's edge

```js
var point = triangle.getPoint(t);
// var point = triangle.getPoint(t, point);
```

  - Arguments:
    - `t` : A value of 0 or 1 is the first point. Values 0 to 1 returns a point along the perimeter of the triangle.
    - `point` : an existing point or returns a new point if point is not provided

- Get a random point inside shape

```js
var point = triangle.getRandomPoint();
// var point = triangle.getRandomPoint(point);  // modify point
```

- Get points around triangle's edge

  - Based on quantity:

```js
var points = triangle.getPoints(quantity);
// var points = triangle.getPoints(quantity, null, points);  // push points
```

  - Based on stepRate:

```js
var points = triangle.getPoints(false, stepRate);
// var points = triangle.getPoints(false, stepRate, points);  // If pointsArray not provided a new array will be created.
```

  - `pointsArray` : an existing array
  - `stepRate` : used only when quantity is falsey and is the distance between two points

- Point is inside shape

```js
var isInside = triangle.contains(x, y);
```

or

```js
var isInside = Phaser.Geom.Triangle.ContainsPoint(triangle, point);
```

  - Points inside shape

    ```js
    var out = Phaser.Geom.Triangle.ContainsArray(triangle, points, returnFirst);
    // var out = Phaser.Geom.Triangle.ContainsArray(triangle, points, returnFirst, out);
    ```

    - `out` : Points inside triangle
    - `returnFirst` : True to get fist matched point

### Equal

```js
var isEqual = Phaser.Geom.Triangle.Equals(triangle0, triangle1);
```

Position and radius are equal.

### Intersection

#### Triangle to circle

- Is intersection

```js
var result = Phaser.Geom.Intersects.TriangleToCircle(triangle, circle);
```

- Get intersection points

```js
var result = Phaser.Geom.Intersects.GetTriangleToCircle(triangle, circle);
// var out = Phaser.Geom.Intersects.GetTriangleToCircle(triangle, circle, out);
```

#### Triangle to rectangle

- Is intersection

```js
var result = Phaser.Geom.Intersects.RectangleToTriangle(rect, triangle);
```

- Get intersection points

```js
var result = Phaser.Geom.Intersects.GetRectangleToTriangle(rect, triangle);
// var out = Phaser.Geom.Intersects.GetRectangleToTriangle(rect, triangle, out);
```

#### Triangle to triangle

- Is intersection

```js
var result = Phaser.Geom.Intersects.TriangleToTriangle(triangleA, triangleB);
```

- Get intersection points

```js
var result = Phaser.Geom.Intersects.GetTriangleToTriangle(
    triangleA,
    triangleB
);
// var out = Phaser.Geom.Intersects.GetTriangleToTriangle(triangleA, triangleB, out);
```

#### Triangle to line

- Is intersection

```js
var result = Phaser.Geom.Intersects.TriangleToLine(triangle, line);
```

- Get intersection points

```js
var result = Phaser.Geom.Intersects.GetTriangleToLine(triangle, line);
// var out = Phaser.Geom.Intersects.GetTriangleToLine(triangle, line, out);
```

## Author Credits

Content on this page includes work by:

- [RexRainbow](https://github.com/rexrainbow)

---

**Source:** https://docs.phaser.io/phaser/concepts/geometry

**Last Updated:** July 30, 2025
