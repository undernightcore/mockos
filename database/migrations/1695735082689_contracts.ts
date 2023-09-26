import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'contracts'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.text('version').notNullable()
      table
        .integer('project_id')
        .references('projects.id')
        .unsigned()
        .notNullable()
        .onDelete('CASCADE')
      table.unique(['version', 'project_id'])

      table.text('swagger')

      table.integer('user_id').references('users.id').unsigned().nullable().onDelete('SET NULL')
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
