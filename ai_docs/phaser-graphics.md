# Graphics

A Guide to the Phaser Graphics Game Object

A Graphics object is a way to draw primitive shapes to your game. Primitives include forms of geometry, such as Rectangles, Circles, and Polygons. They also include lines, arcs and curves. When you initially create a Graphics object it will be empty. To draw to it you must first specify a line style or fill style (or both), draw shapes using paths, and finally fill or stroke them.

```javascript
graphics.lineStyle(5, 0xff00ff, 1.0);
graphics.beginPath();
graphics.moveTo(100, 100);
graphics.lineTo(200, 200);
graphics.closePath();
graphics.strokePath();
```

There are also many helpful methods that draw and fill/stroke common shapes for you.

```javascript
graphics.lineStyle(5, 0xff00ff, 1.0);
graphics.fillStyle(0xffffff, 1.0);
graphics.fillRect(50, 50, 400, 200);
graphics.strokeRect(50, 50, 400, 200);
```

When a Graphics object is rendered it will render differently based on if the game is running under Canvas or WebGL. Under Canvas it will use the HTML Canvas context drawing operations to draw the path. Under WebGL the graphics data is decomposed into polygons. Both of these are expensive processes, especially with complex shapes.

If your Graphics object doesn't change much (or at all) once you've drawn your shape to it, then you will help performance by calling Phaser.GameObjects.Graphics#generateTexture. This will 'bake' the Graphics object into a Texture, and return it. You can then use this Texture for Sprites or other display objects. If your Graphics object updates frequently then you should avoid doing this, as it will constantly generate new textures, which will consume memory.

As you can tell, Graphics objects are a bit of a trade-off. While they are extremely useful, you need to be careful in their complexity and quantity of them in your game.

## Basic usage

### Add graphics object

```javascript
var graphics = this.add.graphics();
```

or

```javascript
var graphics = this.add.graphics({
  x: 0,
  y: 0,

  // lineStyle: {
  //     width: 1,
  //     color: 0xffffff,
  //     alpha: 1
  // },
  // fillStyle: {
  //     color: 0xffffff,
  //     alpha: 1
  // },

  add: true,
});
```

### Custom class

- Define class

```javascript
class MyGraphics extends Phaser.GameObjects.Graphics {
    constructor(scene, options) {
      super(scene, options);
      // ...
      this.add.existing(this);
    }
    // ...

    // preUpdate(time, delta) {}
}
```

  - `this.add.existing(gameObject)` : Adds an existing Game Object to this Scene.
    - If the Game Object renders, it will be added to the Display List.
    - If it has a `preUpdate` method, it will be added to the Update List.
- Create instance

```javascript
var graphics = new MyGraphics(this, options);
```

## Drawing commands

### Set line and fill style

- Set default line style and fill style

```javascript
graphics.setDefaultStyles({
    lineStyle: {
      width: 1,
      color: 0xffffff,
      alpha: 1,
    },
    fillStyle: {
      color: 0xffffff,
      alpha: 1,
    },
});
```

- Set line style

```javascript
graphics.lineStyle(lineWidth, color, alpha); // color: 0xRRGGBB
```

- Set fill style
  - Fill color

    ```javascript
    graphics.fillStyle(color, alpha); // color: 0xRRGGBB
    ```

  - Fill gradient color (WebGL only)

    ```javascript
    graphics.fillGradientStyle(
      topLeft,
      topRight,
      bottomLeft,
      bottomRight,
      alpha
    ); // alpha= 1
    // graphics.fillGradientStyle(topLeft, topRight, bottomLeft, bottomRight, alphaTopLeft, alphaTopRight, alphaBottomLeft, alphaBottomRight);
    ```

    - `topLeft` : The tint being applied to the top-left of the Game Object.
    - `topRight` : The tint being applied to the top-right of the Game Object.
    - `bottomLeft` : The tint being applied to the bottom-left of the Game Object.
    - `bottomRight` : The tint being applied to the bottom-right of the Game Object.
    - `alphaTopLeft` : The top left alpha value.
    - `alphaTopRight` : The top right alpha value.
    - `alphaBottomLeft` : The bottom left alpha value.
    - `alphaBottomRight` : The bottom right alpha value.

### Clear/Erase all drawings

```javascript
graphics.clear();
```

### Drawing paths

```javascript
graphics.beginPath();
graphics.closePath();
graphics.fillPath(); // = graphics.fill()
graphics.strokePath(); // = graphics.stroke()
```

### Drawing rectangles

```javascript
graphics.fillRectShape(rect); // rect: {x, y, width, height}
graphics.fillRect(x, y, width, height);
graphics.strokeRectShape(rect); // rect: {x, y, width, height}
graphics.strokeRect(x, y, width, height);
```

### Drawing rounded rectangles

```javascript
graphics.fillRoundedRect(x, y, width, height, radius);
graphics.strokeRoundedRect(x, y, width, height, radius);
```

- `radius` : number or an object `{tl, tr, bl, br}`,
  - Positive value : Convex corner.
  - Negative value : Concave corner.

### Drawing triangles

```javascript
graphics.fillTriangleShape(triangle); // triangle: {x1, y1, x2, y2, x3, y3}
graphics.fillTriangle(x1, y1, x2, y2, x3, y3);
graphics.strokeTriangleShape(triangle); // triangle: {x1, y1, x2, y2, x3, y3}
graphics.strokeTriangle(x1, y1, x2, y2, x3, y3);
```

