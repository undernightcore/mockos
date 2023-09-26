import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import User from 'App/Models/User'
import Project from 'App/Models/Project'

export default class Contract extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public version: string

  @belongsTo(() => User)
  public author: BelongsTo<typeof User>

  @column({ serializeAs: null })
  public userId: number | null

  @belongsTo(() => Project)
  public project: BelongsTo<typeof Project>

  @column({ serializeAs: null })
  public projectId: number

  @column()
  public swagger: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
