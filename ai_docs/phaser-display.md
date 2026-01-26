# Display

## Blend Mode

Control how textures are blended with the background when rendering. Setting a blend mode affects how the colors of a sprite or a game object are combined with the colors of the pixels behind them.

Blend modes have different effects under Canvas and WebGL, and from browser to browser, depending on support. Blend Modes also cause a WebGL batch flush should it encounter a new blend mode. For these reasons try to be careful about the construction of your Scene and the frequency in which blend modes are used.

### WebGL and Canvas

- `'NORMAL'`, or `Phaser.BlendModes.NORMAL`, or `0`
  - Default setting and draws new shapes on top of the existing canvas content.
- `'ADD'`, or `Phaser.BlendModes.ADD`, or `1`
  - Where both shapes overlap the color is determined by adding color values.
- `'MULTIPLY'`, or `Phaser.BlendModes.MULTIPLY`, or `2`
  - The pixels are of the top layer are multiplied with the corresponding pixel of the bottom layer. A darker picture is the result.
- `'SCREEN'`, or `Phaser.BlendModes.SCREEN`, or `3`
  - The pixels are inverted, multiplied, and inverted again. A lighter picture is the result (opposite of multiply)
- `'ERASE'`, or `Phaser.BlendModes.ERASE`, or `17`
  - Alpha erase blend mode. Only works when rendering to a framebuffer, like a _Render Texture_

### Canvas only

- `'OVERLAY'`, or `Phaser.BlendModes.OVERLAY`, or `4`
  - A combination of multiply and screen. Dark parts on the base layer become darker, and light parts become lighter.
- `'DARKEN'`, or `Phaser.BlendModes.DARKEN`, or `5`
  - Retains the darkest pixels of both layers.
- `'LIGHTEN'`, or `Phaser.BlendModes.LIGHTEN`, or `6`
  - Retains the lightest pixels of both layers.
- `'COLOR_DODGE'`, or `Phaser.BlendModes.COLOR_DODGE`, or `7`
  - Divides the bottom layer by the inverted top layer.
- `'COLOR_BURN'`, or `Phaser.BlendModes.COLOR_BURN`, or `8`
  - Divides the inverted bottom layer by the top layer, and then inverts the result.
- `'HARD_LIGHT'`, or `Phaser.BlendModes.HARD_LIGHT`, or `9`
  - A combination of multiply and screen like overlay, but with top and bottom layer swapped.
- `'SOFT_LIGHT'`, or `Phaser.BlendModes.SOFT_LIGHT`, or `10`
  - A softer version of hard-light. Pure black or white does not result in pure black or white.
- `'DIFFERENCE'`, or `Phaser.BlendModes.DIFFERENCE`, or `11`
  - Subtracts the bottom layer from the top layer or the other way round to always get a positive value.
- `'EXCLUSION'`, or `Phaser.BlendModes.EXCLUSION`, or `12`
  - Like difference, but with lower contrast.
- `'HUE'`, or `Phaser.BlendModes.HUE`, or `13`
  - Preserves the luma and chroma of the bottom layer, while adopting the hue of the top layer.
- `'SATURATION'`, or `Phaser.BlendModes.SATURATION`, or `14`
  - Preserves the luma and hue of the bottom layer, while adopting the chroma of the top layer.
- `'COLOR'`, or `Phaser.BlendModes.COLOR`, or `15`
  - Preserves the luma of the bottom layer, while adopting the hue and chroma of the top layer.
- `'LUMINOSITY'`, or `Phaser.BlendModes.LUMINOSITY`, or `16`
  - Preserves the hue and chroma of the bottom layer, while adopting the luma of the top layer.
- `'SOURCE_IN'`, or `Phaser.BlendModes.SOURCE_IN`, or `18`
  - The new shape is drawn only where both the new shape and the destination canvas overlap. Everything else is made transparent.
- `'SOURCE_OUT'`, or `Phaser.BlendModes.SOURCE_OUT`, or `19`
  - The new shape is drawn where it doesn't overlap the existing canvas content.
- `'SOURCE_ATOP'`, or `Phaser.BlendModes.SOURCE_ATOP`, or `20`
  - The new shape is only drawn where it overlaps the existing canvas content.
- `'DESTINATION_OVER'`, or `Phaser.BlendModes.DESTINATION_OVER`, or `21`
  - New shapes are drawn behind the existing canvas content.
- `'DESTINATION_IN'`, or `Phaser.BlendModes.DESTINATION_IN`, or `22`
  - The existing canvas content is kept where both the new shape and existing canvas content overlap. Everything else is made transparent.
- `'DESTINATION_OUT'`, or `Phaser.BlendModes.DESTINATION_OUT`, or `23`
  - The existing content is kept where it doesn't overlap the new shape.
- `'DESTINATION_ATOP'`, or `Phaser.BlendModes.DESTINATION_ATOP`, or `24`
  - The existing canvas is only kept where it overlaps the new shape. The new shape is drawn behind the canvas content.
