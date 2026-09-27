declare module "node:sqlite" {
  type SqlValue = string | number | bigint | null;

  export class DatabaseSync {
    constructor(
      path: string,
      options?: {
        readOnly?: boolean;
        enableForeignKeyConstraints?: boolean;
      },
    );
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }

  export interface StatementSync {
    all(
      ...params: (Record<string, SqlValue> | SqlValue)[]
    ): Record<string, unknown>[];
    get(
      ...params: (Record<string, SqlValue> | SqlValue)[]
    ): Record<string, unknown> | undefined;
  }
}
