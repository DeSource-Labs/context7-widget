export function createSseStream(values: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    start(controller) {
      for (const value of values) {
        controller.enqueue(encoder.encode(value));
      }
      controller.close();
    }
  });
}
