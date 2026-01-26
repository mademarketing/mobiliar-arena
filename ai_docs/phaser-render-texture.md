# Render Texture

A Guide to the Phaser Render Texture for dynamic texture creation

A Render Texture is a combination of Dynamic Texture and an Image Game Object, that uses the Dynamic Texture to display itself with.

A Dynamic Texture is a special texture that allows you to draw textures, frames and most kind of Game Objects directly to it.

You can take many complex objects and draw them to this one texture, which can then be used as the base texture for other Game Objects, such as Sprites. Should you then update this texture, all Game Objects using it will instantly be updated as well, reflecting the changes immediately.

It's a powerful way to generate dynamic textures at run-time that are WebGL friendly and don't invoke expensive GPU uploads on each change.

In versions of Phaser before 3.60 a Render Texture was the only way you could create a texture like this, that had the ability to be drawn on. But in 3.60 we split the core functions out to the Dynamic Texture class as it made a lot more sense for them to reside in there. As a result, the Render Texture is now a light-weight shim that sits on-top of an Image Game Object and offers proxy methods to the features available from a Dynamic Texture.

**When should you use a Render Texture vs. a Dynamic Texture?**

You should use a Dynamic Texture if the texture is going to be used by multiple Game Objects, or you want to use it across multiple Scenes, because textures are globally stored.

You should use a Dynamic Texture if the texture isn't going to be displayed in-game, but is instead going to be used for something like a mask or shader.

You should use a Render Texture if you need to display the texture in-game on a single Game Object, as it provides the convenience of wrapping an Image and Dynamic Texture together for you.

Under WebGL1, a FrameBuffer, which is what this Dynamic Texture uses internally, cannot be anti-aliased. This means that when drawing objects such as Shapes or Graphics instances to this texture, they may appear to be drawn with no aliasing around the edges. This is a technical limitation of WebGL1. To get around it, create your shape as a texture in an art package, then draw that to this texture.

## Add render texture object

- Create an empty render texture object.

```javascript
var rt = this.add.renderTexture(x, y, width, height);
```

Add render texture from JSON

