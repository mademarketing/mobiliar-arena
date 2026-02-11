# Coding Standards - Mobiliar Arena

## Core Principles

1. **Type Safety First** - Leverage TypeScript's type system fully
2. **Use Enums for Constants** - Never hardcode string literals for events, keys, or identifiers
3. **Single Source of Truth** - Define constants once, reference everywhere
4. **Fail Fast** - TypeScript compile errors prevent runtime bugs

---

## Required: Use Enums Instead of Hardcoded Strings

### ❌ NEVER Do This

```typescript
// BAD - Hardcoded event strings
socket.emit('buzzer-press', data);
socket.on('prize-awarded', handler);

// BAD - Hardcoded texture keys
this.add.image(x, y, 'background');
this.load.image('logo', 'assets/logo.png');

// BAD - Hardcoded scene keys
this.scene.start('lobby');
this.scene.start('game');
```

**Problems**:
- ❌ Typos cause runtime errors (not caught by TypeScript)
- ❌ Refactoring is error-prone (miss one string, break the app)
- ❌ No IDE autocomplete
- ❌ No compile-time validation

### ✅ ALWAYS Do This

```typescript
// GOOD - Use GameEvents enum
socket.emit(GameEvents.BuzzerPress, data);
socket.on(GameEvents.PrizeAwarded, handler);

// GOOD - Use TextureKeys enum
this.add.image(x, y, TextureKeys.Background);
this.load.image(TextureKeys.Logo, 'assets/logo.png');

// GOOD - Use SceneKeys enum
this.scene.start(SceneKeys.Lobby);
this.scene.start(SceneKeys.Game);
```

**Benefits**:
- ✅ TypeScript catches typos at compile time
- ✅ IDE autocomplete shows all available options
- ✅ Refactoring is safe (rename once in enum, all usages update)
- ✅ Easy to find all usages (search for enum value)

---

## Enum Locations

### GameEvents
**File**: `docker/app/shared/GameEvents.ts`

**Usage**: All Socket.io event names (shared between client and server)

```typescript
// Client usage
import GameEvents from '../../../shared/GameEvents';

// Server usage
import GameEvents from '../shared/GameEvents';

// Emit events
socket.emit(GameEvents.BuzzerPress, data);
gamePlugin.events.emit(GameEvents.AnimationSequenceTriggered, config);

// Listen to events
socket.on(GameEvents.PrizeAwarded, handler);
this.game.events.on(GameEvents.PreloadFinished, handler);
io.emit(GameEvents.PrizeAwarded, outcome);
```

### TextureKeys
**File**: `docker/app/client/src/consts/TextureKeys.ts`

**Usage**: All Phaser texture/image keys

```typescript
import TextureKeys from '../consts/TextureKeys';

// Load textures
this.load.image(TextureKeys.Background, 'assets/images/background.png');
this.load.image(TextureKeys.Logo, 'assets/images/logo.png');

// Use textures
this.add.image(x, y, TextureKeys.Background);
this.add.sprite(x, y, TextureKeys.Ball);
```

### SceneKeys
**File**: `docker/app/client/src/consts/SceneKeys.ts`

**Usage**: All Phaser scene identifiers

```typescript
import SceneKeys from '../consts/SceneKeys';

// Scene registration
scene.add(SceneKeys.Bootstrap, Bootstrap);
scene.add(SceneKeys.Lobby, Lobby);
scene.add(SceneKeys.Game, Game);

// Scene transitions
this.scene.start(SceneKeys.Game);
this.scene.start(SceneKeys.Result);
this.scene.stop(SceneKeys.Preload);
```

### PrizeTextureKeys
**File**: `docker/app/shared/PrizeTextureKeys.ts`

**Usage**: Prize-specific texture keys (shared between client and server)

```typescript
import { PrizeTextureKeys, isValidPrizeTextureKey } from '../shared/PrizeTextureKeys';

// Validate prize textures
if (!isValidPrizeTextureKey(textureKey)) {
  throw new Error(`Invalid prize texture: ${textureKey}`);
}

// Use in database
prizeDatabase.createPrize(PrizeTextureKeys.GiftCard, displayName);
```

---

## Adding New Constants

### When to Create a New Enum

Create a new enum when you have:
- **3+ related string constants** used in multiple places
- **Event names** for Socket.io or Phaser events
- **Asset keys** for textures, sounds, fonts, etc.
- **Identifiers** that must match between client and server

### How to Add to Existing Enum

**Example: Adding a new GameEvent**

1. **Define in enum** (`docker/app/shared/GameEvents.ts`):
```typescript
enum GameEvents {
  // ... existing events ...

  /**
   * New event description
   * Payload: { field: type }
   */
  NewEvent = "new-event",
}
```

2. **Use everywhere**:
```typescript
// Emit
socket.emit(GameEvents.NewEvent, payload);

// Listen
socket.on(GameEvents.NewEvent, handler);
```

3. **No hardcoded strings anywhere!**

---

## Code Review Checklist

Before submitting code, check for:

