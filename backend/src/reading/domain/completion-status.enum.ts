/**
 * Ubiquitous Language: CompletionStatus
 *
 * The lifecycle status of a User's consumption of a Book.
 * - NOT_STARTED: The User has not begun reading (0%).
 * - IN_PROGRESS: The User is actively reading (0% < progress < 100%).
 * - COMPLETED:   The User has finished the Book (100%).
 */
export enum CompletionStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}
