import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Route from 'App/Models/Route'
import CreateResponseValidator from 'App/Validators/Response/CreateResponseValidator'
import Database from '@ioc:Adonis/Lucid/Database'
import Response from 'App/Models/Response'
import EditResponseValidator from 'App/Validators/Response/EditResponseValidator'
import Ws from 'App/Services/Ws'
import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser'
import { deleteIfOnceUsed, getFileName } from 'App/Helpers/file.helper'
import { prettifyJson } from 'App/Helpers/string.helper'

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
    await route.load('project')
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 10)
    await bouncer.with('ProjectPolicy').authorize('isMember', route.project, i18n)
    const responses = await route
      .related('responses')
      .query()
      .orderBy('enabled', 'desc')
      .orderBy('created_at', 'desc')
      .paginate(page, perPage)
    return response.ok(responses)
  }

  public async get({ response, auth, bouncer, params, i18n }: HttpContextContract) {
    await auth.authenticate()
    const routeResponse = await Response.findOrFail(params.id)
    await routeResponse.load('route')
    const route = routeResponse.route
    await route.load('project')
    const project = route.project
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)
    return response.ok(routeResponse)
  }

  public async edit({ request, response, auth, bouncer, params, i18n }: HttpContextContract) {
    await auth.authenticate()
    const isFile = Boolean(await request.input('isFile', false))
    const data = await request.validate(EditResponseValidator)
    const routeResponse = await Response.findOrFail(params.id)
    await routeResponse.load('route')
    const route = routeResponse.route
    await route.load('project')
    const project = route.project
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
      const changedToFileTypeWithoutBody = !routeResponse.isFile && isFile && !data.body
      const changedToJsonType = !isFile && routeResponse.isFile
      const hasNewFileToUpload = isFile && data.body
      if (changedToFileTypeWithoutBody) {
        return response
          .status(400)
          .send({ errors: [i18n.formatMessage('responses.response.edit.missing_file_body')] })
      } else if (hasNewFileToUpload) {
        const file = data.body as MultipartFileContract
        await file.moveToDisk('responses')
        data.body = getFileName(file.fileName ?? '')
        if (routeResponse.isFile) await deleteIfOnceUsed('responses', routeResponse.body)
      } else if (changedToJsonType) {
        await deleteIfOnceUsed('responses', routeResponse.body)
      }
      const newBodyValue =
        data.body === undefined
          ? routeResponse.body
          : isFile
          ? (data.body as string)
          : prettifyJson(data.body as string)
      await routeResponse
        .merge({
          ...data,
          isFile,
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
    await routeResponse.load('route')
    const route = routeResponse.route
    await route.load('project')
    const project = route.project
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)
    if (routeResponse.isFile) await deleteIfOnceUsed('responses', routeResponse.body)
    await routeResponse.delete()
    Ws.io.emit(`route:${route.id}`, 'updated')
    Ws.io.emit(`response:${routeResponse.id}`, 'deleted')
    return response.ok({
      message: i18n.formatMessage('responses.response.delete.response_deleted'),
    })
  }
}
