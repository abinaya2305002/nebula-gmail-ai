import { EmailFilterParams } from '../types/index.js';

export class QueryBuilder {
  /**
   * Constructs a Gmail search query string from filter parameters
   */
  public static toGmailQuery(params: EmailFilterParams = {}): string {
    const terms: string[] = [];

    if (params.folder) {
      if (params.folder === 'inbox') {
        terms.push('in:inbox');
      } else if (params.folder === 'sent') {
        terms.push('in:sent');
      } else if (params.folder === 'trash') {
        terms.push('in:trash');
      } else if (params.folder === 'starred') {
        terms.push('is:starred');
      }
    }

    if (params.isUnread !== undefined) {
      terms.push(params.isUnread ? 'is:unread' : 'is:read');
    }

    if (params.sender && params.sender.trim()) {
      terms.push(`from:${params.sender.trim()}`);
    }

    if (params.dateRangeDays && params.dateRangeDays > 0) {
      const pastDate = new Date(Date.now() - params.dateRangeDays * 24 * 60 * 60 * 1000);
      const yyyy = pastDate.getUTCFullYear();
      const mm = String(pastDate.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(pastDate.getUTCDate()).padStart(2, '0');
      terms.push(`after:${yyyy}/${mm}/${dd}`);
    }

    if (params.query && params.query.trim()) {
      terms.push(params.query.trim());
    }

    return terms.join(' ');
  }
}
