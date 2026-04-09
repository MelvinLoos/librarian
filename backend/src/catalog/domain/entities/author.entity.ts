import { Entity } from '../../../shared/domain/entity';

export interface AuthorProps {
  name: string;
  sort?: string;
  link?: string;
}

export class Author extends Entity<AuthorProps> {
  constructor(props: AuthorProps, id?: string) {
    if (!props.name || props.name.trim() === '') {
      throw new Error('Author name cannot be empty');
    }
    super({
      ...props,
      name: props.name.trim(),
    }, id);
  }
}
