# Phaser.Time.Timeline

A Timeline is a way to schedule events to happen at specific times in the future.

You can think of it as an event sequencer for your game, allowing you to schedule the running of callbacks, events and other actions at specific times in the future.

A Timeline is a Scene level system, meaning you can have as many Timelines as you like, each belonging to a different Scene. You can also have multiple Timelines running at the same time.

If the Scene is paused, the Timeline will also pause. If the Scene is destroyed, the Timeline will be automatically destroyed. However, you can control the Timeline directly, pausing, resuming and stopping it at any time.

## Creating a Timeline

Create an instance of a Timeline via the Game Object Factory:

```js
const timeline = this.add.timeline();
```

The Timeline always starts paused. You must call `play` on it to start it running.

You can also pass in a configuration object on creation, or an array of them:

```js
const timeline = this.add.timeline({
    at: 1000,
    run: () => {
        this.add.sprite(400, 300, 'logo');
    }
});

timeline.play();
```

## Example: Sequencing Multiple Events

In this example we sequence a few different events:

```js
const timeline = this.add.timeline([
    {
        at: 1000,
        run: () => { this.logo = this.add.sprite(400, 300, 'logo'); },
        sound: 'TitleMusic'
    },
    {
        at: 2500,
        tween: {
            targets: this.logo,
            y: 600,
            yoyo: true
        },
        sound: 'Explode'
    },
    {
        at: 8000,
        event: 'HURRY_PLAYER',
        target: this.background,
        set: {
            tint: 0xff0000
        }
    }
]);

timeline.play();
```

## Looping

The Timeline can also be looped with the repeat method:

```js
timeline.repeat().play();
```

