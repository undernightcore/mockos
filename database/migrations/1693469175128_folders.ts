import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'routes'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(['project_id', 'endpoint', 'method'])

      table.enum('method', ['get', 'post', 'put', 'delete', 'patch']).alter({ alterType: false })
      table.text('endpoint').nullable().alter()

      table.boolean('is_folder').notNullable().defaultTo(false)
      table
        .integer('parent_folder_id')
        .unsigned()
        .nullable()
        .references('routes.id')
        .onDelete('SET NULL')
    })
  }

  public async down() {
    this.defer(async (db) => {
      await db.from('routes').whereNull('endpoint').orWhereNull('method').delete()
    })

    this.schema.alterTable(this.tableName, (table) => {
      table
        .enum('method', ['get', 'post', 'put', 'delete', 'patch'])
        .notNullable()
        .alter({ alterType: false })
      table.text('endpoint').notNullable().alter()

      table.dropColumn('is_folder')
      table.dropColumn('parent_folder_id')

      table.unique(['project_id', 'endpoint', 'method'])
    })
  }
}
