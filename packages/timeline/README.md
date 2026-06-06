# @pomelo-suite/timeline

Canvas timeline editor for Pomelo Suite.

## Install

```bash
npm install @pomelo-suite/timeline
```

## Usage

```js
const { TimelineEditor } = require('@pomelo-suite/timeline');

const timeline = new TimelineEditor(document.getElementById('timelineCanvas'));
timeline.addTrack('Video');
timeline.addClip(0, 'Intro', 0, 60, '#486eb4');
```

## Runtime

Browser-first canvas component. CommonJS export is provided for tests and bundlers.

## License

MIT
