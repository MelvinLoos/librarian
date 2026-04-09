import { Entity } from '../../../shared/domain/entity';

type CustomColumnDataType = 'string' | 'number' | 'boolean' | 'datetime';

export interface CustomColumnProps {
  name: string;
  value: any;
  dataType?: CustomColumnDataType;
}

export class CustomColumn extends Entity<CustomColumnProps> {
  constructor(props: CustomColumnProps, id?: string) {
    if (!props.name || props.name.trim() === '') {
      throw new Error('CustomColumn name cannot be empty');
    }
    
    super({
      ...props,
      name: props.name.trim(),
      dataType: props.dataType ?? 'string',
    }, id);
  }
}
