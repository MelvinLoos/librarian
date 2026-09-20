import { BulkUpdateCommand } from './bulk-update-command.value-object';

describe('BulkUpdateCommand', () => {
  it('should build a command from raw book ids and partial changes', () => {
    const command = BulkUpdateCommand.fromRaw([1, 2, 3], {
      title: 'Renamed',
      authors: [{ name: 'Frank Herbert' }],
      rating: 5,
    });

    expect(command.bookIds).toEqual([1, 2, 3]);
    expect(command.changes.title).toBe('Renamed');
    expect(command.changes.rating).toBe(5);
    expect(command.changes.authors).toHaveLength(1);
  });

  it('should throw when no book ids are provided', () => {
    expect(() => BulkUpdateCommand.fromRaw([], {})).toThrow(
      'BulkUpdateCommand requires at least one book id',
    );
  });

  it('should throw when the title change is empty', () => {
    expect(() => BulkUpdateCommand.fromRaw([1], { title: '  ' })).toThrow(
      'BulkUpdateCommand title cannot be empty',
    );
  });

  it('should enforce ids as positive integers', () => {
    expect(() => BulkUpdateCommand.fromRaw([0, -1], {})).toThrow(
      'BulkUpdateCommand book ids must be positive integers',
    );
  });
});
