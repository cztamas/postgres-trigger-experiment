declare const TG_OP: 'INSERT' | 'UPDATE' | 'DELETE' | 'TRUNCATE';

declare namespace plv8 {
  function execute<T>(query: string, bindings?: unknown[]): T[];
}
