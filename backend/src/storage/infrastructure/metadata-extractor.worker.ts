import { parentPort } from 'worker_threads';
import { MetadataExtractionResult } from './metadata-extraction.types';

export default async function extractMetadata(filePath: string): Promise<MetadataExtractionResult> {
  try {
    // Mock metadata extraction
    const fileName = filePath.split('/').pop() || 'unknown';
    const title = `Mock Title for ${fileName}`;
    const author = `Mock Author for ${fileName}`;

    // Simulate some asynchronous work
    await new Promise<void>(resolve => setTimeout(resolve, 100));

    return { success: true, metadata: { title, author } };
  } catch (error: any) {
    return { success: false, reason: error.message };
  }
}

// Only set up the worker listener if running in a worker thread
if (parentPort) {
  parentPort.on('message', async (filePath: string) => {
    const result = await extractMetadata(filePath);
    if (parentPort) {
      parentPort.postMessage(result);
    }
  });
}