- [ ] No hardcoded Socket.io event strings - use `GameEvents`
- [ ] No hardcoded Phaser texture keys - use `TextureKeys`
- [ ] No hardcoded Phaser scene keys - use `SceneKeys`
- [ ] No hardcoded prize texture keys - use `PrizeTextureKeys`
- [ ] All new constants added to appropriate enum
- [ ] TypeScript compiles without errors
- [ ] IDE shows no "magic string" warnings

---

## Exception: When Hardcoded Strings Are OK

**Allowed cases**:

1. **User-facing text**:
   ```typescript
   // OK - Display text
   this.add.text(x, y, "Drücke den Buzzer!");
   console.log("Game started successfully");
   ```

2. **Configuration values**:
   ```typescript
   // OK - Config keys
   const openTime = settings.game.openTime;
   process.env.NODE_ENV === 'production';
   ```

3. **File paths** (when not used as identifiers):
   ```typescript
   // OK - Actual file paths
   this.load.image(TextureKeys.Logo, 'assets/images/logo.png');
   //                ✅ enum         ✅ path string
   ```

4. **Standard Socket.io events**:
   ```typescript
   // OK - Socket.io built-in events
   socket.on('connect', handler);
   socket.on('disconnect', handler);
   socket.on('error', handler);
   ```

**Rule of thumb**: If the string is an **identifier** that must match across files, use an enum. If it's **data**, hardcoded is fine.

---

## ESLint Configuration (Future)

To enforce this standard automatically, add ESLint rules:

```javascript
// .eslintrc.js (future enhancement)
module.exports = {
  rules: {
    // Warn on socket.emit/on with string literals
    'no-restricted-syntax': [
      'warn',
      {
        selector: "CallExpression[callee.property.name=/^(emit|on)$/] > Literal",
        message: "Use GameEvents enum instead of hardcoded event strings"
      }
    ],

    // Warn on scene methods with string literals
    'no-restricted-syntax': [
      'warn',
      {
        selector: "CallExpression[callee.object.property.name='scene'][callee.property.name=/^(start|launch|stop|add)$/] > Literal",
        message: "Use SceneKeys enum instead of hardcoded scene keys"
      }
    ],
  }
};
```

**Note**: ESLint configuration is not yet implemented, but this is the recommended approach.

---

## Migration Guide

### Finding Hardcoded Strings

Search for patterns:
```bash
# Find hardcoded event emits
grep -r "\.emit\(['\"]" docker/app/

# Find hardcoded event listeners
grep -r "\.on\(['\"]" docker/app/

# Find hardcoded scene references
grep -r "scene\.(start|launch|stop)\(['\"]" docker/app/client/

# Find hardcoded texture references
grep -r "\.image\(['\"]" docker/app/client/
```

### Replacing Hardcoded Strings

1. **Identify the string**:
   ```typescript
   socket.emit('prize-awarded', outcome);
   //           ^^^^^^^^^^^^^^
   ```

2. **Find corresponding enum**:
   ```typescript
   // Check GameEvents.ts
   GameEvents.PrizeAwarded = "prize-awarded"
   ```

3. **Import enum**:
   ```typescript
   import GameEvents from '../consts/GameEvents';
   ```

4. **Replace**:
   ```typescript
   socket.emit(GameEvents.PrizeAwarded, outcome);
   ```

5. **Verify TypeScript compiles**:
   ```bash
   npm run tsc
   ```

---

## Examples from Codebase

### ✅ Good Examples

**Game.ts** - Using enums correctly:
```typescript
import SceneKeys from "../consts/SceneKeys";
import TextureKeys from "../consts/TextureKeys";
import GameEvents from "../consts/GameEvents";

// Scene registration
constructor() {
  super(SceneKeys.Game);
}

// Texture loading
this.background = this.add.image(0, 0, TextureKeys.Background);

// Event handling
this.gamePlugin.events.on(
  GameEvents.BuzzerPress,
  this.handleBuzzerPress,
  this
);
```

**stress-test.ts** - Importing client enums:
```typescript
import GameEvents from '../../client/src/consts/GameEvents';

socket.on(GameEvents.PrizeAwarded, handler);
socket.emit(GameEvents.BuzzerPress, channel);
```

### ❌ Bad Examples (Don't Do This)

```typescript
// BAD - Will cause typos and runtime errors
socket.emit('prize-awrded', outcome); // Typo! Won't be caught
this.scene.start('lobby'); // Works but fragile
this.add.image(x, y, 'backgrond'); // Typo! Phaser error at runtime
```

---

## Summary

**Golden Rule**: If you're typing a **string literal** for an **event name**, **scene key**, or **texture key**, you're probably doing it wrong.

**Always use**:
- `GameEvents` for Socket.io and Phaser events
- `SceneKeys` for Phaser scenes
- `TextureKeys` for Phaser textures
- `PrizeTextureKeys` for prize-related textures

**Benefits**:
- ✅ Type safety
- ✅ Refactoring safety
- ✅ IDE autocomplete
- ✅ Compile-time error detection
- ✅ Easier debugging
- ✅ Better code maintainability

---

## Questions?

If you're unsure whether to use an enum or hardcoded string, ask:
1. Is this an identifier that must match between files? → **Use enum**
2. Will I need to reference this value elsewhere? → **Use enum**
3. Is this just display text or data? → **Hardcoded is OK**