### Drawing points

```javascript
graphics.fillPointShape(point, size); // point: {x, y}
graphics.fillPoint(x, y, size);
```

### Drawing lines

```javascript
graphics.strokeLineShape(line); // line: {x1, y1, x2, y2}
graphics.lineBetween(x1, y1, x2, y2);
graphics.lineTo(x, y);
graphics.moveTo(x, y);
```

### Drawing a series of lines

```javascript
graphics.strokePoints(points, closeShape, closePath, endIndex); // points: [{x, y}, ...]
graphics.fillPoints(points, closeShape, closePath, endIndex); // points: [{x, y}, ...]
```

- `points` : Array of `{x, y}`
- `closeShape` : When `true`, the shape is closed by joining the last point to the first point.
- `closePath` : When `true`, the path is closed before being stroked.
- `endIndex` : The index of `points` to stop drawing at. Defaults to `points.length`.

### Drawing circles

```javascript
graphics.fillCircleShape(circle); // circle: {x, y, radius}
graphics.fillCircle(x, y, radius);
graphics.strokeCircleShape(circle); // circle: {x, y, radius}
graphics.strokeCircle(x, y, radius);
```

Draw or fill circle shape by points.

### Drawing ellipses

```javascript
graphics.strokeEllipseShape(ellipse, smoothness); // ellipse: Phaser.Geom.Ellipse
graphics.strokeEllipse(x, y, width, height, smoothness);
graphics.fillEllipseShape(ellipse, smoothness); // ellipse: Phaser.Geom.Ellipse
graphics.fillEllipse(x, y, width, height, smoothness);
```

Draw or fill ellipse shape by points.

### Drawing arcs

```javascript
graphics.arc(x, y, radius, startAngle, endAngle, anticlockwise);
graphics.arc(x, y, radius, startAngle, endAngle, anticlockwise, overshoot);
```

Draw arc curve by points.

### Drawing pie-chart slices

```javascript
graphics.slice(x, y, radius, startAngle, endAngle, anticlockwise);
graphics.slice(x, y, radius, startAngle, endAngle, anticlockwise, overshoot);
```

Draw pie-chart slice shape by points.

Fill this shape

```javascript
graphics.fillPath();
```

### Clear pattern

```javascript
graphics.setTexture();
```

### Transfer

```javascript
graphics.save();
graphics.restore();
graphics.translateCanvas(x, y);
graphics.scaleCanvas(x, y);
graphics.rotateCanvas(radians);
```

### Generate texture

```javascript
graphics.generateTexture(key, width, height); // key: texture key
```

### Create mask

```javascript
var mask = graphics.createGeometryMask();
```

## Shapes

### Arc

Draws an arc shape. You can control the start and end angles of the arc, as well as if the angles are winding clockwise or anti-clockwise. The default settings renders a complete circle.

#### Create shape

```javascript
var arc = this.add.arc(
  x,
  y,
  radius,
  startAngle,
  endAngle,
  anticlockwise,
  fillColor
);
// var arc = this.add.arc(x, y, radius, startAngle, endAngle, anticlockwise, fillColor, fillAlpha);
```

#### Custom class

- Define class

```javascript
class MyArc extends Phaser.GameObjects.Arc {
    constructor(
      scene,
      x,
      y,
      radius,
      startAngle,
      endAngle,
      anticlockwise,
      fillColor
    ) {
      super(
        scene,
        x,
        y,
        radius,
        startAngle,
        endAngle,
        anticlockwise,
        fillColor
      );
      // ...
      this.add.existing(this);
    }
    // ...

    // preUpdate(time, delta) {}
}
```

  - `this.add.existing(gameObject)` : Adds an existing Game Object to this Scene.
    - If the Game Object renders, it will be added to the Display List.
    - If it has a `preUpdate` method, it will be added to the Update List.
- Create instance

```javascript
var arc = new MyArc(
    scene,
    x,
    y,
    radius,
    startAngle,
    endAngle,
    anticlockwise,
    fillColor
);
```

#### Color

- Fill color
  - Get

    ```javascript
    var color = arc.fillColor;
    var alpha = arc.fillAlpha;
    ```

  - Set

    ```javascript
    arc.setFillStyle(color, alpha);
    ```

  - Clear

    ```javascript
    arc.setFillStyle();
    ```
- Stroke color
  - Get

    ```javascript
    var color = arc.strokeColor;
    ```

  - Set

    ```javascript
    arc.setStrokeStyle(lineWidth, color, alpha);
    ```

  - Clear

    ```javascript
    arc.setStrokeStyle();
    ```

**Warning:** No tint methods. Uses `arc.setFillStyle(color, alpha)` to change color.

#### Alpha

- Get

```javascript
var alpha = arc.alpha;
```

- Set

```javascript
arc.setAlpha(alpha);
// arc.alpha = alpha;
```

#### Angle

- Start angle, in degrees.
  - Get

    ```javascript
    var startAngle = arc.startAngle;
    ```

  - Set

    ```javascript
    arc.setStartAngle(startAngle);
    // arc.setStartAngle(startAngle, anticlockwise);
    ```

    or

    ```javascript
    arc.startAngle = startAngle;
    ```
- End angle, in degrees.
  - Get

    ```javascript
    var endAngle = arc.endAngle;
    ```

  - Set

    ```javascript
    arc.seEndAngle(endAngle);
    ```

    or

    ```javascript
    arc.endAngle = endAngle;
    ```
