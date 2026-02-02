# Keyboard Shortcuts Reference Guide

Complete keyboard shortcut documentation for ETCETER4 application.

## Global Navigation

### Site Navigation

| Key      | Action                                             |
| -------- | -------------------------------------------------- |
| `Escape` | Go back/up in navigation hierarchy                 |
| `Home`   | Navigate to landing page                           |
| `M`      | Navigate to main menu (when not typing)            |
| `Enter`  | Activate focused element                           |
| `Space`  | Activate focused element (prevents default scroll) |

## Gallery Navigation (Carousel)

### Stills & Diary Galleries

| Key               | Action                |
| ----------------- | --------------------- |
| `←` (Left Arrow)  | Previous gallery item |
| `→` (Right Arrow) | Next gallery item     |

**Note:** Arrow keys are context-aware and only activate when viewing stills or diary sections.

## OGOD 3D Immersive Experience

### Keyboard Controls (Desktop)

#### Movement

| Key        | Action            |
| ---------- | ----------------- |
| `W` or `↑` | Move forward      |
| `S` or `↓` | Move backward     |
| `A` or `←` | Move left/strafe  |
| `D` or `→` | Move right/strafe |
| `Space`    | Move up           |
| `Shift`    | Move down         |

#### Interaction

| Key            | Action                    |
| -------------- | ------------------------- |
| `Escape`       | Open/close menu           |
| `E` or `Enter` | Interact with environment |

#### Keyboard Customization

- All keyboard bindings are customizable via `setKeyBinding(action, keys)`
- Bindings are stored in localStorage
- Two preset layouts available:
  - **QWERTY** (default) - Standard US/UK layout
  - **AZERTY** - French/Belgian layout
- Reset to defaults: Use `resetKeyBindings()`
- Apply layout: Use `applyKeyboardLayout('azerty')` or `applyKeyboardLayout('qwerty')`

### Mouse Controls (Desktop)

| Input                | Action                                  |
| -------------------- | --------------------------------------- |
| **Click**            | Enable pointer lock for camera control  |
| **Move** (with lock) | Look around / rotate camera             |
| **Mouse wheel**      | (Not currently mapped - for future use) |

### Touch Controls (Mobile/Tablet)

#### Single Finger

| Gesture         | Action                      |
| --------------- | --------------------------- |
| **Drag**        | Look around (rotate camera) |
| **Swipe left**  | Next track                  |
| **Swipe right** | Previous track              |
| **Long-press**  | Show track information      |

#### Two Fingers

| Gesture    | Action                      |
| ---------- | --------------------------- |
| **Pinch**  | Zoom (adjust field of view) |
| **Rotate** | Orbit camera (yaw rotation) |

#### Virtual Joystick

- **Bottom-left corner:** Movement joystick for forward/back/strafe
- Positioned with safe area insets for notches and home indicators
- Touch-responsive with visual feedback

#### Mobile Control Buttons

| Button                                    | Action                                     |
| ----------------------------------------- | ------------------------------------------ |
| **Gyroscope toggle** (top right)          | Enable/disable device orientation controls |
| **Haptic feedback toggle** (middle right) | Toggle vibration feedback (if supported)   |

### Gamepad Controls (Xbox/PlayStation)

#### Movement

| Control                                          | Action                       |
| ------------------------------------------------ | ---------------------------- |
| **Left stick**                                   | Move forward/backward/strafe |
| **Left trigger (LT)**                            | Slow walk (0.3x speed)       |
| **Right trigger (RT)**                           | Sprint (up to 2x speed)      |
| **A button** (Xbox) / **X button** (PlayStation) | Jump/move up                 |
| **B button** (Xbox) / **Circle** (PlayStation)   | Move down                    |

#### Camera

| Control         | Action                      |
| --------------- | --------------------------- |
| **Right stick** | Look around / rotate camera |

#### Menu & Interaction

| Control                                        | Action                    |
| ---------------------------------------------- | ------------------------- |
| **Start** (Xbox) / **Options** (PlayStation)   | Open/close menu           |
| **Select** (Xbox) / **Share** (PlayStation)    | Show track information    |
| **X button** (Xbox) / **Square** (PlayStation) | Interact with environment |

#### D-Pad Navigation

| Control         | Action         |
| --------------- | -------------- |
| **D-Pad Left**  | Previous track |
| **D-Pad Right** | Next track     |

#### Haptic Feedback

- **Short pulse:** Track change, button presses
- **Medium vibration:** Long-press interaction, haptic feedback toggle
- **Beat detection:** Vibration intensity varies with audio beat
- **Disabled:** When reduced motion preference is enabled

### Gyroscope & Device Orientation