- `'LIGHTER'`, or `Phaser.BlendModes.LIGHTER`, or `25`
  - Where both shapes overlap the color is determined by adding color values.
- `'COPY'`, or `Phaser.BlendModes.COPY`, or `26`
  - Only the new shape is shown.
- `'XOR'`, or `Phaser.BlendModes.XOR`, or `27`
  - Shapes are made transparent where both overlap and drawn normal everywhere else.

## Color

The Color class holds a single color value and allows for easy modification and reading of it.

### Get color integer

- Hex string, or color integer

```javascript
var color = Phaser.Display.Color.ValueToColor(input);
```

  - `input` : Hex string, or color integer
- RGB to color

```javascript
var color = Phaser.Display.Color.GetColor(red, green, blue);
```

  - `red`, `green`, `blue` : 0 ~ 255
- RGBA to color

```javascript
var color = Phaser.Display.Color.GetColor32(red, green, blue, alpha);
```

  - `red`, `green`, `blue`, `alpha` : 0 ~ 255
- Hex string to color

```javascript
var color = Phaser.Display.Color.HexStringToColor(hex).color;
```

  - hex : `#0033ff`, `#03f`, `0x0033ff`, or `0x03f`
- RGB string to color

```javascript
var color = Phaser.Display.Color.RGBStringToColor(rgb);
```

  - rgb : `'rgb(r,g,b)'`, or `'rgba(r,g,b,a)'`
    - r, g, b : 0 ~ 255
    - a : 0 ~ 1
- HSV to color

```javascript
var color = Phaser.Display.Color.HSVToRGB(h, s, v).color;
```

  - `h`, `s`, `v` : 0 ~ 1

### Color integer to RGB

```javascript
var rgb = Phaser.Display.Color.IntegerToRGB(color);
```

- `color` : Color integer ( `0xAARRGGBB`)
- `rgb` : JSON object ( `{r, g, b, a}`)

### HSV color wheel

1. Create color array

```javascript
var colorArray = Phaser.Display.Color.HSVColorWheel(s, v);
```

2. Get color

```javascript
var color = colorArray[i].color;  // i : 0 ~ 359
```

### Color object

#### Create color object

- Create via r,g,b,a components

```javascript
var color = new Phaser.Display.Color(red, green, blue); // alpha = 255
// var color = new Phaser.Display.Color(red, green, blue, alpha);
```

  - `red`, `green`, `blue`, `alpha`: 0 ~ 255
- Create via color integer

```javascript
var color = Phaser.Display.Color.IntegerToColor(colorInteger);
```

  - colorInteger : Color integer ( `0xAARRGGBB`)

#### Set color

- Set color

```javascript
color.setTo(red, green, blue);  // alpha = 255
// color.setTo(red, green, blue, alpha);
```

  - `red`, `green`, `blue`, `alpha`: 0 ~ 255
- Set color in GL values

```javascript
color.setGLTo(red, green, blue);  // alpha = 1
// color.setTo(red, green, blue, alpha);
```

  - `red`, `green`, `blue`, `alpha`: 0 ~ 1
- Set color from color object

```javascript
color.setFromRGB(rgba);
```

  - rgba :

    ```javascript
    {
        r: 0,
        g: 0,
        b: 0,
        // a: 0
    }
    ```
- Set color from HSV

```javascript
color.setFromHSV(h, s, v);
```

- Set to transparent

```javascript
color.transparent();
```

  - Set (red, green, blue) to `0`
- Set to gray color

```javascript
color.gray(value);
```

- Set to a random color

```javascript
color.random();
```

or

```javascript
color.random(min, max);
```

  - `min` : 0 ~ 255. Default value is 0.
  - `max` : 0 ~ 255. Default value is 255.
- Set to random gray

```javascript
color.randomGray();
```

or

```javascript
color.randomGray(min, max);
```

- Set red/green/blue/alpha channel : 0 ~ 255

```javascript
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

```javascript
color.h = value;
// color.h += value;
color.s = value;
// color.s += value;
color.v = value;
// color.v += value;
```

- Set normalized red, green, blue, alpha : 0 ~ 1

```javascript
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

```javascript
color.brighten(value);
```

  - `value` : Percentage, 0 ~ 100
- Saturate : Increase the saturation (S) of this Color by the percentage amount given.

```javascript
color.saturate(value);
```

  - `value` : Percentage, 0 ~ 100
- Desaturate : Decrease the saturation (S) of this Color by the percentage amount given.

```javascript
color.desaturate(value);
```

  - `value` : Percentage, 0 ~ 100
- Lighten : Increase the lightness (V) of this Color by the percentage amount given.

```javascript
color.lighten(value);
```

  - `value` : Percentage, 0 ~ 100
- Darken : Decrease the lightness (V) of this Color by the percentage amount given.

```javascript
color.darken(value);
```

  - `value` : Percentage, 0 ~ 100

#### Properties

- RGB Color, not including the alpha channel

```javascript
var c = color.color;
```

- RGB Color, including the alpha channel.

