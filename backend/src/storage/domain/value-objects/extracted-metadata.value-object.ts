import type { ExtractedMetadataPayload } from '../events/metadata-extracted.event';

/**
 * ExtractedMetadata
 *
 * Value Object capturing the real metadata parsed out of an uploaded asset
 * (EPUB OPF / PDF Info+XMP). Pure TS — zero external dependencies.
 */
export interface ExtractedMetadataProps {
  title: string;
  authors: string[];
  isbn?: string;
  publisher?: string;
  pubDate?: string;
  language?: string;
  description?: string;
  cover?: Buffer;
  coverMimeType?: string;
}

export class ExtractedMetadata {
  constructor(public readonly props: ExtractedMetadataProps) {
    if (!props.title || props.title.trim() === '') {
      throw new Error('ExtractedMetadata title cannot be empty');
    }
    if (
      !props.authors ||
      props.authors.some((author) => !author || author.trim() === '')
    ) {
      const index = props.authors
        ? props.authors.findIndex((author) => !author || author.trim() === '')
        : 0;
      throw new Error(
        `ExtractedMetadata author at index ${index} cannot be empty`,
      );
    }
    if (props.cover !== undefined && !props.coverMimeType) {
      throw new Error(
        'ExtractedMetadata coverMimeType is required when a cover is set',
      );
    }
  }

  static fromRaw(raw: ExtractedMetadataPayload): ExtractedMetadata {
    return new ExtractedMetadata({
      title: raw.title,
      authors: raw.authors ?? [],
      isbn: raw.isbn,
      publisher: raw.publisher,
      pubDate: raw.pubDate,
      language: raw.language,
      description: raw.description,
      cover: raw.cover,
      coverMimeType: raw.coverMimeType,
    });
  }

  toPayload(): ExtractedMetadataPayload {
    return {
      title: this.props.title,
      authors: this.props.authors,
      isbn: this.props.isbn,
      publisher: this.props.publisher,
      pubDate: this.props.pubDate,
      language: this.props.language,
      description: this.props.description,
      cover: this.props.cover,
      coverMimeType: this.props.coverMimeType,
    };
  }
}