```javascript
var rt = this.make.renderTexture({
    x: 0,
    y: 0,
    width: 32,
    height: 32,

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

> **Note:** Origin position of this render texture is `(0, 0)` (top-left)

## Custom class

- Define class

```javascript
class MyRenderTexture extends Phaser.GameObjects.RenderTexture {
      constructor(scene, x, y, width, height) {
          super(scene, x, y, width, height);
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
var rt = new MyRenderTexture(scene, x, y, width, height);
```

## Set size

```javascript
rt.setSize(width, height);
```

## Fill color

```javascript
rt.fill(rgb);
// rt.fill(rgb, alpha, x, y, width, height);
```

- `rgb` : The number color to fill this Dynamic Texture with.
- `alpha` : The alpha value used by the fill. Default value is `1`.
- `x`, `y`, `width`, `height` : The area of the fill rectangle. Default behavior is filling whole size.

## Clear

```javascript
rt.clear();
```

```javascript
rt.clear(x, y, width, height);
```

## Draw game object

```javascript
rt.draw(entries);
// rt.draw(entries,x, y);
// rt.draw(entries, x, y, alpha, tint);
```

- `entries` :
  - Any renderable Game Object, such as a Sprite, Text, Graphics or TileSprite.
  - Tilemap Layers.
  - A Group. The contents of which will be iterated and drawn in turn.
  - A Container. The contents of which will be iterated fully, and drawn in turn.
  - A Scene Display List. Pass in `Scene.children` to draw the whole list.
  - Another Dynamic Texture, or a Render Texture.
  - A Texture Frame instance.
  - A string. This is used to look-up the texture from the Texture Manager.
- `x`, `y` : The x/y position to draw the Frame at, or the offset applied to the object.
  - If the object is a Group, Container or Display List, the coordinates are _added_ to the positions of the children.
  - For all other types of object, the coordinates are exact.
- `alpha`, `tint` : Only used by Texture Frames.
  - Game Objects use their own alpha and tint values when being drawn.

## Erase

```javascript
rt.erase(entries);
// rt.erase(entries, x, y);
```

- `entries` :
  - Any renderable Game Object, such as a Sprite, Text, Graphics or TileSprite.
  - Tilemap Layers.
  - A Group. The contents of which will be iterated and drawn in turn.
  - A Container. The contents of which will be iterated fully, and drawn in turn.
  - A Scene Display List. Pass in `Scene.children` to draw the whole list.
  - Another Dynamic Texture, or a Render Texture.
  - A Texture Frame instance.
  - A string. This is used to look-up the texture from the Texture Manager.
- `x`, `y` : The x/y position to draw the Frame at, or the offset applied to the object.
  - If the object is a Group, Container or Display List, the coordinates are _added_ to the positions of the children.
  - For all other types of object, the coordinates are exact.

## Draw frame

```javascript
rt.stamp(key, frame, x, y, {
    alpha: 1,
    tint: 0xffffff,
    angle: 0,
    rotation: 0,
    scale: 1,
    scaleX: 1,
    scaleY: 1,
    originX: 0.5,
    originY: 0.5,
    blendMode: 0,
    erase: false,
    skipBatch: false
})
```

or

```javascript
rt.drawFrame(key, frame, x, y);
// rt.drawFrame(key, frame, x, y, alpha, tint);
```

- `x`, `y` : Top-left position

## Draw repeat frames

- Repeat frames full of size

```javascript
rt.repeat(key, frame);
```

- Repeat in an area

```javascript
rt.repeat(key, frame, x, y, width, height);
// rt.repeat(key, frame, x, y, width, height, alpha, tint, skipBatch);
```

## Batch draw

1. Begin

```javascript
rt.beginDraw();
```

2. Draw
   - Draw game object

     ```javascript
     rt.batchDraw(entries, x, y, alpha, tint);
     ```

     - `entries` :
       - Any renderable Game Object, such as a Sprite, Text, Graphics or TileSprite.
       - Tilemap Layers.
       - A Group. The contents of which will be iterated and drawn in turn.
       - A Container. The contents of which will be iterated fully, and drawn in turn.
       - A Scene Display List. Pass in `Scene.children` to draw the whole list.
       - Another Dynamic Texture, or a Render Texture.
       - A Texture Frame instance.
       - A string. This is used to look-up the texture from the Texture Manager.
   - Draw frame

     ```javascript
     rt.batchDrawFrame(key, frame, x, y, alpha, tint);
     ```

   - Draw image

     ```javascript
     rt.stamp(key, frame, x, y, {
         // ...
         skipBatch: true
     })
     ```

   - Draw repeat images

     ```javascript
     rt.repeat(key, frame, x, y, width, height, alpha, tint, true);
     ```
3. End

```javascript
rt.endDraw();
```

## Internal camera

Internal camera `rt.camera`

- Scroll (offset)

```javascript
rt.camera.setScroll(x, y);
```

- Zoom (scale)

```javascript
rt.camera.setZoom(zoom);
```

- Rotate

```javascript
rt.camera.setAngle(angle);  // angle in degrees
```

## Snapshot

### Snapshot area

```javascript
texture.snapshot(callback);
// texture.snapshot(callback, type, encoderOptions);
```

or

```javascript
texture.snapshotArea(x, y, width, height, callback, type, encoderOptions);
```

- `callback` : The Function to invoke after the snapshot image is created.

```javascript
function(imageElement) {
}
```

  - `imageElement` : HTMLImageElement.
- `type` : The format of the image to create, usually `'image/png'` or `'image/jpeg'`. Default value is `'image/png'`.

- `encoderOptions` : The image quality, between `0` and `1`. Used for image formats with lossy compression, such as `'image/jpeg'`. Default value is `0.92`.

- `x`, `y`, `width`, `height` : Snapshot area.

### Get color of a pixel

```javascript
texture.snapshotPixel(x, y, callback);
```

- `x`, `y` : The x/y coordinate of the pixel to get.

- `callback` : The Function to invoke after the snapshot image is created.

```javascript
function(color) {
}
```

  - `color` : Color object.

## Global alpha

```javascript
rt.setGlobalAlpha(alpha);
// rt.globalAlpha = alpha;
```

## Global tint

```javascript
rt.setGlobalTint(tint);
// rt.globalTint = tint;
```

## Save texture

Stores a copy of this Render Texture in the Texture Manager using the given key.

```javascript
rt.saveTexture(key);
```

Calling `saveTexture` again will not save another copy of the same texture, it will just rename the key of the existing copy.

## Other properties

See [game object](https://docs.phaser.io/phaser/concepts/gameobjects)

## Create mask

```javascript
var mask = rt.createBitmapMask();
```

See [mask](https://docs.phaser.io/phaser/concepts/display#masks)

## Shader effects

Support [preFX and postFX effects](https://docs.phaser.io/phaser/concepts/gameobjects/shader)

## Author Credits

Content on this page includes work by:

- [RexRainbow](https://github.com/rexrainbow)

---

**Source:** https://docs.phaser.io/phaser/concepts/gameobjects/render-texture
**Updated:** July 30, 2025
