import { DateTime } from 'luxon'
import {
  BaseModel,
  BelongsTo,
  belongsTo,
  column,
  HasMany,
  hasMany,
  HasOne,
  hasOne,
} from '@ioc:Adonis/Lucid/Orm'
import Route from 'App/Models/Route'
import Header from 'App/Models/Header'
import Processor from './Processor'

export default class Response extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public status: number

  @column()
  public body: string

  @column()
  public name: string

  @column()
  public isFile: boolean

  @column()
  public enabled: boolean

  @belongsTo(() => Route)
  public route: BelongsTo<typeof Route>

  @hasMany(() => Header)
  public headers: HasMany<typeof Header>

  @hasOne(() => Processor)
  public processor: HasOne<typeof Processor>

  @column({ serializeAs: null })
  public routeId: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
