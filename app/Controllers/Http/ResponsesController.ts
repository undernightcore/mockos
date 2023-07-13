import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Route from 'App/Models/Route'
import CreateResponseValidator from 'App/Validators/Response/CreateResponseValidator'
import Database from '@ioc:Adonis/Lucid/Database'
import Response from 'App/Models/Response'
import EditResponseValidator from 'App/Validators/Response/EditResponseValidator'
import Ws from 'App/Services/Ws'
import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser'
import { deleteIfOnceUsed, getFileName } from 'App/Helpers/Shared/file.helper'
import { prettifyJson } from 'App/Helpers/Shared/string.helper'
import Project from 'App/Models/Project'

export default class ResponsesController {
  public async create({ request, response, auth, bouncer, params, i18n }: HttpContextContract) {
    await auth.authenticate()
    const isFile = Boolean(await request.input('isFile', false))
    const data = await request.validate(CreateResponseValidator)
    const route = await Route.findOrFail(params.id)
    await route.load('project')
    await bouncer.with('ProjectPolicy').authorize('isMember', route.project, i18n)
    await Database.transaction(async (trx) => {
      route.useTransaction(trx)
      if (data.enabled) await route.related('responses').query().update('enabled', false)
      if (isFile) {
        const file = data.body as MultipartFileContract
        await file.moveToDisk('responses')
        data.body = getFileName(file.fileName ?? '')
      } else {
        data.body = prettifyJson(data.body as string)
      }
      await route.related('responses').create({ ...data, isFile, body: data.body as string })
    })
    Ws.io.emit(`route:${route.id}`, 'updated')
    return response.created({
      message: i18n.formatMessage('responses.response.create.response_created'),
    })
  }

  public async getList({ request, response, auth, bouncer, params, i18n }: HttpContextContract) {
    await auth.authenticate()
    const route = await Route.findOrFail(params.id)
    const project = await Project.findOrFail(route.projectId)
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 10)
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)
    const responses = await route
      .related('responses')
      .query()
      .preload('headers')
      .orderBy('enabled', 'desc')
      .orderBy('created_at', 'desc')
      .paginate(page, perPage)
    return response.ok(responses)
  }

  public async get({ response, auth, bouncer, params, i18n }: HttpContextContract) {
    await auth.authenticate()
    const routeResponse = await Response.findOrFail(params.id)
    const route = await Route.findOrFail(routeResponse.routeId)
    const project = await Project.findOrFail(route.projectId)
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)
    await routeResponse.load('headers')
    return response.ok(routeResponse)
  }

  public async edit({ request, response, auth, bouncer, params, i18n }: HttpContextContract) {
    await auth.authenticate()
    const isFileNow = Boolean(await request.input('isFile', false))
    const routeResponse = await Response.findOrFail(params.id)
    const route = await Route.findOrFail(routeResponse.routeId)
    params['routeId'] = route.id // Send context to validator
    const data = await request.validate(EditResponseValidator)
    const project = await Project.findOrFail(route.projectId)
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)
    await Database.transaction(async (trx) => {
      if (data.enabled) {
        await route
          .related('responses')
          .query()
          .useTransaction(trx)
          .whereNot('id', routeResponse.id)
          .update('enabled', false)
      }
      const wasFileBefore = routeResponse.isFile
      if (!wasFileBefore && isFileNow && !data.body) {
        return response
          .status(400)
          .send({ errors: [i18n.formatMessage('responses.response.edit.missing_file_body')] })
      } else if (isFileNow && data.body) {
        data.body = await this.#uploadFile(data.body as MultipartFileContract)
        if (wasFileBefore) {
          await deleteIfOnceUsed('responses', routeResponse.body)
        } else if (!wasFileBefore) {
          await this.#flushResponseContentType(routeResponse)
        }
      } else if (!isFileNow && wasFileBefore) {
        await this.#flushResponseContentType(routeResponse)
        await deleteIfOnceUsed('responses', routeResponse.body)
      }
      const newBodyValue =
        data.body === undefined
          ? routeResponse.body
          : isFileNow
          ? (data.body as string)
          : prettifyJson(data.body as string)
      await routeResponse
        .merge({
          ...data,
          isFile: isFileNow,
          body: newBodyValue,
        })
        .useTransaction(trx)
        .save()
    })
    Ws.io.emit(`route:${route.id}`, 'updated')
    Ws.io.emit(`response:${routeResponse.id}`, 'updated')
    return response.ok({ message: i18n.formatMessage('responses.response.edit.response_edited') })
  }

  public async delete({ response, auth, bouncer, params, i18n }: HttpContextContract) {
    await auth.authenticate()
    const routeResponse = await Response.findOrFail(params.id)
    const route = await Route.findOrFail(routeResponse.routeId)
    const project = await Project.findOrFail(route.projectId)
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)
    if (routeResponse.isFile) await deleteIfOnceUsed('responses', routeResponse.body)
    await routeResponse.delete()
    Ws.io.emit(`route:${route.id}`, 'updated')
    Ws.io.emit(`response:${routeResponse.id}`, 'deleted')
    return response.ok({
      message: i18n.formatMessage('responses.response.delete.response_deleted'),
    })
  }

  // Helper functions

  async #uploadFile(file: MultipartFileContract) {
    await file.moveToDisk('responses')
    return getFileName(file.fileName ?? '')
  }

  async #flushResponseContentType(response: Response) {
    const contentType = await response
      .related('headers')
      .query()
      .where('key', 'content-type')
      .first()
    if (!contentType) return
    await contentType.delete()
  }
}
