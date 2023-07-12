import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Response from 'App/Models/Response'

export default class Header extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public key: string

  @column()
  public value: string

  @column({ serializeAs: null })
  public responseId: number

  @belongsTo(() => Response, {
    foreignKey: 'responseId',
  })
  public response: BelongsTo<typeof Response>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
