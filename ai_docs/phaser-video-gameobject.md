# Video

A Guide to the Phaser Video Game Object

This Game Object is capable of handling playback of a video file, video stream or media stream.

You can optionally 'preload' the video into the Phaser Video Cache:

```javascript
preload () {
  this.load.video('ripley', 'assets/aliens.mp4');
}

create () {
  this.add.video(400, 300, 'ripley');
}
```

You don't have to 'preload' the video. You can also play it directly from a URL:

```javascript
create () {
  this.add.video(400, 300).loadURL('assets/aliens.mp4');
}
```

To all intents and purposes, a video is a standard Game Object, just like a Sprite. And as such, you can do all the usual things to it, such as scaling, rotating, cropping, tinting, making interactive, giving a physics body, etc.

Transparent videos are also possible via the WebM file format. Providing the video file has was encoded with an alpha channel, and providing the browser supports WebM playback (not all of them do), then it will render in-game with full transparency.

Playback is handled entirely via the Request Video Frame API, which is supported by most modern browsers. A polyfill is provided for older browsers.

## Autoplaying Videos

Videos can only autoplay if the browser has been unlocked with an interaction, or satisfies the MEI settings. The policies that control autoplaying are vast and vary between browser. You can, and should, read more about it here: [https://developer.mozilla.org/en-US/docs/Web/Media/Autoplay_guide](https://developer.mozilla.org/en-US/docs/Web/Media/Autoplay_guide)

If your video doesn't contain any audio, then set the noAudio parameter to true when the video is loaded, and it will often allow the video to play immediately:

```javascript
preload () {
  this.load.video('pixar', 'nemo.mp4', true);
}
```

The 3rd parameter in the load call tells Phaser that the video doesn't contain any audio tracks. Video without audio can autoplay without requiring a user interaction. Video with audio cannot do this unless it satisfies the browsers MEI settings. See the MDN Autoplay Guide for further details.

Or:

```javascript
create () {
  this.add.video(400, 300).loadURL('assets/aliens.mp4', true);
}
```

You can set the noAudio parameter to true even if the video does contain audio. It will still allow the video to play immediately, but the audio will not start.

Note that due to a bug in IE11 you cannot play a video texture to a Sprite in WebGL. For IE11 force Canvas mode.

More details about video playback and the supported media formats can be found on MDN:

- [https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement)
- [https://developer.mozilla.org/en-US/docs/Web/Media/Formats](https://developer.mozilla.org/en-US/docs/Web/Media/Formats)

## Load video

```javascript
this.load.video(key, url, noAudio);
```

Reference: [load video](https://docs.phaser.io/phaser/concepts/loader#video)

**Note: Cross-origin**
Can't load video cross-origin via `this.load.video(...)`.

Using `this.add.video(x, y).loadURL(urls, noAudio, crossOrigin)` to load video cross-origin.

## Add video object

### Reference video from Video Cache

```javascript
var video = this.add.video(x, y, key);
```

- `key` : Key of the Video this Game Object will play, as stored in the Video Cache.

### Load video from URL

1. Add video object

```javascript
var video = this.add.video(x, y);
```

2. Play video from URL

```javascript
video.loadURL(url);
// video.loadURL(urls, noAudio, crossOrigin);
```

- `noAudio` : Does the video have an audio track? If not you can enable auto-playing on it.
  - `false` : Has audio track. Default behavior.
- `crossOrigin` : The value to use for the `crossOrigin` property in the video load request.
  - `undefined` : `crossorigin` will not be set in the request. Default behavior.
  - `'anonymous'`
  - `'use-credentials'`

### Load video from MediaStream

```javascript
video.loadMediaStream(stream);
// video.loadMediaStream(stream, noAudio, crossOrigin);
```

- `stream` : The MediaStream object.
- `noAudio` : Does the video have an audio track? If not you can enable auto-playing on it.
  - `false` : Has audio track. Default behavior.
- `crossOrigin` : The value to use for the `crossOrigin` property in the video load request.
  - `undefined` : `crossorigin` will not be set in the request. Default behavior.
  - `'anonymous'`
  - `'use-credentials'`

```javascript
navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(function(stream) {
        video.loadMediaStream(stream, true);
        video.play();
    })
    .catch(function(err) {

    })
```

- [navigator.mediaDevices.getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)

### Size

- Initial size : 256x265 ( `video.setSize(256, 256)`)
- Size after playing : Size of video from metadata

## Play

```javascript
video.play();
// video.play(loop, markerIn, markerOut);
```

- `loop` : Should the video loop automatically when it reaches the end? Please note that not all browsers support _seamless_ video looping for all encoding formats.
- `markerIn`, `markerOut` : Optional in/out marker time, in seconds, for playback of a sequence of the video.

**Note: Play video first time**
Call `video.play()` when playing video first time.

**Note**
If you need audio in your videos, then you'll have to consider the fact that
**the video cannot start playing until the user has interacted with the browser**, into your game flow.

## Pause

- Pause

```javascript
video.setPaused();
// video.setPaused(true);
```

- Resume

```javascript
video.setPaused(false);
```

**Note: Play video after paused**
Call `video.setPaused(false)` to resume playing.

## Stop

Stops the video playing and clears all internal event listeners.

```javascript
video.stop();
```

## Is playing

- Is playing

```javascript
var isPlaying = video.isPlaying();  // (not PAUSE) and (not not ENDED)
```

- Is paused

```javascript
var isPaused = video.isPaused();
```

## Playback time

- Get

```javascript
var playbackTime = video.getCurrentTime();
```

or

```javascript
var t = video.getProgress(); // t: 0~1
```

- Set
  - Set to

    ```javascript
    video.setCurrentTime(playbackTime);  // time in seconds
    ```

    or

    ```javascript
    video.seekTo(t); // t: 0~1
    ```

    - Is seeking

      ```javascript
      var isSeeking = video.isSeeking();
      ```
  - Forward

    ```javascript
    video.setCurrentTime('+' + time);  // time in seconds
    // video.setCurrentTime('+2');
    ```

  - Backward

    ```javascript
    video.setCurrentTime('-' + time);  // time in seconds
    // video.setCurrentTime('-2');
    ```

## Playback rate

- Get

```javascript
var rate = video.getPlaybackRate();
```

- Set

```javascript
video.setPlaybackRate(rate);
```

## Duration

```javascript
var duration = video.getDuration();  // time in seconds
```

## Volume

- Get

```javascript
var volume = video.getVolume();  // volume: 0~1
```

- Set

```javascript
video.setVolume(volume);  // volume: 0~1
```

## Mute

- Get

```javascript
var muted = video.isMuted();  // muted: true/false
```

- Set

```javascript
video.setMute(muted);  // muted: true/false
```

## Loop

- Get

```javascript
var loop = video.getLoop();  // loop: true/false
```

- Set

```javascript
video.setLoop(loop);  // loop: true/false
```

## Video key

- Get

```javascript
var key = video.getVideoKey();
```

- Change video key (video source)

```javascript
video.changeSource(key);
// video.changeSource(key, autoplay, loop, markerIn, markerOut);
```

- `autoplay` : Should the video start playing immediately, once the swap is complete?
- `loop` : Should the video loop automatically when it reaches the end? **Not all browsers support _seamless_ video looping for all encoding formats**.
- `markerIn`, `markerOut` : Optional in/out marker time, in _seconds_, for playback of a sequence of the video.

## Marks

- Add mark

```javascript
video.addMarker(key, markerIn, markerOut);
```

- `key` : A unique name to give this marker.
- `markerIn`, `markerOut` : The time, in seconds, representing the start/end of this marker.

- Play mark

```javascript
video.playMarker(key, loop);
```

- Remove mark

```javascript
video.removeMarker(key);
```

## Snapshot

1. Allocate a canvas texture

```javascript
video.saveSnapshotTexture(key);
```

- `key` : Texture key.

2. Take a snapshot

```javascript
var canvasTexture = video.video.snapshot();
// var canvasTexture = video.snapshot(width, height);
```

or

```javascript
var canvasTexture = video.snapshotArea(x, y, srcWidth, srcHeight);
// var canvasTexture = video.snapshotArea(x, y, srcWidth, srcHeight, destWidth, destHeight);
```

- `x`, `y` : The horizontal/vertical location of the top-left of the area to grab from.
- `srcWidth`, `srcHeight` : The width/height of area to grab from the video.
- `destWidth`, `destHeight` : The destination width/height of the grab, allowing you to resize it.
- `canvasTexture` : Canvas texture object.
  - Get key of texture

    ```javascript
    var key = canvasTexture.key;
    ```

## Save texture

The saved texture is automatically updated as the video plays. If you pause this video, or change its source, then the saved texture updates instantly.

```javascript
var texture = video.saveTexture(key);
// var texture = video.saveTexture(key, flipY);
```

- `flipY` : Set to `true` if use it as the input for a Shader.

## Events

- The media source doesn't represent a supported media format.

```javascript
video.on('unsupported', function(video, error){

}, scope);
```

- A Video is unlocked by a user gesture.

```javascript
video.on('unlocked', function(video, error){

}, scope);
```

- A Video tries to play a source that does not exist, or is the wrong file type.

```javascript
video.on('error', function(video, error){

}, scope);
```

- A Video has access to the metadata.

```javascript
video.on('metadata', function(video){

}, scope);
```

- A Video has exhausted its allocated time while trying to connect to a video source to start playback.

```javascript
video.on('timeout', function(video){

}, scope);
```

- A Video begins playback.

```javascript
video.on('play', function(video){

}, scope);
```

- First started or restarted.

```javascript
video.on('playing', function(video){

}, scope);
```

- The video has finished loading enough data for its first frame.

```javascript
video.on('textureready', function(video){

}, scope);
```

- A Video finishes playback by reaching the end of its duration, or `markerOut`.

```javascript
video.on('complete', function(video){

}, scope);
```

- A Video that is currently playing has looped.

```javascript
video.on('loop', function(video){

}, scope);
```

- A Video _begins_ seeking to a new point in its timeline.

```javascript
video.on('seeking', function(video){

}, scope);
```

- A Video completes seeking to a new point in its timeline.

```javascript
video.on('seeked', function(video){

}, scope);
```

- Enough of the video source has been loaded, that the browser is able to render a frame from it.

```javascript
video.on('created', function(video, width, height){

}, scope);
```

- Stalled by `stalled`, `suspend`, `waiting` DOM event.

```javascript
video.on('stalled', function(video, width, height){

}, scope);
```

- A Video is stopped from playback via a call to the `Video.stop` method.

```javascript
video.on('stop', function(video){

}, scope);
```

## Other properties

See [game object](https://docs.phaser.io/phaser/concepts/gameobjects)

## Create mask

```javascript
var mask = video.createBitmapMask();
```

See [mask](https://docs.phaser.io/phaser/concepts/display#masks)

## Shader effects

Support [preFX and postFX effects](https://docs.phaser.io/phaser/concepts/gameobjects/shader)

## Author Credits

Content on this page includes work by:

- [RexRainbow](https://github.com/rexrainbow)

---

Updated on July 30, 2025, 3:14 PM UTC
