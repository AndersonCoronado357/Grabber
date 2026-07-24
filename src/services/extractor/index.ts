import type { MediaExtractor } from './types.js';
import { YtDlpExtractor } from './ytdlp.js';

let extractor: MediaExtractor = new YtDlpExtractor();

export function getExtractor(): MediaExtractor {
  return extractor;
}

/** Solo para pruebas: permite inyectar un extractor simulado. */
export function setExtractor(e: MediaExtractor): void {
  extractor = e;
}

export * from './types.js';
