type Chunk = ArrayBuffer;

class StreamBuffer {
  private buffer: Chunk[] = [];
  private maxSize = 10; // ~200ms if each chunk = 20ms
  private flushing = false;

  constructor(private onFlush: (chunks: Chunk[]) => void) {}

  addChunk(chunk: Chunk) {
    if (!chunk || chunk.byteLength === 0) return;

    this.buffer.push(chunk);

    // Prevent memory growth
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }

    this.flushSoon();
  }

  private flushSoon() {
    if (this.flushing) return;

    this.flushing = true;

    // 15–25ms keeps latency low
    setTimeout(() => {
      this.flush();
      this.flushing = false;
    }, 20);
  }

  private flush() {
    if (this.buffer.length === 0) return;

    const chunks = [...this.buffer];
    this.buffer = [];

    try {
      this.onFlush(chunks);
    } catch (err) {
      console.error("StreamBuffer flush error:", err);
    }
  }

  clear() {
    this.buffer = [];
  }
}

export default StreamBuffer;
