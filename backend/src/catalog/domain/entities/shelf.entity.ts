import { Entity } from '../../../shared/domain/entity';

export interface ShelfProps {
  name: string;
  userId: string;
}

export class Shelf extends Entity<ShelfProps> {
  constructor(props: ShelfProps, id?: string) {
    if (!props.name || props.name.trim() === '') {
      throw new Error('Shelf name cannot be empty');
    }
    if (!props.userId || props.userId.trim() === '') {
      throw new Error('Shelf userId cannot be empty');
    }
    super({
      name: props.name.trim(),
      userId: props.userId.trim(),
    }, id);
  }
}
