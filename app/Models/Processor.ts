import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Response from 'App/Models/Response'

export default class Processor extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public enabled: boolean

  @column()
  public code: string

  @belongsTo(() => Response, {
    foreignKey: 'responseId',
  })
  public response: BelongsTo<typeof Response>

  @column({ serializeAs: 'responseId' })
  public responseId: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
