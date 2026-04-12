export interface ITagRepository {
  getTopTags(limit: number): Promise<{ id: number; name: string; count: number }[]>;
}