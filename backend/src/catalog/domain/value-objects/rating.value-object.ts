import { ValueObject } from '../../../shared/domain/value-object';

interface RatingProps {
  value: number;
}

export class Rating extends ValueObject<RatingProps> {
  constructor(props: RatingProps) {
    if (props.value < 0 || props.value > 5) {
      throw new Error('Rating must be between 0 and 5');
    }
    super(props);
  }
}
