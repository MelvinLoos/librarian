import { Entity } from '../../../shared/domain/entity';

export type CustomColumnDataType =
  | 'text'
  | 'series'
  | 'number'
  | 'rating'
  | 'date'
  | 'boolean';

const CUSTOM_COLUMN_DATA_TYPES: readonly CustomColumnDataType[] = [
  'text',
  'series',
  'number',
  'rating',
  'date',
  'boolean',
];

export interface CustomColumnProps {
  name: string;
  value: string | number | boolean | Date | null;
  dataType?: CustomColumnDataType;
  displayLabel?: string;
  isMultiple?: boolean;
}

export class CustomColumn extends Entity<CustomColumnProps> {
  constructor(props: CustomColumnProps, id?: string) {
    if (!props.name || props.name.trim() === '') {
      throw new Error('CustomColumn name cannot be empty');
    }

    if (
      props.dataType !== undefined &&
      !CUSTOM_COLUMN_DATA_TYPES.includes(props.dataType)
    ) {
      throw new Error(
        'CustomColumn dataType must be one of: text, series, number, rating, date, boolean',
      );
    }

    super(
      {
        ...props,
        name: props.name.trim(),
        dataType: props.dataType ?? 'text',
        isMultiple: props.isMultiple ?? false,
      },
      id,
    );
  }
}
