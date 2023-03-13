import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Project from 'App/Models/Project'
import User from 'App/Models/User'

export default class Member extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @belongsTo(() => Project)
  public project: BelongsTo<typeof Project>

  @column({ serializeAs: null })
  public projectId: number

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @column({ serializeAs: null })
  public userId: number

  @column()
  public verified: boolean
}
