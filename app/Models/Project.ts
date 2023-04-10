import { DateTime } from 'luxon'
import {
  BaseModel,
  BelongsTo,
  belongsTo,
  column,
  HasMany,
  hasMany,
  ManyToMany,
  manyToMany,
} from '@ioc:Adonis/Lucid/Orm'
import User from 'App/Models/User'
import Route from 'App/Models/Route'

export default class Project extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public description: string | null

  @belongsTo(() => Project, {
    localKey: 'forkedProjectId',
  })
  public forkedProject: BelongsTo<typeof Project>

  @column()
  public forkedProjectId: number | null

  @hasMany(() => Route)
  public routes: HasMany<typeof Route>

  @manyToMany(() => User, {
    pivotTable: 'members',
  })
  public members: ManyToMany<typeof User>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
