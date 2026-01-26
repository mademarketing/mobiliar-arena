# Image

A Guide to the Phaser Image Game Object

An Image is a light-weight Game Object useful for the display of static images in your game, such as logos, backgrounds, scenery or other non-animated elements. Images can have input events and physics bodies, or be tweened, tinted or scrolled. The main difference between an Image and a Sprite is that you cannot animate an Image as they do not have the Animation component.

## Load texture

```javascript
this.load.image(key, url);
```

Reference: [load image](https://docs.phaser.io/phaser/concepts/loader#image)

## Add image object

```javascript
var image = this.add.image(x, y, key);
// var image = this.add.image(x, y, key, frame);
```

Add image from JSON

```javascript
var image = this.make.image({
    x: 0,
    y: 0,
    key: '',
    // frame: '',

    // angle: 0,
    // alpha: 1,
    // flipX: true,
    // flipY: true,
    // scale : {
    //    x: 1,
    //    y: 1
    //},
    // origin: {x: 0.5, y: 0.5},

    add: true
});
```

- `key`, `frame` :
  - A string
  - An array of string to pick one element at random
- `x`, `y`, `scale.x`, `scale.y` :
  - A number

  - A callback to get return value

    ```javascript
    function() { return 0; }
    ```

  - Random integer between min and max

    ```javascript
    { randInt: [min, max] }
    ```

  - Random float between min and max

    ```javascript
    { randFloat: [min, max] }
    ```

## Custom class

```javascript
class MyImage extends Phaser.GameObjects.Image {
    constructor(scene, x, y, texture, frame) {
        super(scene, x, y, texture, frame);
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

Example

```javascript
var image = new MyImage(scene, x, y, key);
```

## Texture

See [game object - texture](https://docs.phaser.io/phaser/concepts/gameobjects#textures)

## Other properties

See [game object](https://docs.phaser.io/phaser/concepts/gameobjects)

## Create mask

```javascript
var mask = image.createBitmapMask();
```

See [mask](https://docs.phaser.io/phaser/concepts/display#masks)

## Shader effects

Support [preFX and postFX effects](https://docs.phaser.io/phaser/concepts/gameobjects/shader)

## Author Credits

Content on this page includes work by:

- [RexRainbow](https://github.com/rexrainbow)

Updated on July 30, 2025, 3:14 PM UTC

---

## Related Documentation

- [Group](https://docs.phaser.io/phaser/concepts/gameobjects/group)
- [Layer](https://docs.phaser.io/phaser/concepts/gameobjects/layer)