- Anticlockwise ( `true`, or `false`)
  - Get

    ```javascript
    var anticlockwise = arc.anticlockwise;
    ```

  - Set

    ```javascript
    arc.anticlockwise = anticlockwise;
    ```

#### Radius

- Get

```javascript
var radius = arc.radius;
```

- Set

```javascript
arc.setRadius(radius);
```

or

```javascript
arc.radius = radius;
```

#### Smoother arcs

Increase this value for smoother arcs, at the cost of more polygons being rendered. Default is `0.01`

- Get

```javascript
var iterations = arc.iterations;
```

- Set

```javascript
arc.iterations = iterations;
```

#### Display size

- Get

```javascript
var width = arc.displayWidth;
var height = arc.displayHeight;
```

- Set

```javascript
arc.setDisplaySize(width, height);
```

or

```javascript
arc.displayWidth = width;
arc.displayHeight = height;
```

#### Create mask

```javascript
var mask = arc.createGeometryMask();
```

### Circle

Draws a circle shape.

#### Create shape object

```javascript
var circle = this.add.circle(x, y, radius, fillColor);
// var circle = this.add.circle(x, y, radius, fillColor, fillAlpha);
```

#### Custom class

- Define class

```javascript
class MyCircle extends Phaser.GameObjects.Arc {
    constructor(scene, x, y, radius, fillColor, fillAlpha) {
      super(scene, x, y, radius, 0, 360, false, fillColor, fillAlpha);
      // ...
      this.add.existing(this);
    }
    // ...

    // preUpdate(time, delta) {}
}
```

  - `this.add.existing(gameObject)` : Adds an existing Game Object to this Scene.
    - If the Game Object renders, it will be added to the Display List.
    - If it has a `preUpdate` method, it will be added to the Update List.
- Create instance

```javascript
var circle = new MyCircle(scene, x, y, radius, fillColor, fillAlpha);
```

#### Color

- Fill color
  - Get

    ```javascript
    var color = circle.fillColor;
    var alpha = circle.fillAlpha;
    ```

  - Set

    ```javascript
    circle.setFillStyle(color, alpha);
    ```

  - Clear

    ```javascript
    circle.setFillStyle();
    ```
- Stroke color
  - Get

    ```javascript
    var color = circle.strokeColor;
    ```

  - Set

    ```javascript
    circle.setStrokeStyle(lineWidth, color, alpha);
    ```

  - Clear

    ```javascript
    circle.setStrokeStyle();
    ```

**Warning:** No tint methods. Uses `circle.setFillStyle(color, alpha)` to change color.

#### Alpha

- Get

```javascript
var alpha = circle.alpha;
```

- Set

```javascript
circle.setAlpha(alpha);
// circle.alpha = alpha;
```

#### Radius

- Radius
  - Get

    ```javascript
    var radius = circle.radius;
    ```

  - Set

    ```javascript
    circle.setRadius(radius);
    ```

    or

    ```javascript
    circle.radius = radius;
    ```

#### Smoother arcs

Increase this value for smoother arcs, at the cost of more polygons being rendered. Default is `0.01`

- Get

```javascript
var iterations = circle.iterations;
```

- Set

```javascript
circle.iterations = iterations;
```

#### Display size

- Get

```javascript
var width = circle.displayWidth;
var height = circle.displayHeight;
```

- Set

```javascript
circle.setDisplaySize(width, height);
```

or

```javascript
circle.displayWidth = width;
circle.displayHeight = height;
```

#### Create mask

```javascript
var mask = circle.createGeometryMask();
```

### Curve

Draw a curve shape.

#### Create shape object

```javascript
var curve = this.add.curve(x, y, path, fillColor);
// var curve = this.add.curve(x, y, path, fillColor, fillAlpha);
```

