import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('message_outbox', table => {
    table.increments('id').primary();
    table.string('user_id');
    table.string('content');
    table.dateTime('created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('message_outbox');
}
