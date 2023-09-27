import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Project from 'App/Models/Project'
import UpdateSwaggerValidator from 'App/Validators/Swagger/UpdateSwaggerValidator'
import { parseSwagger, stringifySwagger } from 'App/Helpers/Shared/swagger.helper'
import {
  beautifyVersion,
  isVersionGreater,
  isVersionValid,
} from 'App/Helpers/Shared/version.helper'
import Ws from 'App/Services/Ws'
import Database from '@ioc:Adonis/Lucid/Database'

export default class ContractsController {
  public async edit({ request, response, auth, params, bouncer, i18n }: HttpContextContract) {
    const user = await auth.authenticate()
    const project = await Project.findOrFail(params.id)
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)

    const data = await request.validate(UpdateSwaggerValidator)

    const newContract = await Database.transaction(
      async (trx) => {
        const lastContract = await project
          .related('contracts')
          .query()
          .useTransaction(trx)
          .orderBy('version', 'desc')
          .first()

        const swagger = await parseSwagger(data.swagger).catch(() => {
          throw {
            status: 400,
            message: i18n.formatMessage('responses.swagger.edit.invalid_swagger'),
          }
        })

        const currentVersion = lastContract?.version ?? null
        const newVersion = swagger.data.info.version

        if (data.originalVersion !== currentVersion) {
          throw {
            status: 409,
            message: i18n.formatMessage('responses.swagger.edit.outdated_version'),
          }
        }

        if (!isVersionValid(newVersion)) {
          throw {
            status: 400,
            message: i18n.formatMessage('responses.swagger.edit.invalid_version'),
          }
        }

        if (currentVersion !== null && !isVersionGreater(currentVersion, newVersion)) {
          throw {
            status: 400,
            message: i18n.formatMessage('responses.swagger.edit.greater_version'),
          }
        }

        swagger.data.info.version = beautifyVersion(newVersion)

        return project.related('contracts').create(
          {
            version: beautifyVersion(newVersion),
            swagger: stringifySwagger(swagger.data, swagger.isJSON),
            userId: user.id,
          },
          { client: trx }
        )
      },
      { isolationLevel: 'repeatable read' }
    )

    Ws.io.emit(`swagger:${project.id}`, `updated`)

    return response.ok({
      message: i18n.formatMessage('responses.swagger.edit.swagger_saved', {
        version: newContract.version,
      }),
    })
  }

  public async get({ response, params, auth, i18n, bouncer }: HttpContextContract) {
    await auth.authenticate()
    const project = await Project.findOrFail(params.id)
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)

    const contract = params.version
      ? await project.related('contracts').query().where('version', String(params.version)).first()
      : await project.related('contracts').query().orderBy('version', 'desc').first()

    if (!contract && params.version) {
      throw { status: 404, message: i18n.formatMessage('responses.swagger.get.version_not_found') }
    }

    return response.ok(contract ?? null)
  }

  public async history({ auth, request, params, bouncer, i18n, response }: HttpContextContract) {
    await auth.authenticate()
    const project = await Project.findOrFail(params.id)
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)

    const page = await request.input('page')
    const perPage = await request.input('perPage')

    const versions = await project
      .related('contracts')
      .query()
      .orderBy('version', 'desc')
      .paginate(page ?? 1, perPage ?? 20)

    return response.ok(versions.serialize({ fields: { omit: ['swagger'] } }))
  }

  public async rollback({ response, auth, i18n, params, bouncer }: HttpContextContract) {
    await auth.authenticate()
    const project = await Project.findOrFail(params.id)
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)

    const version = await project
      .related('contracts')
      .query()
      .where('version', params.version)
      .firstOrFail()

    await Database.transaction(
      async (trx) => {
        const newerVersions = await project
          .related('contracts')
          .query()
          .useTransaction(trx)
          .where('version', '>', version.version)

        await trx
          .from('contracts')
          .delete()
          .whereIn(
            'id',
            newerVersions.map((newerVersion) => newerVersion.id)
          )
      },
      { isolationLevel: 'repeatable read' }
    )

    Ws.io.emit(`swagger:${project.id}`, `rollback`)

    return response.ok({
      message: i18n.formatMessage('responses.swagger.rollback.rollback_successful', {
        version: version.version,
      }),
    })
  }
}