There are lots of options available to you via the configuration object. See the [Phaser.Types.Time.TimelineEventConfig](https://docs.phaser.io/api-documentation/typedef/types-time#timelineeventconfig) typedef for more details.

## Constructor

### new Timeline(scene, [config])

**Parameters:**

| name | type | optional | description |
| --- | --- | --- | --- |
| scene | [Phaser.Scene](https://docs.phaser.io/api-documentation/class/scene) | No | The Scene which owns this Timeline. |
| config | [Phaser.Types.Time.TimelineEventConfig](https://docs.phaser.io/api-documentation/typedef/types-time#timelineeventconfig) \| Array.< [Phaser.Types.Time.TimelineEventConfig](https://docs.phaser.io/api-documentation/typedef/types-time#timelineeventconfig) > | Yes | The configuration object for this Timeline Event, or an array of them. |

**Scope:** static

**Extends:** [Phaser.Events.EventEmitter](https://docs.phaser.io/api-documentation/class/events-eventemitter)

**Source:** [src/time/Timeline.js#L14](https://github.com/phaserjs/phaser/blob/v3.87.0/src/time/Timeline.js#L14)

**Since:** 3.60.0

---

# Public Members

## complete

### complete: boolean

**Description:**

Whether the Timeline is complete (`true`) or not (`false`).

A Timeline is considered complete when all of its events have been run.

If you wish to reset a Timeline after it has completed, you can do so by calling the `Timeline.reset` method.

You can also use the `Timeline.stop` method to stop a running Timeline, at any point, without resetting it.

**Source:** [src/time/Timeline.js#L170](https://github.com/phaserjs/phaser/blob/v3.87.0/src/time/Timeline.js#L170)

**Since:** 3.60.0

---

## elapsed

### elapsed: number

**Description:**

The elapsed time counter.

Treat this as read-only.

**Source:** [src/time/Timeline.js#L125](https://github.com/phaserjs/phaser/blob/v3.87.0/src/time/Timeline.js#L125)

**Since:** 3.60.0

---

## events

### events: Array.< [Phaser.Types.Time.TimelineEvent](https://docs.phaser.io/api-documentation/typedef/types-time#timelineevent) >

**Description:**

An array of all the Timeline Events.

**Source:** [src/time/Timeline.js#L223](https://github.com/phaserjs/phaser/blob/v3.87.0/src/time/Timeline.js#L223)

**Since:** 3.60.0

---

## iteration

### iteration: number

**Description:**

The number of times this Timeline has looped.

This value is incremented each loop if looping is enabled.

**Source:** [src/time/Timeline.js#L212](https://github.com/phaserjs/phaser/blob/v3.87.0/src/time/Timeline.js#L212)

**Since:** 3.80.0

---

## loop

### loop: number

**Description:**

The number of times this timeline should loop.

If this value is -1 or any negative number this Timeline will not stop.

**Source:** [src/time/Timeline.js#L201](https://github.com/phaserjs/phaser/blob/v3.87.0/src/time/Timeline.js#L201)

**Since:** 3.80.0

---

## paused

### paused: boolean

**Description:**

Whether the Timeline is running (`true`) or active (`false`).

When paused, the Timeline will not run any of its actions.

By default a Timeline is always paused and should be started by calling the `Timeline.play` method.

You can use the `Timeline.pause` and `Timeline.resume` methods to control this value in a chainable way.

**Source:** [src/time/Timeline.js#L152](https://github.com/phaserjs/phaser/blob/v3.87.0/src/time/Timeline.js#L152)

**Since:** 3.60.0

---

## scene

### scene: [Phaser.Scene](https://docs.phaser.io/api-documentation/class/scene)

**Description:**

The Scene to which this Timeline belongs.

**Source:** [src/time/Timeline.js#L107](https://github.com/phaserjs/phaser/blob/v3.87.0/src/time/Timeline.js#L107)

**Since:** 3.60.0

---

## systems

### systems: [Phaser.Scenes.Systems](https://docs.phaser.io/api-documentation/class/scenes-systems)

**Description:**

A reference to the Scene Systems.

**Source:** [src/time/Timeline.js#L116](https://github.com/phaserjs/phaser/blob/v3.87.0/src/time/Timeline.js#L116)

**Since:** 3.60.0

---

## timeScale

### timeScale: number

**Description:**

The Timeline's delta time scale.

Values higher than 1 increase the speed of time, while values smaller than 1 decrease it.

A value of 0 freezes time and is effectively equivalent to pausing the Timeline.

This doesn't affect the delta time scale of any Tweens created by the Timeline.

You will have to set the `timeScale` of each Tween or the Tween Manager if you want them to match.

**Source:** [src/time/Timeline.js#L136](https://github.com/phaserjs/phaser/blob/v3.87.0/src/time/Timeline.js#L136)

**Since:** 3.85.0

---

## totalComplete

### totalComplete: number

**Description:**

The total number of events that have been run.

This value is reset to zero if the Timeline is restarted.

Treat this as read-only.

**Source:** [src/time/Timeline.js#L188](https://github.com/phaserjs/phaser/blob/v3.87.0/src/time/Timeline.js#L188)

**Since:** 3.60.0

---

# Public Methods

## add

### <instance> add(config)

**Description:**

Adds one or more events to this Timeline.

You can pass in a single configuration object, or an array of them:

```js
const timeline = this.add.timeline({
    at: 1000,
    run: () => {
        this.add.sprite(400, 300, 'logo');
    }
});
```

**Parameters:**

| name | type | optional | description |
| --- | --- | --- | --- |
| config | [Phaser.Types.Time.TimelineEventConfig](https://docs.phaser.io/api-documentation/typedef/types-time#timelineeventconfig) \| Array.< [Phaser.Types.Time.TimelineEventConfig](https://docs.phaser.io/api-documentation/typedef/types-time#timelineeventconfig) > | No | The configuration object for this Timeline Event, or an array of them. |

**Returns:** [Phaser.Time.Timeline](https://docs.phaser.io/api-documentation/class/time-timeline) - This Timeline instance.

**Source:** [src/time/Timeline.js#L610](https://github.com/phaserjs/phaser/blob/v3.87.0/src/time/Timeline.js#L610)

**Since:** 3.60.0

---

## addListener

### <instance> addListener(event, fn, [context])

**Description:**

Add a listener for a given event.

**Parameters:**

| name | type | optional | default | description |
| --- | --- | --- | --- | --- |
| event | string \| symbol | No |  | The event name. |
| fn | function | No |  | The listener function. |
| context | * | Yes | "this" | The context to invoke the listener with. |

**Returns:** [Phaser.Time.Timeline](https://docs.phaser.io/api-documentation/class/time-timeline) - `this`.

**Inherits:** [Phaser.Events.EventEmitter#addListener](https://docs.phaser.io/api-documentation/class/events-eventemitter#addlistener)

**Source:** [src/events/EventEmitter.js#L111](https://github.com/phaserjs/phaser/blob/v3.87.0/src/events/EventEmitter.js#L111)

**Since:** 3.0.0

---

## clear

### <instance> clear()

**Description:**

Removes all events from this Timeline, resets the elapsed time to zero and pauses the Timeline.

Any Tweens that were currently running as a result of this Timeline will be stopped.

**Returns:** [Phaser.Time.Timeline](https://docs.phaser.io/api-documentation/class/time-timeline) - This Timeline instance.

**Source:** [src/time/Timeline.js#L693](https://github.com/phaserjs/phaser/blob/v3.87.0/src/time/Timeline.js#L693)

**Since:** 3.60.0

---

## destroy

### <instance> destroy()

**Description:**

Destroys this Timeline.

This will remove all events from the Timeline and stop it from processing.

Any Tweens that were currently running as a result of this Timeline will be stopped.

This method is called automatically when the Scene shuts down, but you may also call it directly should you need to destroy the Timeline earlier.

**Overrides:** Phaser.Events.EventEmitter#destroy

**Source:** [src/time/Timeline.js#L766](https://github.com/phaserjs/phaser/blob/v3.87.0/src/time/Timeline.js#L766)

**Since:** 3.60.0

---

## emit

### <instance> emit(event, [args])

**Description:**

Calls each of the listeners registered for a given event.

**Parameters:**

| name | type | optional | description |
| --- | --- | --- | --- |
| event | string \| symbol | No | The event name. |
| args | * | Yes | Additional arguments that will be passed to the event handler. |

**Returns:** boolean - `true` if the event had listeners, else `false`.

**Inherits:** [Phaser.Events.EventEmitter#emit](https://docs.phaser.io/api-documentation/class/events-eventemitter#emit)

**Source:** [src/events/EventEmitter.js#L86](https://github.com/phaserjs/phaser/blob/v3.87.0/src/events/EventEmitter.js#L86)

**Since:** 3.0.0

---

## eventNames

### <instance> eventNames()

**Description:**

Return an array listing the events for which the emitter has registered listeners.

**Returns:** Array.<(string \| symbol)> - undefined

**Inherits:** [Phaser.Events.EventEmitter#eventNames](https://docs.phaser.io/api-documentation/class/events-eventemitter#eventnames)

**Source:** [src/events/EventEmitter.js#L55](https://github.com/phaserjs/phaser/blob/v3.87.0/src/events/EventEmitter.js#L55)

**Since:** 3.0.0

---

## getProgress

### <instance> getProgress()

**Description:**

Returns a number between 0 and 1 representing the progress of this Timeline.

A value of 0 means the Timeline has just started, 0.5 means it's half way through, and 1 means it's complete.

If the Timeline has no events, or all events have been removed, this will return 1.

If the Timeline is paused, this will return the progress value at the time it was paused.

Note that the value returned is based on the number of events that have been completed, not the 'duration' of the events (as this is unknown to the Timeline).

**Returns:** number - A number between 0 and 1 representing the progress of this Timeline.

**Source:** [src/time/Timeline.js#L741](https://github.com/phaserjs/phaser/blob/v3.87.0/src/time/Timeline.js#L741)

**Since:** 3.60.0

---

## isPlaying

### <instance> isPlaying()

**Description:**

Returns `true` if this Timeline is currently playing.

A Timeline is playing if it is not paused or not complete.

**Returns:** boolean - `true` if this Timeline is playing, otherwise `false`.

**Source:** [src/time/Timeline.js#L726](https://github.com/phaserjs/phaser/blob/v3.87.0/src/time/Timeline.js#L726)

**Since:** 3.60.0

---

## listenerCount

### <instance> listenerCount(event)

**Description:**

Return the number of listeners listening to a given event.

**Parameters:**

| name | type | optional | description |
| --- | --- | --- | --- |
| event | string \| symbol | No | The event name. |

**Returns:** number - The number of listeners.

**Inherits:** [Phaser.Events.EventEmitter#listenerCount](https://docs.phaser.io/api-documentation/class/events-eventemitter#listenercount)

**Source:** [src/events/EventEmitter.js#L75](https://github.com/phaserjs/phaser/blob/v3.87.0/src/events/EventEmitter.js#L75)

**Since:** 3.0.0

---

## listeners

### <instance> listeners(event)

**Description:**

Return the listeners registered for a given event.

**Parameters:**

| name | type | optional | description |
| --- | --- | --- | --- |
| event | string \| symbol | No | The event name. |

**Returns:** Array.<function()> - The registered listeners.

**Inherits:** [Phaser.Events.EventEmitter#listeners](https://docs.phaser.io/api-documentation/class/events-eventemitter#listeners)

**Source:** [src/events/EventEmitter.js#L64](https://github.com/phaserjs/phaser/blob/v3.87.0/src/events/EventEmitter.js#L64)

**Since:** 3.0.0

---

## off

### <instance> off(event, [fn], [context], [once])

**Description:**

Remove the listeners of a given event.

**Parameters:**

| name | type | optional | description |
| --- | --- | --- | --- |
| event | string \| symbol | No | The event name. |
| fn | function | Yes | Only remove the listeners that match this function. |
| context | * | Yes | Only remove the listeners that have this context. |
| once | boolean | Yes | Only remove one-time listeners. |

**Returns:** [Phaser.Time.Timeline](https://docs.phaser.io/api-documentation/class/time-timeline) - `this`.

**Inherits:** [Phaser.Events.EventEmitter#off](https://docs.phaser.io/api-documentation/class/events-eventemitter#off)

**Source:** [src/events/EventEmitter.js#L151](https://github.com/phaserjs/phaser/blob/v3.87.0/src/events/EventEmitter.js#L151)

**Since:** 3.0.0

---

## on

### <instance> on(event, fn, [context])

**Description:**

Add a listener for a given event.

**Parameters:**

| name | type | optional | default | description |
| --- | --- | --- | --- | --- |
| event | string \| symbol | No |  | The event name. |
| fn | function | No |  | The listener function. |
| context | * | Yes | "this" | The context to invoke the listener with. |

**Returns:** [Phaser.Time.Timeline](https://docs.phaser.io/api-documentation/class/time-timeline) - `this`.

**Inherits:** [Phaser.Events.EventEmitter#on](https://docs.phaser.io/api-documentation/class/events-eventemitter#on)

**Source:** [src/events/EventEmitter.js#L98](https://github.com/phaserjs/phaser/blob/v3.87.0/src/events/EventEmitter.js#L98)

**Since:** 3.0.0

---

## once

### <instance> once(event, fn, [context])

**Description:**

Add a one-time listener for a given event.

**Parameters:**

| name | type | optional | default | description |
| --- | --- | --- | --- | --- |
| event | string \| symbol | No |  | The event name. |
| fn | function | No |  | The listener function. |
| context | * | Yes | "this" | The context to invoke the listener with. |

**Returns:** [Phaser.Time.Timeline](https://docs.phaser.io/api-documentation/class/time-timeline) - `this`.

**Inherits:** [Phaser.Events.EventEmitter#once](https://docs.phaser.io/api-documentation/class/events-eventemitter#once)

**Source:** [src/events/EventEmitter.js#L124](https://github.com/phaserjs/phaser/blob/v3.87.0/src/events/EventEmitter.js#L124)

**Since:** 3.0.0

---

## pause

### <instance> pause()

**Description:**

Pauses this Timeline.

To resume it again, call the `Timeline.resume` method or set the `Timeline.paused` property to `false`.

If the Timeline is paused while processing the current game step, then it will carry on with all events that are due to run during that step and pause from the next game step.

Note that if any Tweens have been started prior to calling this method, they will **not** be paused as well.

**Returns:** [Phaser.Time.Timeline](https://docs.phaser.io/api-documentation/class/time-timeline) - This Timeline instance.

**Source:** [src/time/Timeline.js#L443](https://github.com/phaserjs/phaser/blob/v3.87.0/src/time/Timeline.js#L443)

**Since:** 3.60.0

---

## play

### <instance> play([fromStart])

**Description:**

Starts this Timeline running.

If the Timeline is already running and the `fromStart` parameter is `true`, then calling this method will reset the Timeline events as incomplete.

If you wish to resume a paused Timeline, then use the `Timeline.resume` method instead.

**Parameters:**

| name | type | optional | default | description |
| --- | --- | --- | --- | --- |
| fromStart | boolean | Yes | true | Reset this Timeline back to the start before playing. |

**Returns:** [Phaser.Time.Timeline](https://docs.phaser.io/api-documentation/class/time-timeline) - This Timeline instance.

**Source:** [src/time/Timeline.js#L412](https://github.com/phaserjs/phaser/blob/v3.87.0/src/time/Timeline.js#L412)

**Since:** 3.60.0

---

## preUpdate

### <instance> preUpdate(time, delta)

**Description:**

Updates the elapsed time counter, if this Timeline is not paused.

**Parameters:**

| name | type | optional | description |
| --- | --- | --- | --- |
| time | number | No | The current time. Either a High Resolution Timer value if it comes from Request Animation Frame, or Date.now if using SetTimeout. |
| delta | number | No | The delta time in ms since the last frame. This is a smoothed and capped value based on the FPS rate. |

**Source:** [src/time/Timeline.js#L244](https://github.com/phaserjs/phaser/blob/v3.87.0/src/time/Timeline.js#L244)

**Since:** 3.60.0

---

## removeAllListeners

### <instance> removeAllListeners([event])

**Description:**

Remove all listeners, or those of the specified event.

**Parameters:**

| name | type | optional | description |
| --- | --- | --- | --- |
| event | string \| symbol | Yes | The event name. |

**Returns:** [Phaser.Time.Timeline](https://docs.phaser.io/api-documentation/class/time-timeline) - `this`.

**Inherits:** [Phaser.Events.EventEmitter#removeAllListeners](https://docs.phaser.io/api-documentation/class/events-eventemitter#removealllisteners)

**Source:** [src/events/EventEmitter.js#L165](https://github.com/phaserjs/phaser/blob/v3.87.0/src/events/EventEmitter.js#L165)

**Since:** 3.0.0

---

## removeListener

### <instance> removeListener(event, [fn], [context], [once])

**Description:**

Remove the listeners of a given event.

**Parameters:**

| name | type | optional | description |
| --- | --- | --- | --- |
| event | string \| symbol | No | The event name. |
| fn | function | Yes | Only remove the listeners that match this function. |
| context | * | Yes | Only remove the listeners that have this context. |
| once | boolean | Yes | Only remove one-time listeners. |

**Returns:** [Phaser.Time.Timeline](https://docs.phaser.io/api-documentation/class/time-timeline) - `this`.

**Inherits:** [Phaser.Events.EventEmitter#removeListener](https://docs.phaser.io/api-documentation/class/events-eventemitter#removelistener)

**Source:** [src/events/EventEmitter.js#L137](https://github.com/phaserjs/phaser/blob/v3.87.0/src/events/EventEmitter.js#L137)

**Since:** 3.0.0

---

## repeat

### <instance> repeat([amount])

**Description:**

Repeats this Timeline.

If the value for `amount` is positive, the Timeline will repeat that many additional times.

For example a value of 1 will actually run this Timeline twice.

Depending on the value given, `false` is 0 and `true`, undefined and negative numbers are infinite.

If this Timeline had any events set to `once` that have already been removed, they will **not** be repeated each loop.

**Parameters:**

| name | type | optional | default | description |
| --- | --- | --- | --- | --- |
| amount | number \| boolean | Yes | -1 | Amount of times to repeat, if `true` or negative it will be infinite. |

**Returns:** [Phaser.Time.Timeline](https://docs.phaser.io/api-documentation/class/time-timeline) - This Timeline instance.

**Source:** [src/time/Timeline.js#L478](https://github.com/phaserjs/phaser/blob/v3.87.0/src/time/Timeline.js#L478)

**Since:** 3.80.0

---

## reset

### <instance> reset([loop])

**Description:**

Resets this Timeline back to the start.

This will set the elapsed time to zero and set all events to be incomplete.

If the Timeline had any events that were set to `once` that have already been removed, they will **not** be present again after calling this method.

If the Timeline isn't currently running (i.e. it's paused or complete) then calling this method resets those states, the same as calling `Timeline.play(true)`.

Any Tweens that were currently running by this Timeline will be stopped.

**Parameters:**

| name | type | optional | default | description |
| --- | --- | --- | --- | --- |
| loop | boolean | Yes | false | Set to true if you do not want to reset the loop counters. |

**Returns:** [Phaser.Time.Timeline](https://docs.phaser.io/api-documentation/class/time-timeline) - This Timeline instance.

**Source:** [src/time/Timeline.js#L557](https://github.com/phaserjs/phaser/blob/v3.87.0/src/time/Timeline.js#L557)

**Since:** 3.60.0

---

## resume

### <instance> resume()

**Description:**

Resumes this Timeline from a paused state.

The Timeline will carry on from where it left off.

If you need to reset the Timeline to the start, then call the `Timeline.reset` method.

**Returns:** [Phaser.Time.Timeline](https://docs.phaser.io/api-documentation/class/time-timeline) - This Timeline instance.

**Source:** [src/time/Timeline.js#L506](https://github.com/phaserjs/phaser/blob/v3.87.0/src/time/Timeline.js#L506)

**Since:** 3.60.0

---

## shutdown

### <instance> shutdown()

**Description:**

Removes all listeners.

**Inherits:** [Phaser.Events.EventEmitter#shutdown](https://docs.phaser.io/api-documentation/class/events-eventemitter#shutdown)

**Source:** [src/events/EventEmitter.js#L31](https://github.com/phaserjs/phaser/blob/v3.87.0/src/events/EventEmitter.js#L31)

**Since:** 3.0.0

---

## stop

### <instance> stop()

**Description:**

Stops this Timeline.

This will set the `paused` and `complete` properties to `true`.

If you wish to reset the Timeline to the start, then call the `Timeline.reset` method.

**Returns:** [Phaser.Time.Timeline](https://docs.phaser.io/api-documentation/class/time-timeline) - This Timeline instance.

**Source:** [src/time/Timeline.js#L537](https://github.com/phaserjs/phaser/blob/v3.87.0/src/time/Timeline.js#L537)

**Since:** 3.60.0

---

## update

### <instance> update(time, delta)

**Description:**

Called automatically by the Scene update step.

Iterates through all of the Timeline Events and checks to see if they should be run.

If they should be run, then the `TimelineEvent.action` callback is invoked.

If the `TimelineEvent.once` property is `true` then the event is removed from the Timeline.

If the `TimelineEvent.event` property is set then the Timeline emits that event.

If the `TimelineEvent.run` property is set then the Timeline invokes that method.

If the `TimelineEvent.loop` property is set then the Timeline invokes that method when repeated.

If the `TimelineEvent.target` property is set then the Timeline invokes the `run` method on that target.

**Parameters:**

| name | type | optional | description |
| --- | --- | --- | --- |
| time | number | No | The current time. Either a High Resolution Timer value if it comes from Request Animation Frame, or Date.now if using SetTimeout. |
| delta | number | No | The delta time in ms since the last frame. This is a smoothed and capped value based on the FPS rate. |

**Fires:** [Phaser.Time.Events#event:COMPLETE](https://docs.phaser.io/api-documentation/event/time-events#complete)

**Source:** [src/time/Timeline.js#L263](https://github.com/phaserjs/phaser/blob/v3.87.0/src/time/Timeline.js#L263)

**Since:** 3.60.0

---

## References

- **API Version:** Phaser 3.87.0
- **Source:** [GitHub Repository](https://github.com/phaserjs/phaser/blob/v3.87.0/src/time/Timeline.js)
- **Documentation:** [Phaser 3 API Documentation](https://docs.phaser.io/api-documentation/api-documentation)
- **Updated:** July 30, 2025