- `path` : [Path object](https://docs.phaser.io/phaser/concepts/math#path).

#### Custom class

- Define class

```javascript
class MyCurve extends Phaser.GameObjects.Curve {
    constructor(scene, x, y, path, fillColor, fillAlpha) {
      super(scene, x, y, path, fillColor, fillAlpha);
      // ...
      this.add.existing(this);
    }
    // ...

    // preUpdate(time, delta) {}
}
```

  - `this.add.existing(gameObject)` : Adds an existing Game Object to this Scene.
    - If the Game Object renders, it will be added to the Display List.
    - If it has a `preUpdate` method, it will be added to the Update List.
- Create instance

```javascript
var curve = new MyCurve(scene, x, y, path, fillColor, fillAlpha);
```

#### Color

- Fill color
  - Get

    ```javascript
    var color = curve.fillColor;
    var alpha = curve.fillAlpha;
    ```

  - Set

    ```javascript
    curve.setFillStyle(color, alpha);
    ```

  - Clear

    ```javascript
    curve.setFillStyle();
    ```
- Stroke color
  - Get

    ```javascript
    var color = curve.strokeColor;
    ```

  - Set

    ```javascript
    curve.setStrokeStyle(lineWidth, color, alpha);
    ```

  - Clear

    ```javascript
    curve.setStrokeStyle();
    ```

**Warning:** No tint methods. Uses `curve.setFillStyle(color, alpha)` to change color.

#### Alpha

- Get

```javascript
var alpha = curve.alpha;
```

- Set

```javascript
curve.setAlpha(alpha);
// curve.alpha = alpha;
```

#### Smoothness

The number of points used when rendering it. Increase this value for smoother curves, at the cost of more polygons being rendered.

```javascript
curve.setSmoothness(smoothness);
```

or

```javascript
curve.smoothness = smoothness;
```

#### Display size

- Get

```javascript
var width = curve.displayWidth;
var height = curve.displayHeight;
```

- Set

```javascript
curve.setDisplaySize(width, height);
```

or

```javascript
curve.displayWidth = width;
curve.displayHeight = height;
```

#### Create mask

```javascript
var mask = curve.createGeometryMask();
```

### Ellipse

Draw an ellipse shape.

#### Create shape object

```javascript
var ellipse = this.add.ellipse(x, y, width, height, fillColor);
// var ellipse = this.add.ellipse(x, y, width, height, fillColor, fillAlpha);
```

#### Custom class

- Define class

```javascript
class MyEllipse extends Phaser.GameObjects.Ellipse {
    constructor(scene, x, y, width, height, fillColor, fillAlpha) {
      super(scene, x, y, width, height, fillColor, fillAlpha);
      // ...
      this.add.existing(this);
    }
    // ...

    // preUpdate(time, delta) {}
}
```

  - `this.add.existing(gameObject)` : Adds an existing Game Object to this Scene.
    - If the Game Object renders, it will be added to the Display List.
    - If it has a `preUpdate` method, it will be added to the Update List.
- Create instance

```javascript
var ellipse = new MyEllipse(scene, x, y, width, height, fillColor, fillAlpha);
```

#### Color

- Fill color
  - Get

    ```javascript
    var color = ellipse.fillColor;
    var alpha = ellipse.fillAlpha;
    ```

  - Set

    ```javascript
    ellipse.setFillStyle(color, alpha);
    ```

  - Clear

    ```javascript
    ellipse.setFillStyle();
    ```
- Stroke color
  - Get

    ```javascript
    var color = ellipse.strokeColor;
    ```

  - Set

    ```javascript
    ellipse.setStrokeStyle(lineWidth, color, alpha);
    ```

  - Clear

    ```javascript
    ellipse.setStrokeStyle();
    ```

**Warning:** No tint methods. Uses `ellipse.setFillStyle(color, alpha)` to change color.

#### Alpha

- Get

```javascript
var alpha = ellipse.alpha;
```

- Set

```javascript
ellipse.setAlpha(alpha);
// ellipse.alpha = alpha;
```

#### Size

- Get

```javascript
var width = ellipse.width;
var height = ellipse.height;
```

- Set

```javascript
ellipse.setSize(width, height);
```

#### Display size

- Get

```javascript
var width = ellipse.displayWidth;
var height = ellipse.displayHeight;
```

- Set

```javascript
ellipse.setDisplaySize(width, height);
```

or

```javascript
ellipse.displayWidth = width;
ellipse.displayHeight = height;
```

#### Smoothness

The number of points used when rendering it. Increase this value for smoother curves, at the cost of more polygons being rendered.

```javascript
ellipse.setSmoothness(smoothness);
```

or

```javascript
ellipse.smoothness = smoothness;
```

#### Create mask

```javascript
var mask = ellipse.createGeometryMask();
```

### Grid

Draw a grid shape.

#### Create shape object

```javascript
var grid = this.add.grid(
  x,
  y,
  width,
  height,
  cellWidth,
  cellHeight,
  fillColor,
  fillAlpha,
  outlineFillColor,
  outlineFillAlpha
);
```

#### Custom class

- Define class

```javascript
class MyGrid extends Phaser.GameObjects.Grid {
    constructor(
      scene,
      x,
      y,
      width,
      height,
      cellWidth,
      cellHeight,
      fillColor,
      fillAlpha,
      outlineFillColor,
      outlineFillAlpha
    ) {
      super(
        scene,
        x,
        y,
        width,
        height,
        cellWidth,
        cellHeight,
        fillColor,
        fillAlpha,
        outlineFillColor,
        outlineFillAlpha
      );
      // ...
      this.add.existing(this);
    }
    // ...

    // preUpdate(time, delta) {}
}
```

  - `this.add.existing(gameObject)` : Adds an existing Game Object to this Scene.
    - If the Game Object renders, it will be added to the Display List.
    - If it has a `preUpdate` method, it will be added to the Update List.
- Create instance

```javascript
var grid = new MyGrid(
    scene,
    x,
    y,
    width,
    height,
    cellWidth,
    cellHeight,
    fillColor,
    fillAlpha,
    outlineFillColor,
    outlineFillAlpha
);
```

#### Color

- Fill color
  - Get

    ```javascript
    var color = grid.fillColor;
    var alpha = grid.fillAlpha;
    ```

  - Set

    ```javascript
    grid.setFillStyle(color, alpha);
    ```

  - Clear

    ```javascript
    grid.setFillStyle();
    ```
- Stroke color
  - Get

    ```javascript
    var color = grid.strokeColor;
    ```

  - Set

    ```javascript
    grid.setStrokeStyle(lineWidth, color, alpha);
    ```

  - Clear

    ```javascript
    grid.setStrokeStyle();
    ```
- Alternating color
  - Get

    ```javascript
    var color = grid.altFillColor;
    ```

  - Set

    ```javascript
    grid.setAltFillStyle(color, alpha);
    ```

  - Clear

    ```javascript
    grid.setAltFillStyle();
    ```
- Outline color
  - Get

    ```javascript
    var color = grid.outlineFillColor;
    ```

  - Set

    ```javascript
    grid.setOutlineStyle(color, alpha);
    ```

  - Clear

    ```javascript
    grid.setOutlineStyle();
    ```

**Warning:** No tint methods. Uses `grid.setFillStyle(color, alpha)` to change color.

#### Alpha

- Get

```javascript
var alpha = grid.alpha;
```

- Set

```javascript
grid.setAlpha(alpha);
// grid.alpha = alpha;
```

#### Display size

- Get

```javascript
var width = grid.displayWidth;
var height = grid.displayHeight;
```

- Set

```javascript
grid.setDisplaySize(width, height);
```

or

```javascript
grid.displayWidth = width;
grid.displayHeight = height;
```

#### Create mask

```javascript
var mask = grid.createGeometryMask();
```

### IsoBox

An IsoBox is an 'isometric' rectangle. Each face of it has a different fill color. You can set the color of the top, left and right faces of the rectangle respectively. You can also choose which of the faces are rendered via the `showTop`, `showLeft` and `showRight` properties.

You cannot view an IsoBox from under-neath, however you can change the 'angle' by setting the `projection` property.

#### Create shape object

```javascript
var isoBox = this.add.isobox(
  x,
  y,
  width,
  height,
  fillTop,
  fillLeft,
  fillRight
);
```

#### Custom class

- Define class

```javascript
class MyIsoBox extends Phaser.GameObjects.IsoBox {
    constructor(scene, x, y, width, height, fillTop, fillLeft, fillRight) {
      super(scene, x, y, width, height, fillTop, fillLeft, fillRight);
      // ...
      this.add.existing(this);
    }
    // ...

    // preUpdate(time, delta) {}
}
```

  - `this.add.existing(gameObject)` : Adds an existing Game Object to this Scene.
    - If the Game Object renders, it will be added to the Display List.
    - If it has a `preUpdate` method, it will be added to the Update List.
- Create instance

```javascript
var isoBox = new MyIsoBox(
    scene,
    x,
    y,
    width,
    height,
    fillTop,
    fillLeft,
    fillRight
);
```

#### Set color

- Fill color

```javascript
isoBox.setFillStyle(fillTop, fillLeft, fillRight);
```

- Show face

```javascript
isoBox.setFaces(showTop, showLeft, showRight);
```

  - `showTop`, `showLeft`, `showRight`: Set `true` to show that face

**Warning:** No tint methods. Uses `isoBox.setFillStyle(fillTop, fillLeft, fillRight)` to change color.

#### Alpha

- Get

```javascript
var alpha = isoBox.alpha;
```

- Set

```javascript
isoBox.setAlpha(alpha);
// isoBox.alpha = alpha;
```

#### Projection

The `projection` level of the iso box. Change this to change the 'angle' at which you are looking at the box.

- Get

```javascript
var projection = isoBox.projection;
```

- Set

```javascript
isoBox.setProjection(value);
```

or

```javascript
isoBox.projection = value;
```

#### Display size

- Get

```javascript
var width = isoBox.displayWidth;
var height = isoBox.displayHeight;
```

- Set

```javascript
isoBox.setDisplaySize(width, height);
```

or

```javascript
isoBox.displayWidth = width;
isoBox.displayHeight = height;
```

#### Create mask

```javascript
var mask = isoBox.createGeometryMask();
```

### IsoTriangle

An IsoTriangle is an 'isometric' triangle. Think of it like a pyramid. Each face has a different fill color. You can set the color of the top, left and right faces of the triangle respectively You can also choose which of the faces are rendered via the `showTop`, `showLeft` and `showRight` properties.

You cannot view an IsoTriangle from under-neath, however you can change the 'angle' by setting the `projection` property. The `reversed` property controls if the IsoTriangle is rendered upside down or not.

#### Create shape object

```javascript
var isoTriangle = this.add.isotriangle(
  x,
  y,
  width,
  height,
  reversed,
  fillTop,
  fillLeft,
  fillRight
);
```

#### Custom class

- Define class

```javascript
class MyIsoTriangle extends Phaser.GameObjects.IsoTriangle {
    constructor(
      scene,
      x,
      y,
      width,
      height,
      reversed,
      fillTop,
      fillLeft,
      fillRight
    ) {
      super(scene, x, y, width, height, reversed, fillTop, fillLeft, fillRight);
      // ...
      this.add.existing(this);
    }
    // ...

    // preUpdate(time, delta) {}
}
```

  - `this.add.existing(gameObject)` : Adds an existing Game Object to this Scene.
    - If the Game Object renders, it will be added to the Display List.
    - If it has a `preUpdate` method, it will be added to the Update List.
- Create instance

```javascript
var isoTriangle = new MyIsoTriangle(
    scene,
    x,
    y,
    width,
    height,
    reversed,
    fillTop,
    fillLeft,
    fillRight
);
```

#### Set color

- Fill color

```javascript
isoTriangle.setFillStyle(fillTop, fillLeft, fillRight);
```

- Show face

```javascript
isoTriangle.setFaces(showTop, showLeft, showRight);
```

  - `showTop`, `showLeft`, `showRight`: Set `true` to show that face

**Warning:** No tint methods. Uses `isoTriangle.setFillStyle(fillTop, fillLeft, fillRight)` to change color.

#### Alpha

- Get

```javascript
var alpha = isoTriangle.alpha;
```

- Set

```javascript
isoTriangle.setAlpha(alpha);
// isoTriangle.alpha = alpha;
```

#### Projection

The `projection` level of the iso box. Change this to change the 'angle' at which you are looking at the box.

- Get

```javascript
var projection = isoTriangle.projection;
```

- Set

```javascript
isoTriangle.setProjection(value);
```

or

```javascript
isoTriangle.projection = value;
```

#### Reverse

- Get

```javascript
var isReversed = isoTriangle.isReversed;
```

- Set

```javascript
isoTriangle.setReversed(reversed);
```

or

```javascript
isoTriangle.reversed = reversed;
```

  - Set `true` to render upside down.

#### Display size

- Get

```javascript
var width = isoTriangle.displayWidth;
var height = isoTriangle.displayHeight;
```

- Set

```javascript
isoTriangle.setDisplaySize(width, height);
```

or

```javascript
isoTriangle.displayWidth = width;
isoTriangle.displayHeight = height;
```

#### Create mask

```javascript
var mask = isoTriangle.createGeometryMask();
```

### Line

A Line Shape allows you to draw a line between two points in your game. You can control the stroke color and thickness of the line. In WebGL only you can also specify a different thickness for the start and end of the line, allowing you to render lines that taper-off.

If you need to draw multiple lines in a sequence you may wish to use the [Polygon Shape](#polygon) instead.

#### Create shape object

```javascript
var line = this.add.line(x, y, x1, y1, x2, y2, strokeColor);
// var line = this.add.line(x, y, x1, y1, x2, y2, strokeColor, strokeAlpha);
```

#### Custom class

- Define class

```javascript
class MyCurve extends Phaser.GameObjects.Line {
    constructor(scene, x, y, x1, y1, x2, y2, strokeColor) {
      super(scene, x, y, x1, y1, x2, y2, strokeColor);
      // ...
      this.add.existing(this);
    }
    // ...

    // preUpdate(time, delta) {}
}
```

  - `this.add.existing(gameObject)` : Adds an existing Game Object to this Scene.
    - If the Game Object renders, it will be added to the Display List.
    - If it has a `preUpdate` method, it will be added to the Update List.
- Create instance

```javascript
var line = new MyLine(scene, x, y, x1, y1, x2, y2, strokeColor);
```

#### Set color

- Fill color
  - Get

    ```javascript
    var color = line.fillColor;
    var alpha = line.fillAlpha;
    ```

  - Set

    ```javascript
    line.setFillStyle(color, alpha);
    ```

  - Clear

    ```javascript
    line.setFillStyle();
    ```
- Stroke color
  - Get

    ```javascript
    var color = line.strokeColor;
    ```

  - Set

    ```javascript
    line.setStrokeStyle(lineWidth, color, alpha);
    ```

  - Clear

    ```javascript
    line.setStrokeStyle();
    ```

**Warning:** No tint methods. Uses `line.setFillStyle(color, alpha)` to change color.

#### Alpha

- Get

```javascript
var alpha = line.alpha;
```

- Set

```javascript
line.setAlpha(alpha);
// line.alpha = alpha;
```

#### Set end points

```javascript
line.setTo(x1, y1, x2, y2);
```

#### Line width

```javascript
line.setLineWidth(startWidth, endWidth);
```

- `endWidth` : The end width of the line. Only used in WebGL.

#### Display size

- Get

```javascript
var width = line.displayWidth;
var height = line.displayHeight;
```

- Set

```javascript
line.setDisplaySize(width, height);
```

or

```javascript
line.displayWidth = width;
line.displayHeight = height;
```

#### Create mask

```javascript
var mask = line.createGeometryMask();
```

### Polygon

The Polygon Shape is created by providing a list of points, which are then used to create an internal Polygon geometry object. The points can be set from a variety of formats:

- A string containing paired values separated by a single space: `'40 0 40 20 100 20 100 80 40 80 40 100 0 50'`
- An array of Point or Vector2 objects: `[new Phaser.Math.Vector2(x1, y1), ...]`
- An array of objects with public x/y properties: `[obj1, obj2, ...]`
- An array of paired numbers that represent point coordinates: `[x1,y1, x2,y2, ...]`
- An array of arrays with two elements representing x/y coordinates: `[[x1, y1], [x2, y2], ...]`

By default the `x` and `y` coordinates of this Shape refer to the center of it. However, depending on the coordinates of the points provided, the final shape may be rendered offset from its origin.

Note: The method `getBounds` will return incorrect bounds if any of the points in the Polygon are negative. If this is the case, please use the function `Phaser.Geom.Polygon.GetAABB(polygon.geom)` instead and then adjust the returned Rectangle position accordingly.

#### Create shape object

```javascript
var polygon = this.add.polygon(x, y, points, fillColor);
// var polygon = this.add.polygon(x, y, points, fillColor, fillAlpha);
```

- `points` :
  - An array of number : `[x0, y0, x1, y1, ...]`
  - An array of points : `[{x:x0, y:y0}, {x:x1, y:y1}, ...]`
  - A string : `'x0 y0 x1 y1 ...'`

**Note:** Shift given points to align position **(0, 0)**

#### Custom class

- Define class

```javascript
class MyPolygon extends Phaser.GameObjects.Polygon {
    constructor(scene, x, y, points, fillColor) {
      super(scene, x, y, points, fillColor);
      // ...
      this.add.existing(this);
    }
    // ...

    // preUpdate(time, delta) {}
}
```

  - `this.add.existing(gameObject)` : Adds an existing Game Object to this Scene.
    - If the Game Object renders, it will be added to the Display List.
    - If it has a `preUpdate` method, it will be added to the Update List.
- Create instance

```javascript
var polygon = new MyPolygon(scene, x, y, points, fillColor);
```

#### Color

- Fill color
  - Get

    ```javascript
    var color = polygon.fillColor;
    var alpha = polygon.fillAlpha;
    ```

  - Set

    ```javascript
    polygon.setFillStyle(color, alpha);
    ```

  - Clear

    ```javascript
    polygon.setFillStyle();
    ```
- Stroke color
  - Get

    ```javascript
    var color = polygon.strokeColor;
    ```

  - Set

    ```javascript
    polygon.setStrokeStyle(lineWidth, color, alpha);
    ```

  - Clear

    ```javascript
    polygon.setStrokeStyle();
    ```

**Warning:** No tint methods. Uses `polygon.setFillStyle(color, alpha)` to change color.

#### Alpha

- Get

```javascript
var alpha = polygon.alpha;
```

- Set

```javascript
polygon.setAlpha(alpha);
// polygon.alpha = alpha;
```

#### Smooth

Smooths the polygon over the number of iterations specified.

```javascript
polygon.smooth(iterations);
```

#### Set points

```javascript
polygon.setTo(points);
```

- `point` :
  - A string containing paired values separated by a single space : `'40 0 40 20 100 20 100 80 40 80 40 100 0 50'`
  - An array of Point objects : `[new Phaser.Point(x1, y1), ...]`
  - An array of objects with public x/y properties : `[obj1, obj2, ...]`
  - An array of paired numbers that represent point coordinates : `[x1,y1, x2,y2, ...]`
  - An array of arrays with two elements representing x/y coordinates : `[[x1, y1], [x2, y2], ...]`

#### Display size

- Get

```javascript
var width = polygon.displayWidth;
var height = polygon.displayHeight;
```

- Set

```javascript
polygon.setDisplaySize(width, height);
```

or

```javascript
polygon.displayWidth = width;
polygon.displayHeight = height;
```

#### Create mask

```javascript
var mask = polygon.createGeometryMask();
```

### Rectangle

Draw a rectangle shape.

#### Create shape object

```javascript
var rect = this.add.rectangle(x, y, width, height, fillColor);
// var rect = this.add.rectangle(x, y, width, height, fillColor, fillAlpha);
```

#### Custom class

- Define class

```javascript
class MyRectangle extends Phaser.GameObjects.Rectangle {
    constructor(scene, x, y, width, height, fillColor) {
      super(scene, x, y, width, height, fillColor);
      // ...
      this.add.existing(this);
    }
    // ...

    // preUpdate(time, delta) {}
}
```

  - `this.add.existing(gameObject)` : Adds an existing Game Object to this Scene.
    - If the Game Object renders, it will be added to the Display List.
    - If it has a `preUpdate` method, it will be added to the Update List.
- Create instance

```javascript
var rect = new MyRectangle(scene, x, y, width, height, fillColor);
```

#### Color

- Fill color
  - Get

    ```javascript
    var color = rect.fillColor;
    var alpha = rect.fillAlpha;
    ```

  - Set

    ```javascript
    rect.setFillStyle(color, alpha);
    ```

  - Clear

    ```javascript
    rect.setFillStyle();
    ```
- Stroke color
  - Get

    ```javascript
    var color = rect.strokeColor;
    ```

  - Set

    ```javascript
    rect.setStrokeStyle(lineWidth, color, alpha);
    ```

  - Clear

    ```javascript
    rect.setStrokeStyle();
    ```

**Warning:** No tint methods. Uses `rect.setFillStyle(color, alpha)` to change color.

#### Alpha

- Get

```javascript
var alpha = rect.alpha;
```

- Set

```javascript
rect.setAlpha(alpha);
// rect.alpha = alpha;
```

#### Size

- Get

```javascript
var width = rect.width;
var height = rect.height;
```

- Set

```javascript
rect.setSize(width, height);
```

or

```javascript
rect.width = width;
rect.height = height;
```

#### Display size

- Get

```javascript
var width = rect.displayWidth;
var height = rect.displayHeight;
```

- Set

```javascript
rect.setDisplaySize(width, height);
```

or

```javascript
rect.displayWidth = width;
rect.displayHeight = height;
```

#### Create mask

```javascript
var mask = rect.createGeometryMask();
```

### Star

Draw a star shape. You can control several aspects of it including the number of points that constitute the star. The default is 5. If you change it to 4 it will render as a diamond. If you increase them, you'll get a more spiky star shape.

You can also control the inner and outer radius, which is how 'long' each point of the star is. Modify these values to create more interesting shapes.

#### Create shape object

```javascript
var star = this.add.star(x, y, points, innerRadius, outerRadius, fillColor);
// var star = this.add.star(x, y, points, innerRadius, outerRadius, fillColor, fillAlpha);
```

- `points` : The number of points on the star. Default is 5.
- `innerRadius` : The inner radius of the star. Default is 32.
- `outerRadius` : The outer radius of the star. Default is 64.

#### Custom class

- Define class

```javascript
class MyStar extends Phaser.GameObjects.Star {
    constructor(scene, x, y, points, innerRadius, outerRadius, fillColor) {
      super(scene, x, y, points, innerRadius, outerRadius, fillColor);
      // ...
      this.add.existing(this);
    }
    // ...

    // preUpdate(time, delta) {}
}
```

  - `this.add.existing(gameObject)` : Adds an existing Game Object to this Scene.
    - If the Game Object renders, it will be added to the Display List.
    - If it has a `preUpdate` method, it will be added to the Update List.
- Create instance

```javascript
var star = new MyStar(
    scene,
    x,
    y,
    points,
    innerRadius,
    outerRadius,
    fillColor
);
```

#### Color

- Fill color
  - Get

    ```javascript
    var color = star.fillColor;
    var alpha = star.fillAlpha;
    ```

  - Set

    ```javascript
    star.setFillStyle(color, alpha);
    ```

  - Clear

    ```javascript
    star.setFillStyle();
    ```
- Stroke color
  - Get

    ```javascript
    var color = star.strokeColor;
    ```

  - Set

    ```javascript
    star.setStrokeStyle(lineWidth, color, alpha);
    ```

  - Clear

    ```javascript
    star.setStrokeStyle();
    ```

**Warning:** No tint methods. Uses `star.setFillStyle(color, alpha)` to change color.

#### Alpha

- Get

```javascript
var alpha = star.alpha;
```

- Set

```javascript
star.setAlpha(alpha);
// star.alpha = alpha;
```

#### Radius

- Inner radius
  - Get

    ```javascript
    var innerRadius = star.innerRadius;
    ```

  - Set

    ```javascript
    star.setInnerRadius(innerRadius);
    ```

    or

    ```javascript
    star.innerRadius = innerRadius;
    ```
- Outer radius
  - Get

    ```javascript
    var outerRadius = star.outerRadius;
    ```

  - Set

    ```javascript
    star.setOuterRadius(outerRadius);
    ```

    or

    ```javascript
    star.outerRadius = outerRadius;
    ```
- Points
  - Get

    ```javascript
    var points = star.points;
    ```

  - Set

    ```javascript
    star.setPoints(points);
    ```

    or

    ```javascript
    star.points = points;
    ```

#### Display size

- Get

```javascript
var width = star.displayWidth;
var height = star.displayHeight;
```

- Set

```javascript
star.setDisplaySize(width, height);
```

or

```javascript
star.displayWidth = width;
star.displayHeight = height;
```

#### Create mask

```javascript
var mask = star.createGeometryMask();
```

### Triangle

Draw a triangle shape. The Triangle consists of 3 lines, joining up to form a triangular shape. You can control the position of each point of these lines. The triangle is always closed and cannot have an open face. If you require that, use a Polygon.

#### Create shape object

```javascript
var triangle = this.add.triangle(x, y, x1, y1, x2, y2, x3, y3, fillColor);
// var triangle = this.add.triangle(x, y, x1, y1, x2, y2, x3, y3, fillColor, fillAlpha);
```

#### Custom class

- Define class

```javascript
class MyTriangle extends Phaser.GameObjects.Triangle {
    constructor(scene, x, y, x1, y1, x2, y2, x3, y3, fillColor) {
      super(scene, x, y, x1, y1, x2, y2, x3, y3, fillColor);
      // ...
      this.add.existing(this);
    }
    // ...

    // preUpdate(time, delta) {}
}
```

  - `this.add.existing(gameObject)` : Adds an existing Game Object to this Scene.
    - If the Game Object renders, it will be added to the Display List.
    - If it has a `preUpdate` method, it will be added to the Update List.
- Create instance

```javascript
var triangle = new MyTriangle(scene, x, y, x1, y1, x2, y2, x3, y3, fillColor);
```

#### Color

- Fill color
  - Get

    ```javascript
    var color = triangle.fillColor;
    var alpha = triangle.fillAlpha;
    ```

  - Set

    ```javascript
    triangle.setFillStyle(color, alpha);
    ```

  - Clear

    ```javascript
    triangle.setFillStyle();
    ```
- Stroke color
  - Get

    ```javascript
    var color = triangle.strokeColor;
    ```

  - Set

    ```javascript
    triangle.setStrokeStyle(lineWidth, color, alpha);
    ```

  - Clear

    ```javascript
    triangle.setStrokeStyle();
    ```

**Warning:** No tint methods. Uses `triangle.setFillStyle(color, alpha)` to change color.

#### Alpha

- Get

```javascript
var alpha = triangle.alpha;
```

- Set

```javascript
triangle.setAlpha(alpha);
// triangle.alpha = alpha;
```

#### Set vertices

```javascript
triangle.setTo(x1, y1, x2, y2, x3, y3);
```

#### Triangle width

```javascript
triangle.setLineWidth(startWidth, endWidth);
```

- `endWidth` : The end width of the triangle. Only used in WebGL.

#### Display size

- Get

```javascript
var width = triangle.displayWidth;
var height = triangle.displayHeight;
```

- Set

```javascript
triangle.setDisplaySize(width, height);
```

or

```javascript
triangle.displayWidth = width;
triangle.displayHeight = height;
```

#### Create mask

```javascript
var mask = triangle.createGeometryMask();
```

## Author Credits

Content on this page includes work by:

- [RexRainbow](https://github.com/rexrainbow)

---

Updated on July 30, 2025, 3:14 PM UTC
