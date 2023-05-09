import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'responses'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.text('name').notNullable()
      table.integer('status').notNullable()
      table.text('body').notNullable()
      table.boolean('is_file').notNullable()
      table.boolean('enabled').defaultTo(false)
      table.integer('route_id').unsigned().notNullable().references('routes.id').onDelete('CASCADE')
      table.unique(['route_id', 'name'])
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
