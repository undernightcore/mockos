import { DateTime } from 'luxon'
import Hash from '@ioc:Adonis/Core/Hash'
import {
  column,
  beforeSave,
  BaseModel,
  manyToMany,
  ManyToMany,
  hasMany,
  HasMany,
} from '@ioc:Adonis/Lucid/Orm'
import Project from 'App/Models/Project'
import Member from 'App/Models/Member'
import ApiToken from 'App/Models/ApiToken'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public email: string

  @column()
  public verified: boolean

  @hasMany(() => Member)
  public invitations: HasMany<typeof Member>

  @hasMany(() => ApiToken)
  public tokens: HasMany<typeof ApiToken>

  @manyToMany(() => Project, {
    pivotTable: 'members',
  })
  public projects: ManyToMany<typeof Project>

  @column({ serializeAs: null })
  public password: string

  @column({ serializeAs: null })
  public rememberMeToken: string | null

  @column({ serializeAs: null })
  public verifyLock: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeSave()
  public static async hashPassword(user: User) {
    if (user.$dirty.password) {
      user.password = await Hash.make(user.password)
    }
  }
}
