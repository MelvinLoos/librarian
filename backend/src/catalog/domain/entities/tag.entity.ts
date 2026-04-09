import { Entity } from '../../../shared/domain/entity';

export interface TagProps {
  name: string;
}

export class Tag extends Entity<TagProps> {
  constructor(props: TagProps, id?: string) {
    if (!props.name || props.name.trim() === '') {
      throw new Error('Tag name cannot be empty');
    }
    super({
      name: props.name.trim(),
    }, id);
  }
}
