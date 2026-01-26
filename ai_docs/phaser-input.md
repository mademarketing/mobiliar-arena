# Input

A Guide to Handling Input in Phaser

Phaser maintains a unified input system that works across all browsers and devices. By unified we mean that you don't have to worry about whether the user is on a desktop with a mouse, or a mobile device with touch input, or even a touch capable desktop. All you need to do is listen for, and respond to, the input events that Phaser provides. You can also respond to input events from both keyboards and gamepads.

Internally there is a global Input Manager and every Scene has an instance of the Input Plugin. The Input Manager is responsible for listening for native DOM events, such as mouse movement, touch gestures and keyboard presses. It then passes these events on to the Input Plugins, which in turn processes them.

By default, Game Objects in Phaser do not process input. This is because not all Game Objects need to respond to input. For example, a background image or game logo likely doesn't need to respond to input, but a button does. Therefore, you must enable input processing on the Game Objects that you specifically want to respond to input.

Once enabled for input, a Game Object will then listen for input events from the Input Plugin and check to see if it has been 'clicked', or not. There are lots of events that can be emitted, such as pointer up and down events, drag events, scroll wheel events, etc. We'll explore these in more detail later in this guide, along with how the input system works internally. For now, it's enough to know that you can enable input on almost any Game Object and then respond to the events it emits as your game requires.

## Enabling a Game Object for input

Phaser combines mouse and touch (pointer) events into one single unified API for you. When you enable a Game Object for input and listen for an event, such as 'pointerdown', it doesn't matter if it was a mouse click on a desktop, or a finger pointer on a mobile that caused it. Phaser will emit the same event for your game to listen for.

To enable a Game Object for input:

```javascript
gameObject.setInteractive();
```

Not all Game Objects can receive input. Check the API Documentation for specifics. However, all of the common ones (Sprites, Images, Text, etc) can.

## Setting hit areas

The `setInteractive` method can take a custom hit area.

- Set hit area from width and height (rectangle) of the texture the Game Object is using:

```javascript
gameObject.setInteractive();
```

- Set hit area from game object

