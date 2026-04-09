import { Entity } from '../../../shared/domain/entity';

export interface SeriesProps {
  name: string;
  index?: number;
}

export class Series extends Entity<SeriesProps> {
  constructor(props: SeriesProps, id?: string) {
    if (!props.name || props.name.trim() === '') {
      throw new Error('Series name cannot be empty');
    }
    super({
      name: props.name.trim(),
      index: props.index ?? 1,
    }, id);
  }
}
