import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'responses'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text('swagger').nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('swagger')
    })
  }
}
