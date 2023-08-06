import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Project from 'App/Models/Project'

export default class Token extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public token: string

  @column()
  public name: string

  @belongsTo(() => Project, {
    foreignKey: 'projectId',
  })
  public project: BelongsTo<typeof Project>

  @column({ serializeAs: null })
  public projectId: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
