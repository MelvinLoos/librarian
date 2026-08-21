import { randomUUID } from 'node:crypto';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

/**
 * The Calibre legacy database defines triggers on its `books` and `series`
 * tables that invoke custom SQLite functions `title_sort()` and `uuid4()`:
 *
 *   - books_insert_trg  -> UPDATE books SET sort=title_sort(NEW.title),
 *                          uuid=uuid4() ...
 *   - books_update_trg  -> UPDATE books SET sort=title_sort(NEW.title) ...
 *   - series_insert_trg -> UPDATE series SET sort=title_sort(NEW.name) ...
 *   - series_update_trg -> UPDATE series SET sort=title_sort(NEW.name) ...
 *
 * Calibre registers these functions on its own SQLite connection at startup.
 * The Prisma `better-sqlite3` driver adapter does not, so any INSERT/UPDATE
 * that changes a title fails with:
 *
 *   no such function: title_sort
 *
 * This subclasses the standard adapter factory and re-registers those
 * functions on the underlying connection produced by `connect()`, so writes
 * against the legacy tables succeed.
 */

type CalibreFunctionRegistrar = {
  function(
    name: string,
    options: { deterministic?: boolean },
    fn: (...args: unknown[]) => unknown,
  ): unknown;
};

/** Article prefixes moved to the end by Calibre's `title_sort()`. */
const LEADING_ARTICLE =
  /^(A|An|The|Der|Die|Das|Le|La|Les|Un|Une|Il|El|Lo|Los|Las|O|Os|As)\s+(.+)$/i;

function titleSort(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const title = value.trim();
  const match = LEADING_ARTICLE.exec(title);
  return match ? `${match[2]}, ${match[1]}` : title;
}

export class CalibreSqliteAdapter extends PrismaBetterSqlite3 {
  override async connect() {
    const adapter = await super.connect();
    const db = (adapter as unknown as { client: CalibreFunctionRegistrar })
      .client;

    db.function('title_sort', { deterministic: true }, titleSort);
    db.function('uuid4', {}, () => randomUUID());

    return adapter;
  }
}