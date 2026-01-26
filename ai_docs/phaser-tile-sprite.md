# Tile Sprite

A Guide to the Phaser TileSprite to create repeating, scrollable textures

A TileSprite is a Sprite that has a repeating texture.

The texture can be scrolled and scaled independently of the TileSprite itself. Textures will automatically wrap and are designed so that you can create game backdrops using seamless textures as a source.

You shouldn't ever create a TileSprite any larger than your actual canvas size. If you want to create a large repeating background that scrolls across the whole map of your game, then you create a TileSprite that fits the canvas size and then use the `tilePosition` property to scroll the texture as the player moves. If you create a TileSprite that is thousands of pixels in size then it will consume huge amounts of memory and cause performance issues. Remember: use `tilePosition` to scroll your texture and `tileScale` to adjust the scale of the texture - don't resize the sprite itself or make it larger than it needs.

An important note about Tile Sprites and NPOT textures: Internally, TileSprite textures use GL\_REPEAT to provide seamless repeating of the textures. This, combined with the way in which the textures are handled in WebGL, means they need to be POT (power-of-two) sizes in order to wrap. If you provide a NPOT (non power-of-two) texture to a TileSprite it will generate a POT sized canvas and draw your texture to it, scaled up to the POT size. It's then scaled back down again during rendering to the original dimensions. While this works, in that it allows you to use any size texture for a Tile Sprite, it does mean that NPOT textures are going to appear anti-aliased when rendered, due to the interpolation that took place when it was resized into a POT texture. This is especially visible in pixel art graphics. If you notice it and it becomes an issue, the only way to avoid it is to ensure that you provide POT textures for Tile Sprites.

## Load texture

```javascript
this.load.image(key, url);
```

Reference: [load image](https://docs.phaser.io/phaser/concepts/loader#image)

## Add tile sprite object

```javascript
var image = this.add.tileSprite(x, y, width, height, textureKey);
```

Add tile sprite from JSON

```javascript
var image = this.make.tileSprite({
    x: 0,
    y: 0,
    width: 512,
    height: 512,
    key: '',

    // angle: 0,
    // alpha: 1
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

## Custom class

- Define class

```javascript
class MyTileSprite extends Phaser.GameObjects.TileSprite {
      constructor(scene, x, y, width, height, texture, frame) {
          super(scene, x, y, width, height, texture, frame);
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
var image = new MyTileSprite(scene, x, y, key);
```

## Properties of tiles

- Position

```javascript
image.setTilePosition(x, y);
```

or

```javascript
image.tilePositionX = x;
image.tilePositionY = y;
```

- Scale

```javascript
image.setTileScale(scaleX, scaleY);
```

or

```javascript
image.tileScaleX = scaleX;
image.tileScaleY = scaleY;
```

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

**Source:** https://docs.phaser.io/phaser/concepts/gameobjects/tile-sprite
