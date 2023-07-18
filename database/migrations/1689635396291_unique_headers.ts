import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'headers'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.unique(['key', 'response_id'])
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(['key', 'response_id'])
    })
  }
}
