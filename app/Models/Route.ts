import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column, HasMany, hasMany } from '@ioc:Adonis/Lucid/Orm'
import Project from 'App/Models/Project'
import Response from 'App/Models/Response'

export default class Route extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public endpoint: string

  @column()
  public method: string

  @column()
  public enabled: boolean

  @column()
  public isFolder: boolean

  @column({ serializeAs: null })
  public order: number

  @belongsTo(() => Project)
  public project: BelongsTo<typeof Project>

  @belongsTo(() => Route, { foreignKey: 'parentFolderId' })
  public parentFolder: BelongsTo<typeof Route>

  @hasMany(() => Response)
  public responses: HasMany<typeof Response>

  @column({ serializeAs: null })
  public projectId: number

  @column({ serializeAs: null })
  public parentFolderId: number | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
