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
import Token from 'App/Models/Token'
import Contract from 'App/Models/Contract'

export default class Project extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public description: string | null

  @belongsTo(() => Project, {
    foreignKey: 'forkedProjectId',
  })
  public forkedProject: BelongsTo<typeof Project>

  @hasMany(() => Token)
  public tokens: HasMany<typeof Token>

  @column({ serializeAs: null })
  public forkedProjectId: number | null

  @hasMany(() => Route)
  public routes: HasMany<typeof Route>

  @manyToMany(() => User, {
    pivotTable: 'members',
  })
  public members: ManyToMany<typeof User>

  @hasMany(() => Contract)
  public contracts: HasMany<typeof Contract>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