```javascript
var c = color.color32;
```

- RGB color string which can be used in CSS color values.

```javascript
var c = color.rgba;
```

- Red, green, blue, alpha : 0 ~ 255

```javascript
var r = color.red;
var g = color.green;
var b = color.blue;
var a = color.alpha;
```

- H, S, V : 0 ~ 1

```javascript
var h = color.h;
var s = color.s;
var v = color.v;
```

- Normalized red, green, blue, alpha : 0 ~ 1

```javascript
var r = color.redGL;
var g = color.greenGL;
var b = color.blueGL;
var a = color.alphaGL;
```

#### Clone

```javascript
var newColor = color.clone();
```

### To hex string

```javascript
var hexString = Phaser.Display.Color.RGBToString(color.r, color.g, color.b, color.a);
// var hexString = Phaser.Display.Color.RGBToString(color.r, color.g, color.b, color.a, prefix);
```

### Interpolation

Interpolate between 2 colors.

```javascript
var colorOut = Phaser.Display.Color.Interpolate.RGBWithRGB(r1, g1, b1, r2, g2, b2, length, index);
var colorOut = Phaser.Display.Color.Interpolate.ColorWithColor(color1, color2, length, index);
var colorOut = Phaser.Display.Color.Interpolate.ColorWithRGB(color, r, g, b, length, index);
```

- `length`, `index` : t = `index/length` (0~1)

## Masks

Phaser has the ability to 'mask' Game Objects as they are rendered. A mask allows you to 'hide' areas of the Game Object from rendering. There are two types of mask available: Geometry Masks and Bitmap Masks. The Geometry Mask works by using geometry data in order to create the mask. For example rectangles, circles, ellipses, polygons and more. This data is used to create a path that forms the mask. Internally, it uses what is known as the stencil buffer in WebGL and the clip path in Canvas.

The Bitmap Mask works by using a texture as the mask. This texture can be any size and shape you like, and can be animated, or even a video. The alpha values of the pixels in the texture control what the mask looks like on-screen. For example, a pixel with an alpha value of 0 will hide the Game Object, where-as a pixel with an alpha value of 1 will show it. This allows you to create detailed effects, such as feathering, not possible with a Geometry Mask. Bitmap Masks are a WebGL only feature.

Masks in Phaser are slightly unique in that they are drawn and positioned in world space. A Game Object can only have one mask applied to it at any one time. However, you can apply the same mask to multiple Game Objects, if you wish. They are not Game Object specific and if you then move the Game Object, the mask will not 'follow' it. This means they require some careful planning to use effectively.

### Create mask object

#### Bitmap mask

```javascript
var mask =  scene.add.bitmapMask([maskObject], [x], [y], [texture], [frame]);
```

- `maskObject` : The Game Object or Dynamic Texture that will be used as the mask. If null it will generate an Image Game Object using the rest of the arguments.
- `x` : If creating a Game Object, the horizontal position in the world.
- `y` : If creating a Game Object, the vertical position in the world.
- `texture` : If creating a Game Object, the key, or instance of the Texture it will use to render with, as stored in the Texture Manager.
- `frame` : If creating a Game Object, an optional frame from the Texture this Game Object is rendering with.

Examples

1. Create image (image, sprite, bitmap text, particles, text), or shader

```javascript
var shape = scene.add.image(x, y, key).setVisible(false);
```

2. Create mask

```javascript
var mask = shape.createBitmapMask();
```

or

```javascript
var mask = scene.add.bitmapMask(shape);
```

#### Geometry mask

The mask is essentially a clipping path which can only make a masked pixel fully visible or fully invisible without changing its alpha (opacity).

1. Create graphics

```javascript
var shape = scene.make.graphics();
```

2. Create mask

```javascript
var mask = shape.createGeometryMask();
```

### Apply mask object

```javascript
gameObject.setMask(mask); // image.mask = mask;
```

A mask object could be added to many game objects.

> **Error**
> Don't put game object and its mask into a container together.

> **Note**
> Bitmap Mask is WebGL only.

> **Note**
> Can combine Geometry Masks and Blend Modes on the same Game Object, but Bitmap Masks can't.

### Clear mask

- Clear mask

```javascript
image.clearMask();
```

- Clear mask and destroy mask object

```javascript
image.clearMask(true);
```

### Invert alpha

Only GeometryMask has `inverse alpha` feature.

- Inverse alpha

```javascript
mask.setInvertAlpha();
// mask.invertAlpha = true;
```

- Disable

```javascript
mask.setInvertAlpha(false);
// mask.invertAlpha = false;
```

### Get shape game object

- Bitmap mask

```javascript
var shape = mask.bitmapMask;
```

- Geometry mask

```javascript
var shape = mask.geometryMask;
```

## Author Credits

Content on this page includes work by:

- [RexRainbow](https://github.com/rexrainbow)

---

**Source URL**: https://docs.phaser.io/phaser/concepts/display
**Updated**: July 30, 2025, 3:14 PM UTC