| Feature            | Details                                             |
| ------------------ | --------------------------------------------------- |
| **Enabled**        | iOS 13+ requires explicit permission grant          |
| **Android**        | Available on most devices without permission        |
| **Sensitivity**    | Adjustable via `gyroscopeSensitivity` setting       |
| **Reset**          | Double-tap gyro button to reset initial orientation |
| **Reduced Motion** | Disabled when system prefers reduced motion         |

## Accessibility Features

### Screen Reader Support

- Navigation announcements for page transitions
- Position updates available via `announcePosition()`
- Environment change announcements via `announceEnvironment()`
- All interactive controls labeled with `aria-label`

### Focus Management

- Automatic focus management during page transitions
- Logical tab order through interactive elements
- Focus indicators for keyboard navigation:
  - Gyroscope button: cyan outline when focused
  - Haptic button: cyan outline when focused
  - Mobile buttons: 44px minimum touch target size

### Reduced Motion

- Controls respect `prefers-reduced-motion` media query
- Haptic feedback disabled when reduced motion enabled
- Animation durations shortened when preferred
- Gyroscope controls fully functional regardless of motion preference

## Living Pantheon

### Effects & Ambient Audio

Currently, Living Pantheon integration uses automatic ambient audio crossfading during page transitions. Manual keyboard controls for effects are planned for future releases.

**Future Features:**

- `Ctrl+Shift+L` - Toggle visual effects (planned)
- Effects library and preset system
- Per-chamber customization

## Accessibility Considerations

### Input Device Independence

- **Desktop:** Full keyboard support for all functions
- **Mobile:** Touch gestures mirror desktop keyboard actions
- **Gamepad:** Complete controller support with haptic feedback
- **Hybrid:** Mix-and-match input methods seamlessly

### Keyboard Binding Customization

Example: Rebind movement to arrow keys only

```javascript
// Get current bindings
const bindings = controller.getKeyBindings();
console.log(bindings); // { moveForward: ['KeyW', 'ArrowUp'], ... }

// Set new binding
controller.setKeyBinding('moveForward', ['ArrowUp']);

// Apply layout
controller.applyKeyboardLayout('azerty');
```

### Touchscreen Properties

- **44px minimum touch targets** on all interactive elements
- Safe area insets for notches, home indicators, dynamic islands
- Landscape/portrait responsive positioning
- Haptic feedback for confirmation (if supported)

## Browser Compatibility

| Feature            | Chrome | Firefox | Safari      | Mobile  |
| ------------------ | ------ | ------- | ----------- | ------- |
| Keyboard events    | ✓      | ✓       | ✓           | ✓       |
| Pointer Lock       | ✓      | ✓       | ✓           | Limited |
| Touch events       | ✓      | ✓       | ✓           | ✓       |
| Device Orientation | ✓      | ✓       | ✓ (iOS 13+) | ✓       |
| Gamepad API        | ✓      | ✓       | ✓           | Limited |
| Haptic Feedback    | ✓      | ✓       | ✓           | ✓       |

## Tips & Tricks

### Performance Optimization

- Keyboard input has lowest latency on desktop
- Gamepad input useful for reducing hand strain on long sessions
- Touch input works best on tablets (10"+ screens)
- Gyroscope provides immersive experience but uses more battery

### Comfort

- Use left trigger (slow walk) for extended exploration sessions
- Mobile joystick positioned for thumb accessibility
- Take breaks when using mouse look for extended periods
- Haptic feedback can be disabled if distracting

### Navigation Shortcuts

- Press `M` repeatedly to jump between menu and current page
- `Home` key is fastest way to reset navigation
- `Escape` traces your navigation breadcrumb automatically
- Arrow keys work intuitively in gallery views

## Debugging & Troubleshooting

### Key Binding Issues

```javascript
// Check current bindings
console.log(window.firstPersonController.getKeyBindings());

// Reset to defaults
window.firstPersonController.resetKeyBindings();

// Check stored bindings in localStorage
console.log(localStorage.getItem('ogod_key_bindings'));
```

### Gamepad Issues

```javascript
// Check gamepad connection status
console.log(window.firstPersonController.isGamepadConnected());

// Get gamepad info
console.log(window.firstPersonController.getGamepadInfo());

// Manual gamepad polling
const gamepads = navigator.getGamepads();
console.log(gamepads[0]); // First gamepad details
```

### Touch/Gyroscope Issues

```javascript
// Check gyroscope availability
console.log(window.firstPersonController.gyroscopeEnabled);

// Check haptic support
console.log(window.firstPersonController.isHapticAvailable());

// Check reduced motion preference
console.log(window.firstPersonController.shouldReduceMotion());
```

## Related Documentation

- [ETCETER4 Architecture](../CLAUDE.md) - Project structure and patterns
- [Page Navigation](./PAGE_NAVIGATION.md) - Navigation system details
- [3D Scene Management](./3D_SCENE.md) - OGOD 3D environment
- [Audio Integration](./AUDIO_INTEGRATION.md) - Audio system and Tone.js
