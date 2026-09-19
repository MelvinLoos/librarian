import { parentPort } from 'worker_threads';

export interface ConversionWorkerInput {
  jobId: string;
  sourceAbsolutePath: string;
  sourceFormat: string;
  targetFormat: string;
  outputRelativePath: string;
}

export interface ConversionWorkerResult {
  success: boolean;
  errorMessage?: string;
}

export default async function convertBook(
  input: ConversionWorkerInput,
): Promise<ConversionWorkerResult> {
  return { success: false, errorMessage: 'Not implemented' };
}

if (parentPort) {
  parentPort.on('message', async (input: ConversionWorkerInput) => {
    const result = await convertBook(input);
    if (parentPort) {
      parentPort.postMessage(result);
    }
  });
}