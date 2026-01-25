# ETCETER4 API Documentation

This document describes the public JavaScript API for the ETCETER4 website.

## Page Navigation System

### Page Class

The `Page` class manages page state and navigation within the SPA.

```javascript
class Page {
  constructor(config)
}
```

#### Constructor Parameters

| Parameter           | Type       | Description                           |
| ------------------- | ---------- | ------------------------------------- |
| `config.id`         | `string`   | HTML element ID (e.g., "#menu")       |
| `config.tier`       | `number`   | Navigation hierarchy level (1-4)      |
| `config.upLinks`    | `string[]` | Parent page IDs for back navigation   |
| `config.downLinks`  | `string[]` | Child page IDs for forward navigation |
| `config.initialize` | `function` | Called once when page first loads     |
| `config.load`       | `function` | Called each time page becomes visible |

#### Methods

##### `static findPage(pageId)`

Finds a page by its ID.

- **Parameters:** `pageId` (string) - The page identifier (e.g., "#menu")
- **Returns:** `Page` - The found page object
- **Throws:** `Error` if page not found

##### `getBackElement()`

Returns the page to navigate to when going "back".

- **Returns:** `Page | string` - The back page or identifier

##### `initPage()`

Initializes the page (runs the initialize callback once).

### Navigation Functions

#### `showNewSection(pageId)`

Navigates to a new page with fade animation.

- **Parameters:** `pageId` (string) - The target page ID
- **Returns:** `boolean` - True if navigation started successfully

```javascript
showNewSection('#menu');
```

#### `fadeInPage(page, callback)`

Fades in a page with animation.

- **Parameters:**
  - `page` (Page) - The page to fade in
  - `callback` (function) - Called when animation completes

#### `fadeOutPage(page, callback)`

Fades out a page with animation.

- **Parameters:**
  - `page` (Page) - The page to fade out
  - `callback` (function) - Called when animation completes

---

## Carousel System

### Carousel Class

Reusable carousel component for image galleries.

```javascript
class Carousel {
  constructor(config)
}
```

#### Constructor Parameters

| Parameter              | Type     | Description                             |
| ---------------------- | -------- | --------------------------------------- |
| `config.id`            | `string` | Container element ID (e.g., "#stills")  |
| `config.images`        | `Array`  | Array of [name, count] pairs for images |
| `config.total`         | `number` | Total number of images                  |
| `config.caption`       | `jQuery` | Caption element for image descriptions  |
| `config.captionData`   | `Object` | Caption data keyed by image name        |
| `config.imageSelector` | `string` | CSS selector for image elements         |

#### Methods

##### `navigateNext(activeClass, hiddenClass)`

Navigate to the next image.

##### `navigatePrev(activeClass, hiddenClass)`

Navigate to the previous image.

##### `initTouchHandlers(activeClass, hiddenClass)`

Initialize swipe gesture support for touch devices.

##### `destroy()`

Clean up all event handlers. Call when leaving the page.

##### `loadImages()`

Lazy load additional images for the carousel.

---

## Global Configuration

### ETCETER4_CONFIG

Global configuration object for site settings.

```javascript
const ETCETER4_CONFIG = {
  animations: {
    fadeInDuration: 350,
    fadeOutDuration: 200,
    fadeOutDelay: 100,
    transitionCooldown: 100,
    navigationDebounce: 200,
  },
  carousel: {
    swipeThreshold: 50,
    loadOffset: 4,
  },
  images: {
    media: 23,
    faster: 5,
    slip: 6,
    live: 5,
  },
  ogod: {
    gridSize: 21,
    totalFrames: 410,
    frameInterval: 120,
  },
};
```

---

## Accessibility Functions

### `manageFocus(pageId)`

Sets focus to the first focusable element after page transition.

- **Parameters:** `pageId` (string) - The page that was navigated to

### `announcePageTransition(pageId)`

Announces page transition to screen readers via aria-live region.

- **Parameters:** `pageId` (string) - The page that was navigated to

---

## Cleanup Functions

These functions should be called when navigating away from their respective pages.

### `cleanupOgod()`

Clears OGOD animation interval and resize handler.

### `cleanupSketch()`

Removes p5.js canvas instances.

### `cleanupStills()`

Removes stills gallery event handlers.

### `cleanupDiary()`

Removes diary gallery event handlers.