```javascript
gameObject.setInteractive(shape, callback);
```

  - [Circle](https://docs.phaser.io/phaser/concepts/geometry#circle)
    - shape : `new Phaser.Geom.Circle(x, y, radius)`
    - callback : `Phaser.Geom.Circle.Contains`
  - [Ellipse](https://docs.phaser.io/phaser/concepts/geometry#ellipse)
    - shape : `new Phaser.Geom.Ellipse(x, y, width, height)`
    - callback : `Phaser.Geom.Ellipse.Contains`
  - [Rectangle](https://docs.phaser.io/phaser/concepts/geometry#rectangle)
    - shape : `new Phaser.Geom.Rectangle(x, y, width, height)`
    - callback : `Phaser.Geom.Rectangle.Contains`
  - [Triangle](https://docs.phaser.io/phaser/concepts/geometry#triangle)
    - shape : `new Phaser.Geom.Triangle(x1, y1, x2, y2, x3, y3)`
    - callback : `Phaser.Geom.Triangle.Contains`
  - [Polygon](https://docs.phaser.io/phaser/concepts/geometry#polygon)
    - shape : `new Phaser.Geom.Polygon(points)`
    - callback : `Phaser.Geom.Polygon.Contains`
  - [Hexagon](https://docs.phaser.io/phaser/concepts/geometry#hexagon)
    - shape : `new Phaser.Geom.rexHexagon(x, y, size, type)`
    - callback : `Phaser.Geom.Polygon.Contains`
  - [Rhombus](https://docs.phaser.io/phaser/concepts/geometry#rhombus)
    - shape : `new Phaser.Geom.rexRhombus(x, y, width, height)`
    - callback : `Phaser.Geom.Polygon.Contains`
  - Note: `x`, `y` relate to the **top-left** of the gameObject.

- Set hit area from input plugin

```javascript
scene.input.setHitArea(gameObjects, shape, callback);
```

  - Circle

    ```javascript
    scene.input.setHitAreaCircle(gameObjects, x, y, radius);
    // scene.input.setHitAreaCircle(gameObjects, x, y, radius, callback); // callback = Circle.Contains
    ```

  - Ellipse

    ```javascript
    scene.input.setHitAreaEllipse(gameObjects, x, y, width, height);
    // scene.input.setHitAreaEllipse(gameObjects, x, y, width, height, callback); // callback = Ellipse.Contains
    ```

  - Rectangle

    ```javascript
    scene.input.setHitAreaRectangle(gameObjects, x, y, width, height);
    // scene.input.setHitAreaRectangle(gameObjects, x, y, width, height, callback); // callback = Rectangle.Contains
    ```

  - Triangle

    ```javascript
    scene.input.setHitAreaTriangle(gameObjects, x1, y1, x2, y2, x3, y3);
    // scene.input.setHitAreaTriangle(gameObjects, x1, y1, x2, y2, x3, y3, callback); // callback = Triangle.Contains
    ```

  - Note: `x`, `y` relate to the **top-left** of the gameObject.

- Set interactive configuration

```javascript
gameObject.setInteractive({
    hitArea: shape,
    hitAreaCallback: callback,
    hitAreaDebug: shape,
    draggable: false,
    dropZone: false,
    useHandCursor: false,
    cursor: CSSString,
    pixelPerfect: false,
    alphaTolerance: 1,
});
```

  - Hit area
    - shape
    - Pixel alpha
      - `pixelPerfect` : `true`
      - `alphaTolerance` : `1` (0-255)
    - Custom hit-testing function
      - `hitAreaCallback`
        ```javascript
        function(shape, x, y, gameObject) {
            return hit;  // true/false
        }
        ```
        - `shape` : Hit area object
        - `x`, `y` : Local position of texture.
        - `gameObject` : Game object.
    - `hitAreaDebug` : Debug shape.
  - [Dragging](https://docs.phaser.io/phaser/concepts/input#dragging)
    - `draggable` : `true`
  - [Drop zone](https://docs.phaser.io/phaser/concepts/input#drop-zone)
    - `dropZone` : `true`
  - [Cursor](https://docs.phaser.io/phaser/concepts/input#cursor)
    - `cursor` : CSS string
    - `useHandCursor` : `true`

**Warning: Pixel perfect hit-testing**
This is an expensive process, should only be enabled on Game Objects that really need it.

## Disable input

- Disable temporary

```javascript
gameObject.disableInteractive();
```

- Remove interaction

```javascript
gameObject.removeInteractive();
```

## Top only game object input

When set to `true` this Input Plugin will emulate DOM behavior by only emitting events from the top-most Game Objects in the Display List.
If set to `false` it will emit events from all Game Objects below a Pointer, not just the top one.

- Getting top only game object input value:

```javascript
var topOnly = scene.input.topOnly;
```

- Setting top only game object input value:

```javascript
scene.input.topOnly = value; // true or false
scene.input.setTopOnly(value); // true or false
```

Each scene can has its own `scene.input.topOnly` setting.

## Touch events

Trigger these events from top scene to bottom scene.

1. Events on touched Game object

```javascript
gameObject.on(
     "pointerdown",
     function (pointer, localX, localY, event) {
       /* ... */
     },
     scope
);
gameObject.on(
     "pointerup",
     function (pointer, localX, localY, event) {
       /* ... */
     },
     scope
);
gameObject.on(
     "pointermove",
     function (pointer, localX, localY, event) {
       /* ... */
     },
     scope
);
gameObject.on(
     "pointerover",
     function (pointer, localX, localY, event) {
       /* ... */
     },
     scope
);
gameObject.on(
     "pointerout",
     function (pointer, event) {
       /* ... */
     },
     scope
);
```

   - Cancel remaining touch events

     ```javascript
     function(pointer, localX, localY, event) {
         event.stopPropagation();
     }
     ```

2. Event on input plugin for each touched Game object

```javascript
scene.input.on(
     "gameobjectdown",
     function (pointer, gameObject, event) {
       /* ... */
     },
     scope
);
scene.input.on(
     "gameobjectup",
     function (pointer, gameObject, event) {
       /* ... */
     },
     scope
);
scene.input.on(
     "gameobjectmove",
     function (pointer, gameObject, event) {
       /* ... */
     },
     scope
);
scene.input.on(
     "gameobjectover",
     function (pointer, gameObject, event) {
       /* ... */
     },
     scope
);
scene.input.on(
     "gameobjectout",
     function (pointer, gameObject, event) {
       /* ... */
     },
     scope
);
```

   - Cancel remaining touched events

     ```javascript
     function(pointer, gameObject, event) {
         event.stopPropagation();
     }
     ```

3. Events to get **all** touched Game Objects

```javascript
scene.input.on(
     "pointerdown",
     function (pointer, currentlyOver) {
       /* ... */
     },
     scope
);
scene.input.on(
     "pointerdownoutside",
     function (pointer) {
       /* ... */
     },
     scope
);
scene.input.on(
     "pointerup",
     function (pointer, currentlyOver) {
       /* ... */
     },
     scope
);
scene.input.on(
     "pointerupoutside",
     function (pointer) {
       /* ... */
     },
     scope
);
scene.input.on(
     "pointermove",
     function (pointer, currentlyOver) {
       /* ... */
     },
     scope
);
scene.input.on(
     "pointerover",
     function (pointer, justOver) {
       /* ... */
     },
     scope
);
scene.input.on(
     "pointerout",
     function (pointer, justOut) {
       /* ... */
     },
     scope
);
scene.input.on(
     "gameout",
     function (timeStamp, domEvent) {
       /* ... */
     },
     scope
);
scene.input.on(
     "gameover",
     function (timeStamp, domEvent) {
       /* ... */
     },
     scope
);
```

   - Check `pointer.camera` in multiple-cameras scene.

### Game canvas

```javascript
scene.input.on(
  "gameout",
  function (timeStamp, event) {
    /* ... */
  },
  scope
);
scene.input.on(
  "gameover",
  function (timeStamp, event) {
    /* ... */
  },
  scope
);
```

### Dragging

#### Enable dragging

- Enable dragging when [registering interactive](https://docs.phaser.io/phaser/concepts/input#enabling-a-game-object-for-input)

```javascript
gameObject.setInteractive({ draggable: true });
```

- Enable dragging and add it to dragging detecting list after registered interactive

```javascript
scene.input.setDraggable(gameObject);
```

- Enable dragging

```javascript
gameObject.input.draggable = true;
```

#### Disable dragging

- Remove Game Object from dragging detecting list

```javascript
scene.input.setDraggable(gameObject, false);
```

- Disable dragging but keep it in dragging detecting list

```javascript
gameObject.input.draggable = false;
```

#### Dragging events

```javascript
gameObject.on(
  "dragstart",
  function (pointer, dragX, dragY) {
    /* ... */
  },
  scope
);
gameObject.on(
  "drag",
  function (pointer, dragX, dragY) {
    /* ... */
  },
  scope
);
gameObject.on(
  "dragend",
  function (pointer, dragX, dragY, dropped) {
    /* ... */
  },
  scope
);
```

```javascript
scene.input.on(
  "dragstart",
  function (pointer, gameObject) {
    /* ... */
  },
  scope
);
scene.input.on(
  "drag",
  function (pointer, gameObject, dragX, dragY) {
    /* ... */
  },
  scope
);
scene.input.on(
  "dragend",
  function (pointer, gameObject, dropped) {
    /* ... */
  },
  scope
);
```

- `dropped` : `'dragend'` and also `'drop'`.

#### Dragging properties

```javascript
scene.input.dragDistanceThreshold = 16;
scene.input.dragTimeThreshold = 500;
```

### Drop zone

#### Enable drop zone

- Enable dropping when [registering interactive](https://docs.phaser.io/phaser/concepts/input#enabling-a-game-object-for-input)

```javascript
gameObject.setInteractive({ dropZone: true });
```

- Enable dropping after registered interactive

```javascript
gameObject.input.dropZone = true;
```

#### Disable drop zone

```javascript
gameObject.input.dropZone = false;
```

#### Dropping events

```javascript
gameObject.on(
  "drop",
  function (pointer, target) {
    /* ... */
  },
  scope
);

gameObject.on(
  "dragenter",
  function (pointer, target) {
    /* ... */
  },
  scope
);
gameObject.on(
  "dragover",
  function (pointer, target) {
    /* ... */
  },
  scope
);
gameObject.on(
  "dragleave",
  function (pointer, target) {
    /* ... */
  },
  scope
);
```

```javascript
scene.input.on(
  "drop",
  function (pointer, gameObject, target) {
    /* ... */
  },
  scope
);

scene.input.on(
  "dragenter",
  function (pointer, gameObject, target) {
    /* ... */
  },
  scope
);
scene.input.on(
  "dragover",
  function (pointer, gameObject, target) {
    /* ... */
  },
  scope
);
scene.input.on(
  "dragleave",
  function (pointer, gameObject, target) {
    /* ... */
  },
  scope
);
```

### First event of all

```javascript
scene.input.on(
  "preupdate",
  function () {
    /* ... */
  },
  scope
);
```

### Single touch

#### Pointer

```javascript
var pointer = scene.input.activePointer;
```

### Multi-touch

#### Amount of active pointers

Set amount of active pointers in game configuration

```javascript
var config = {
  // ...
  input: {
    activePointers: 1,
    // ...
  },
};
var game = new Phaser.Game(config);
```

Or add pointers in run-time.

```javascript
scene.input.addPointer(num); // total points = num + 1
```

#### Pointers

- pointer 1 ~ 10

```javascript
var pointer = scene.input.pointer1;
// ...
var pointer = scene.input.pointer10;
```

- pointer n

```javascript
var pointer = scene.input.manager.pointers[n];
```

- Amount of total pointers

```javascript
var amount = scene.input.manager.pointersTotal;
```

  - `1` in desktop
  - `2` in touch device. ( `0` for mouse, `1` for 1 touch pointer)

### Pointer

- Position
  - Current touching
    - Position in screen : `pointer.x` , `pointer.y`
    - Position in camera :
      - Single camera :

        ```javascript
        var worldX = pointer.worldX;
        var worldY = pointer.worldY;
        ```

      - Multiple cameras :

        ```javascript
        var worldXY = pointer.positionToCamera(camera); // worldXY: {x, y}
        // var worldXY = pointer.positionToCamera(camera, worldXY);
        var worldX = worldXY.x;
        var worldY = worldXY.y;
        ```

      - Camera

        ```javascript
        var camera = pointer.camera;
        ```
    - Position of previous moving : `pointer.prevPosition.x` , `pointer.prevPosition.y`
      - Updating when pointer-down, potiner-move, or pointer-up.
    - Interpolated position :

      ```javascript
      var points = pointer.getInterpolatedPosition(step);
      // var out = pointer.getInterpolatedPosition(step, out);
      ```
  - Drag
    - Touching start : `pointer.downX`, `pointer.downY`
    - Touching end : `pointer.upX`, `pointer.upY`
    - Drag distance between pointer-down to latest pointer : `pointer.getDistance()`
      - Horizontal drag distance : `pointer.getDistanceX()`
      - Vertical drag distance : `pointer.getDistanceY()`
    - Drag angle : `pointer.getAngle()`
- Time
  - Touching start : `pointer.downTime`
  - Touching end : `pointer.upTime`
  - Drag : `pointer.getDuration()`
- Touch state
  - Is touching/any button down : `pointer.isDown`
  - Is primary button down : `pointer.primaryDown`
- Button state : `pointer.button`
  - On Touch devices the value is always `0`.
- Button down
  - No button down : `pointer.noButtonDown()`
  - Is primary (left) button down : `pointer.leftButtonDown()`
  - Is secondary (right) button down : `pointer.rightButtonDown()`
  - Is middle (mouse wheel) button down : `pointer.middleButtonDown()`
  - Is back button down : `pointer.backButtonDown()`
  - Is forward button down : `pointer.forwardButtonDown()`
- Button released
  - Is primary (left) button released : `pointer.leftButtonReleased()`
  - Is secondary (right) button released : `pointer.rightButtonReleased()`
  - Is middle (mouse wheel) button released : `pointer.middleButtonReleased()`
  - Is back button released : `pointer.backButtonReleased()`
  - Is forward button released : `pointer.forwardButtonReleased()`
- Index in `scene.input.manager.pointers` : `pointer.id`
- Motion
  - Angle: `pointer.angle`
  - Distance: `pointer.distance`
  - Velocity: `pointer.velocity`
    - `pointer.velocity.x`, `pointer.velocity.y`

### Input object

- `gameObject.input` : Game object's input object.
- `gameObject.input.localX`, `gameObject.input.localY` : Pointer to local position of texture.
- `gameObject.input.dragStartX`, `gameObject.input.dragStartY` : The x/y coordinate of the Game Object
that owns this Interactive Object when the drag started.
- `gameObject.input.dragStartXGlobal`, `gameObject.input.dragStartYGlobal` : The x/y coordinate that
the Pointer started dragging this Interactive Object from.
- `gameObject.input.dragX`, `gameObject.input.dragY` : The x/y coordinate that this Interactive Object
is currently being dragged to.

### Smooth

Get touch position from interpolation of previous touch position and current touch position.

```
Touch-position = (current-touch-position * smooth-factor) + (previous-touch-position * (1 - smooth-factor))
```

1. Set smooth factor. In [game configuration](https://docs.phaser.io/phaser/concepts/scenes#game-configuration)

```javascript
var config = {
     // ....
     input: {
       smoothFactor: 0,
     },
};
```

2. Get touch position

```javascript
var x = pointer.x;
var y = pointer.y;
var worldX = pointer.worldX;
var worldY = pointer.worldY;
```

### Debug

- Enable, draw shape of (shape) hit area.

```javascript
scene.input.enableDebug(gameObject);
// scene.input.enableDebug(gameObject, color);
```

- Disable

```javascript
scene.input.removeDebug(gameObject);
```

- Get debug shape game object

```javascript
var shape = gameObject.input.hitAreaDebug;
```

### Poll rate

- Poll when touches moved, or updated. Default behavior.

```javascript
scene.input.setPollOnMove();
```

- Poll every tick.

```javascript
scene.input.setPollAlways();
```

- Set poll rate.

```javascript
scene.input.setPollRate(rate);
```

## Touch / mouse input

**Note:** No touch input events fired in preload stage.

### Usage

- Is touching / mouse button is pressed. Usually used in the `update()` game loop:

```javascript
var pointer = scene.input.activePointer;
if (pointer.isDown) {
    var touchX = pointer.x;
    var touchY = pointer.y;
    // ...
}
```

- On any touching start / mouse button press event:

```javascript
scene.input.on(
    "pointerdown",
    function (pointer) {
      var touchX = pointer.x;
      var touchY = pointer.y;
      // ...
    },
    scope
);
```

- On any touching end / mouse button release event:

```javascript
scene.input.on(
    "pointerup",
    function (pointer) {
      var touchX = pointer.x;
      var touchY = pointer.y;
      // ...
    },
    scope
);
```

- On touch game object start / mouse button press event:

```javascript
gameObject.setInteractive().on(
    "pointerdown",
    function (pointer, localX, localY, event) {
      // ...
    },
    scope
);
```

- On touch game object end / mouse button release event:

```javascript
gameObject.setInteractive().on(
    "pointerup",
    function (pointer, localX, localY, event) {
      // ...
    },
    scope
);
```

- Dragging a game object:

```javascript
gameObject
      .setInteractive({ draggable: true })
      .on('dragstart', function(pointer, dragX, dragY){
          // ...
      }, scope);
      .on('drag', function(pointer, dragX, dragY){
          gameObject.setPosition(dragX, dragY);
      }, scope);
      .on('dragend', function(pointer, dragX, dragY, dropped){
          // ...
      }, scope);
```

Reference : [Properties of point](https://docs.phaser.io/phaser/concepts/geometry#point)

### Cursor

References:
- [Cursor](https://developer.mozilla.org/en-US/docs/Web/CSS/cursor)

### Set default cursor

```javascript
scene.input.setDefaultCursor(CSSString);
// CSSString: 'url(assets/input/cursors/sword.cur), pointer'
```

### Set cursor of a Game Object

Change cursor image when cursor is over that Game Object.

```javascript
gameObject.setInteractive({
  cursor: CSSString,
});
// CSSString: 'url(assets/input/cursors/sword.cur), pointer'
```

Set cursor image directly after `gameObject.setInteractive()`.

```javascript
gameObject.input.cursor = CSSString;
// CSSString: 'url(assets/input/cursors/sword.cur), pointer'
```

Use pointer (hand cursor).

```javascript
gameObject.setInteractive({
  useHandCursor: true,
});
```

### Change current cursor

```javascript
scene.input.manager.canvas.style.cursor = cursor;
```

- `cursor` : CSSString

## Keyboard input

### Quick start

- Is key-down/is key-up

```javascript
var keyObject = scene.input.keyboard.addKey("W"); // Get key object
var isDown = keyObject.isDown;
var isUp = keyObject.isUp;
var shiftKey = keyObject.shiftKey;
```

- Key is down after a duration

```javascript
var keyObject = scene.input.keyboard.addKey("W"); // Get key object
var isDown = scene.input.keyboard.checkDown(keyObject, duration);
```

- On key-down/on key-up

```javascript
var keyObject = scene.input.keyboard.addKey("W"); // Get key object
keyObject.on("down", function (event) {
    /* ... */
});
keyObject.on("up", function (event) {
    /* ... */
});
```

or

```javascript
scene.input.keyboard.on("keydown-" + "W", function (event) {
    /* ... */
});
scene.input.keyboard.on("keyup-" + "W", function (event) {
    /* ... */
});
```

- Any key-down/any key-up

```javascript
scene.input.keyboard.on("keydown", function (event) {
    /* ... */
});
scene.input.keyboard.on("keyup", function (event) {
    /* ... */
});
```

  - `event` : [KeyboardEvent](https://www.w3schools.com/jsref/obj_keyboardevent.asp)
    - `event.code` : 'Key' + 'W'

### Key object

- Get key object

```javascript
var keyObject = scene.input.keyboard.addKey("W"); // see `Key map` section
// var keyObject = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
```

or

```javascript
var keyObject = scene.input.keyboard.addKey("W", enableCapture, emitOnRepeat);
```

  - `enableCapture` : Automatically call `preventDefault` on the native DOM browser event for the key codes being added.
  - `emitOnRepeat` : Controls if the Key will continuously emit a 'down' event while being held down (true), or emit the event just once (false, the default).

- Get key objects

```javascript
var keyObjects = scene.input.keyboard.addKeys("W,S,A,D"); // keyObjects.W, keyObjects.S, keyObjects.A, keyObjects.D
// var keyObjects = scene.input.keyboard.addKeys('W,S,A,D', enableCapture, emitOnRepeat);
```

or

```javascript
var keyObjects = scene.input.keyboard.addKeys({
    up: "W",
    down: "S",
    left: "A",
    right: "D",
}); // keyObjects.up, keyObjects.down, keyObjects.left, keyObjects.right
```

- Remove key object

```javascript
scene.input.keyboard.removeKey("W");
// scene.input.keyboard.removeKey(Phaser.Input.Keyboard.KeyCodes.W);
// scene.input.keyboard.removeKey(key, destroy, removeCapture);
```

  - `destroy` : Call `Key.destroy` on each removed Key object
  - `removeCapture` : Remove all key captures for Key objects owened by this plugin?

- Remove all key objects

```javascript
scene.input.keyboard.removeAllKeys(true);
// scene.input.keyboard.removeAllKeys(destroy, removeCapture);
```

  - `destroy` : Call `Key.destroy` on each removed Key object
  - `removeCapture` : Remove all key captures for Key objects owened by this plugin?

- Key-down/key-up state

```javascript
var isDown = keyObject.isDown;
var isUp = keyObject.isUp;
```

- Duration of key-down

```javascript
var duration = keyObject.getDuration(); // ms
```

- Enable/disable

```javascript
keyObject.enabled = enabled; // Set false to disable key event
```

### Key object of cursorkeys

1. Get key state object

```javascript
var cursorKeys = scene.input.keyboard.createCursorKeys();
```

2. Get key state

```javascript
var isUpDown = cursorKeys.up.isDown;
var isDownDown = cursorKeys.down.isDown;
var isLeftDown = cursorKeys.left.isDown;
var isRightDown = cursorKeys.right.isDown;
var isSpaceDown = cursorKeys.space.isDown;
var isShiftDown = cursorKeys.shift.isDown;
```

### Order of key-down/key-up events

1. Key-down/key-up events of key object

```javascript
var keyObject = scene.input.keyboard.addKey("W"); // Get key object
keyObject.on("down", function (event) {
     /* ... */
});
keyObject.on("up", function (event) {
     /* ... */
});
```

   - `event.stopImmediatePropagation()` : Stop any further listeners from being invoked in the current Scene.
   - `event.stopPropagation()` : Stop it reaching any other Scene.

2. On key-down/on key-up

```javascript
scene.input.keyboard.on("keydown-" + "W", function (event) {
     /* ... */
});
scene.input.keyboard.on("keyup-" + "W", function (event) {
     /* ... */
});
```

   - `event.stopImmediatePropagation()` : Stop any further listeners from being invoked in the current Scene.
   - `event.stopPropagation()` : Stop it reaching any other Scene.
   - Invoke `event.preventDefault()` to stop event propagation to native DOM.

3. Any key-down/on key-up

```javascript
scene.input.keyboard.on("keydown", function (event) {
     /* ... */
});
scene.input.keyboard.on("keyup", function (event) {
     /* ... */
});
```

   - `event.key` : `'a'`
   - `event.keyCode` : `65`
   - `event.code` : `'KeyA'`
   - `event.stopImmediatePropagation()` : Stop any further listeners from being invoked in the current Scene.
   - `event.stopPropagation()` : Stop it reaching any other Scene.

### Destroy key object

```javascript
keyObject.destroy();
```

### Key map

- `A` ~ `Z`
- `F1` ~ `F12`
- `BACKSPACE`
- `TAB`
- `ENTER`
- `SHIFT`
- `CTRL`. `ALT`
- `PAUSE`
- `CAPS_LOCK`
- `ESC`
- `SPACE`
- `PAGE_UP`, `PAGE_DOWN`
- `END`, `HOME`
- `LEFT`, `UP`, `RIGHT`, `DOWN`
- `PRINT_SCREEN`
- `INSERT`, `DELETE`
- `ZERO`, `ONE`, `TWO`, `THREE`, `FOUR`, `FIVE`, `SIX`, `SEVEN`, `EIGHT`, `NINE`
- `NUMPAD_ZERO`, `NUMPAD_ONE`, `NUMPAD_TWO`, `NUMPAD_THREE`, `NUMPAD_FOUR`, `NUMPAD_FIVE`, `NUMPAD_SIX`, `NUMPAD_SEVEN`, `NUMPAD_EIGHT`, `NUMPAD_NINE`, `NUMPAD_ADD`, `NUMPAD_SUBTRACT`
- `OPEN_BRACKET`, `CLOSED_BRACKET`
- `SEMICOLON_FIREFOX`, `COLON`, `COMMA_FIREFOX_WINDOWS`, `COMMA_FIREFOX`, `BRACKET_RIGHT_FIREFOX`, `BRACKET_LEFT_FIREFOX`

### Keyboard combos

1. Create combo

```javascript
var keyCombo = scene.input.keyboard.createCombo(keys, {
     // resetOnWrongKey: true,
     // maxKeyDelay: 0,
     // resetOnMatch: false,
     // deleteOnMatch: false,
});
```

   - `keys` : Array of keyCodes
     - In strings. ex: `['up', 'up', 'down', 'down']`, or `['UP', 'UP', 'DOWN', 'DOWN']`
     - In [key map](https://docs.phaser.io/phaser/concepts/input#key-map). ex: `[Phaser.Input.Keyboard.KeyCodes.UP, ... ]`
     - In numbers. ex: `[38, 38, 40, 40]`
   - `resetOnWrongKey` : Set `true` to reset the combo when press the wrong key.
   - `maxKeyDelay` : The max delay in ms between each key press. Set `0` to disable this feature.
   - `resetOnMatch` : Set `true` to reset the combo when previously matched.
   - `deleteOnMatch` : Set `true` to delete this combo when matched.

2. Listen combo matching event

```javascript
scene.input.keyboard.on("keycombomatch", function (keyCombo, keyboardEvent) {
     /* ... */
});
```

## Gamepad input

### Enable gamepad manager

```javascript
var config = {
  // ...
  input: {
    gamepad: true,
  },
  // ...
};
var game = new Phaser.Game(config);
```

### Get gamepad

- Get all currently connected Gamepads.

```javascript
var gamepads = scene.input.gamepad.getAll();
```

- Get gamepad by index

```javascript
var gamepad = scene.input.gamepad.getPad(0);
// var gamepad = scene.input.gamepad.getPad(index);
```

- Get gamepad when button-down.

```javascript
scene.input.gamepad.once('down', function (gamepad, button, value) {
}
```

  - `gamepad` : A reference to the Gamepad on which the button was released. See [Properties of gamepad](https://docs.phaser.io/phaser/concepts/input#properties)
  - `button` : A reference to the Button which was released.
  - `value` : The value of the button at the time it was released. Between 0 and 1. Some Gamepads have pressure-sensitive buttons.

### Events

- Button down

```javascript
scene.input.gamepad.on("down", function (gamepad, button, value) {});
```

or

```javascript
gamepad.on("down", function (buttonIndex, value, button) {});
```

- Button up

```javascript
scene.input.gamepad.on('up', function (gamepad, button, value) {
}
```

or

```javascript
gamepad.on("up", function (buttonIndex, value, button) {});
```

- Gamepad connected

```javascript
scene.input.gamepad.on('connected', function (gamepad, event) {
}
```

- Gamepad disconnected

```javascript
scene.input.gamepad.on('disconnected', function (gamepad, event) {
}
```

### Gamepad

#### Buttons

- Cursor buttons

```javascript
var isLeftDown = gamepad.left;
var isRightftDown = gamepad.right;
var isUpDown = gamepad.up;
var isDownDown = gamepad.down;
```

- Right buttons cluster

```javascript
var isADown = gamepad.A; // Dual Shock controller: X button
var isYDown = gamepad.Y; // Dual Shock controller: Triangle button
var isXDown = gamepad.X; // Dual Shock controller: Square button.
var isBDown = gamepad.B; // Dual Shock controller: Circle button
```

- Shoulder buttons

```javascript
var isL1Down = gamepad.L1; // XBox controller: LB button
var isL2Down = gamepad.L2; // XBox controller: LT button
var isR1Down = gamepad.R1; // XBox controller: RB button
var isR2Down = gamepad.R2; // XBox controller: RT button
```

#### Axis sticks

- Left sticks, right sticks

```javascript
var leftStick = gamepad.leftStick;
var rightStick = gamepad.rightStick;
```

  - `leftStick`, `rightStick` : Read only [vector2](https://docs.phaser.io/phaser/concepts/math#vector).
    - Angle : `leftStick.angle()`
    - Length : `leftStick.length()`
    - x, y : `leftStick.x` , `leftStick.y`

#### Properties

- `gamepad.index` : An integer that is unique for each Gamepad currently connected to the system.
This can be used to distinguish multiple controllers.
Note that disconnecting a device and then connecting a new device may reuse the previous index.
- `gamepad.id` : A string containing some information about the controller.
- `gamepad.buttons` : An array of Gamepad Button objects, corresponding to the different buttons available on the Gamepad.
- `gamepad.axes` : An array of Gamepad Axis objects, corresponding to the different axes available on the Gamepad, if any.

## Mouse wheel input

### Mouse wheel events

1. Events on touched Game object

```javascript
gameObject.on("wheel", function (pointer, dx, dy, dz, event) {
     /* ... */
});
```

2. Event on input plugin for each touched Game object

```javascript
scene.input.on(
     "gameobjectwheel",
     function (pointer, gameObject, dx, dy, dz, event) {
       /* ... */
     }
);
```

3. Events to get **all** touched Game Objects

```javascript
scene.input.on(
     "wheel",
     function (pointer, currentlyOver, dx, dy, dz, event) {
       /* ... */
     }
);
```

### Mouse wheel properties

- `pointer.deltaX` : The horizontal scroll amount that occurred due to the user moving a mouse wheel or similar input device.
- `pointer.deltaY` : The vertical scroll amount that occurred due to the user moving a mouse wheel or similar input device.
- `pointer.deltaZ` : The z-axis scroll amount that occurred due to the user moving a mouse wheel or similar input device.

## Disable All Input Events

To enable / disable input events:

```javascript
scene.input.enabled = enabled; // enabled: true/false
```

## Author Credits

Content on this page includes work by:

- [RexRainbow](https://github.com/rexrainbow)

---

**Source:** https://docs.phaser.io/phaser/concepts/input
**Last Updated:** July 30, 2025
