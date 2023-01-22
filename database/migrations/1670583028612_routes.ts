import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'routes'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.enum('method', ['get', 'post', 'put', 'delete', 'patch']).notNullable()
      table.string('endpoint').notNullable()
      table.boolean('enabled').defaultTo(false)
      table.unique(['project_id', 'endpoint', 'method'])
      table.unique(['project_id', 'order'])
      table
        .integer('project_id')
        .unsigned()
        .notNullable()
        .references('projects.id')
        .onDelete('CASCADE')
      table.integer('order').notNullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
