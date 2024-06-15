import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('event', table => {
    table.increments('id').primary();
    table.string('type');
    table.string('user_id');
    table.dateTime('timestamp');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('event');
}
