import { beforeEach } from 'vitest';

beforeEach(() => {
  // Reset DOM state before each test
  document.body.innerHTML = '';

  // Mock Image constructor for tests
  global.Image = class {
    constructor() {
      this.onload = null;
      this.onerror = null;
      this.width = 200;
      this.height = 200;
    }

    set src(value) {
      this._src = value;
      // Simulate image loading
      setTimeout(() => {
        if (this.onload) {
          this.onload();
        }
      }, 0);
    }

    get src() {
      return this._src;
    }
  };

  // Mock canvas context
  global.HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    drawImage: vi.fn(),
    canvas: { width: 100, height: 100 },
  }));
});
