# Sprite

A Guide to the Phaser Sprite Game Object

A Sprite Game Object is used for the display of both static and animated images in your game. Sprites can have input events and physics bodies. They can also be tweened, tinted, scrolled and animated.

The main difference between a Sprite and an Image Game Object is that you cannot animate Images. As such, Sprites take a fraction longer to process and have a larger API footprint due to the Animation Component. If you do not require animation then you can safely use Images to replace Sprites in all cases.

## Load texture

Texture for static image

```javascript
this.load.image(key, url);
```

Reference: [load image](https://docs.phaser.io/phaser/concepts/loader#image)

## Load atlas

Atlas for animation images

```javascript
this.load.atlas(key, textureURL, atlasURL);
```

Reference: [load atlas](https://docs.phaser.io/phaser/concepts/loader#texture-atlas)

## Add sprite object

```javascript
var sprite = this.add.sprite(x, y, key);
// var sprite = this.add.sprite(x, y, key, frame);
```

Add sprite from JSON

```javascript
var sprite = this.make.sprite({
    x: 0,
    y: 0,
    key: '',
    // frame: '',

    // angle: 0,
    // alpha: 1
    // flipX: true,
    // flipY: true,
    // scale : {
    //    x: 1,
    //    y: 1
    //},

    // anims: {
        // key: ,
        // repeat: ,
        // ...
    // },
    // origin: {x: 0.5, y: 0.5},

    add: true
});
```

- `key` :
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

- Define class

```javascript
class MySprite extends Phaser.GameObjects.Sprite {
      constructor(scene, x, y, texture, frame) {
          super(scene, x, y, texture, frame);
          // ...
          this.add.existing(this);
      }
      // ...

      // preUpdate(time, delta) {
      //     super.preUpdate(time, delta);
      // }
}
```

  - `this.add.existing(gameObject)` : Adds an existing Game Object to this Scene.
    - If the Game Object renders, it will be added to the Display List.
    - If it has a `preUpdate` method, it will be added to the Update List.
- Create instance

```javascript
var sprite = new MySprite(scene, x, y, key);
```

## Texture

See [game object - texture](https://docs.phaser.io/phaser/concepts/gameobjects#texture)

## Other properties

See [game object](https://docs.phaser.io/phaser/concepts/gameobjects)

## Create mask

```javascript
var mask = sprite.createBitmapMask();
```

See [mask](https://docs.phaser.io/phaser/concepts/display#masks)

## Shader effects

Support [preFX and postFX effects](https://docs.phaser.io/phaser/concepts/gameobjects/shader)

## Animation

### Create animation

- Global animation for all sprites

```javascript
this.anims.create(config);
```

- Private animation for this sprite

```javascript
sprite.anims.create(config);
```

`config` : See [Add animation section](https://docs.phaser.io/phaser/concepts/animations#add-animation).

### Create Aseprite animation

- Global Aseprite animation for all sprites

```javascript
this.anims.createFromAseprite(key, tags);
```

- Private Aseprite animation for this sprite

```javascript
sprite.anims.createFromAseprite(key, tags);
```

#### Remove animation

- Remove from global animation manager

```javascript
this.anims.remove(key);
```

or

```javascript
sprite.anims.globalRemove(key);
```

- Remove from private animation state

```javascript
sprite.anims.remove(key);
```

#### Get animation

- Get global [animation object](https://docs.phaser.io/phaser/concepts/animations#animation-object)

```javascript
var anim = this.anims.get(key);
```

- Get private [animation object](https://docs.phaser.io/phaser/concepts/animations#animation-object)

```javascript
var anim = sprite.anims.get(key);
```

#### Has animation

- Has global animation object

```javascript
var hasAnim = this.anims.exists(key);
```

- Get private animation object

```javascript
var hasAnim = sprite.anims.exists(key);
```

### Play animation

- Play

```javascript
sprite.play(key);
// sprite.play(key, ignoreIfPlaying);
```

  - `key` : Animation key string, or animation config
    - String key of animation

    - Animation config, to override default config

      ```javascript
      {
          key,
          frameRate,
          duration,
          delay,
          repeat,
          repeatDelay,
          yoyo,
          showOnStart,
          hideOnComplete,
          startFrame,
          timeScale
      }
      ```
- Play in reverse

```javascript
sprite.playReverse(key);
// sprite.playReverse(key, ignoreIfPlaying);
```

  - `key` : Animation key string, or animation config
- Play after delay

```javascript
sprite.playAfterDelay(key, delay);
```

  - `key` : Animation key string, or animation config
- Play after repeat

```javascript
sprite.playAfterRepeat(key, repeatCount);
```

  - `key` : Animation key string, or animation config

### Chain

- Chain next animation

```javascript
sprite.chain(key);
```

  - `key` : Animation key string, or animation config
- Chain next and next animation

```javascript
sprite.chain(key0).chain(key1);
```

  - `key0`, `key1` : Animation key string, or animation config

### Stop

- Immediately stop

```javascript
sprite.stop();
```

- Stop after delay

```javascript
sprite.stopAfterDelay(delay);
```

- Stop at frame

```javascript
sprite.stopOnFrame(frame);
```

  - `frame` : Frame object in current animation.

    ```javascript
    var currentAnim = sprite.anims.currentAnim;
    var frame = currentAnim.getFrameAt(index);
    ```
- Stop after repeat

```javascript
sprite.stopAfterRepeat(repeatCount);
```

### Restart

```javascript
sprite.anims.restart();
// sprite.anims.restart(includeDelay, resetRepeats);
```

### Time scale

- Get

```javascript
var timeScale = sprite.anims.globalTimeScale;
```

- Set

```javascript
sprite.anims.globalTimeScale = timeScale;
```

See also [Global time scale](https://docs.phaser.io/phaser/concepts/animations#global-time-scale)

### Properties

- Has started

```javascript
var hasStarted = sprite.anims.hasStarted;
```

- Is playing

```javascript
var isPlaying = sprite.anims.isPlaying;
```

- Is paused

```javascript
var isPaused = sprite.anims.isPaused;
```

- Total frames count

```javascript
var frameCount = sprite.anims.getTotalFrames();
```

- Delay

```javascript
var delay = sprite.anims.delay;
```

- Repeat
  - Total repeat count

    ```javascript
    var repeatCount = sprite.anims.repeat;
    ```

  - Repeat counter

    ```javascript
    var repeatCount = sprite.anims.repeatCounter;
    ```

  - Repeat delay

    ```javascript
    var repeatDelay = sprite.anims.repeatDelay;
    ```

  - Yoyo

    ```javascript
    var repeatDelay = sprite.anims.yoyo;
    ```
- Current animation key

```javascript
var key = sprite.anims.getName();
```

  - `key` : Return `''` if not playing any animation.
- Current frame name

```javascript
var frameName = sprite.anims.getFrameName();
```

  - `frameName` : Return `''` if not playing any animation.
- Current animation

```javascript
var currentAnim = sprite.anims.currentAnim;
```

- Current frame

```javascript
var currentFrame = sprite.anims.currentFrame;
```

### Events

- On start

```javascript
sprite.on('animationstart', function(currentAnim, currentFrame, sprite){});
```

```javascript
sprite.on('animationstart-' + key, function(currentAnim, currentFrame, sprite){});
```

- On restart

```javascript
sprite.on('animationrestart', function(currentAnim, currentFrame, sprite){});
```

```javascript
sprite.on('animationrestart-' + key, function(currentAnim, currentFrame, sprite){});
```

- On complete

```javascript
sprite.on('animationcomplete', function(currentAnim, currentFramee, sprite){});
```

```javascript
sprite.on('animationcomplete-' + key, function(currentAnim, currentFramee, sprite){});
```

- On stop

```javascript
sprite.on('animationstop', function(currentAnim, currentFrame, sprite){});
```

```javascript
sprite.on('animationstop-' + key, function(currentAnim, currentFrame, sprite){});
```

- On update

```javascript
sprite.on('animationupdate', function(currentAnim, currentFrame, sprite){});
```

```javascript
sprite.on('animationupdate-' + key, function(currentAnim, currentFrame, sprite){});
```

- On repeat

```javascript
sprite.on('animationrepeat', function(currentAnim, currentFrame, sprite){});
```

```javascript
sprite.on('animationrepeat-' + key, function(currentAnim, currentFrame, sprite){});
```

## Author Credits

Content on this page includes work by:

- [RexRainbow](https://github.com/rexrainbow)

Updated on July 30, 2025, 3:14 PM UTC

---

[Shader](https://docs.phaser.io/phaser/concepts/gameobjects/shader)

[Text](https://docs.phaser.io/phaser/concepts/gameobjects/text)
