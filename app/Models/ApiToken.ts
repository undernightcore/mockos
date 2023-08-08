import { DateTime } from 'luxon'
import { BaseModel, column, BelongsTo, belongsTo } from '@ioc:Adonis/Lucid/Orm'
import User from 'App/Models/User'

export default class ApiToken extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @column({ serializeAs: null })
  public userId: number

  @column()
  public name: string

  @column()
  public type: string

  @column()
  public token: string

  @column.dateTime()
  public createdAt: DateTime

  @column.dateTime()
  public expiresAt?: DateTime
}
