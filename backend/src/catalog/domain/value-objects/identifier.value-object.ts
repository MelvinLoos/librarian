import { ValueObject } from '../../../shared/domain/value-object';

interface IdentifierProps {
  type: string;
  value: string;
}

export class Identifier extends ValueObject<IdentifierProps> {
  constructor(props: IdentifierProps) {
    if (!props.type || props.type.trim() === '') {
      throw new Error('Identifier type cannot be empty');
    }
    
    if (!props.value || props.value.trim() === '') {
      throw new Error('Identifier value cannot be empty');
    }

    super({
      type: props.type.trim(),
      value: props.value.trim(),
    });
  }
}
