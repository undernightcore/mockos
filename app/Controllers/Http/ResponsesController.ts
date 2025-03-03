import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import { deleteIfOnceUsed, getFileName } from 'App/Helpers/Shared/file.helper'
import { compressJson } from 'App/Helpers/Shared/string.helper'
import Processor from 'App/Models/Processor'
import Project from 'App/Models/Project'
import Response from 'App/Models/Response'
import Route from 'App/Models/Route'
import Ws from 'App/Services/Ws'
import CreateProcessorValidator from 'App/Validators/Processor/CreateProcessorValidator'
import CreateResponseValidator from 'App/Validators/Response/CreateResponseValidator'
import DuplicateResponseValidator from 'App/Validators/Response/DuplicateResponseValidator'
import EditResponseValidator from 'App/Validators/Response/EditResponseValidator'

export default class ResponsesController {
  public async create({ request, response, auth, bouncer, params, i18n }: HttpContextContract) {
    await auth.authenticate()
    const isFile = Boolean(await request.input('isFile', false))
    const data = await request.validate(CreateResponseValidator)
    const route = await Route.findOrFail(params.id)
    await route.load('project')
    await bouncer.with('RoutePolicy').authorize('isNotFolder', route, i18n)
    await bouncer.with('ProjectPolicy').authorize('isMember', route.project, i18n)
    await Database.transaction(async (trx) => {
      route.useTransaction(trx)
      if (data.enabled) await route.related('responses').query().update('enabled', false)
      if (isFile) {
        const file = data.body as MultipartFileContract
        await file.moveToDisk('responses')
        data.body = getFileName(file.fileName ?? '')
      } else {
        data.body = compressJson(data.body as string)
      }
      await route.related('responses').create({ ...data, isFile, body: data.body as string })
    })
    Ws.io.emit(`route:${route.id}`, 'updated')
    return response.created({
      message: i18n.formatMessage('responses.response.create.response_created'),
    })
  }

  public async getList({ response, auth, bouncer, params, i18n }: HttpContextContract) {
    await auth.authenticate()
    const route = await Route.findOrFail(params.id)
    const project = await Project.findOrFail(route.projectId)
    await bouncer.with('RoutePolicy').authorize('isNotFolder', route, i18n)
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)
    const responses = await route
      .related('responses')
      .query()
      .select(['id', 'name', 'enabled', 'status'])
      .preload('processor')
      .orderBy('enabled', 'desc')
      .orderBy('created_at', 'desc')
    return response.ok(responses)
  }

  public async get({ response, auth, bouncer, params, i18n }: HttpContextContract) {
    await auth.authenticate()
    const routeResponse = await Response.findOrFail(params.id)
    const route = await Route.findOrFail(routeResponse.routeId)
    const project = await Project.findOrFail(route.projectId)
    await bouncer.with('RoutePolicy').authorize('isNotFolder', route, i18n)
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
    await bouncer.with('RoutePolicy').authorize('isNotFolder', route, i18n)
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
          : compressJson(data.body as string)
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

  public async enable({ response, auth, bouncer, params, i18n }: HttpContextContract) {
    await auth.authenticate()
    const routeResponse = await Response.findOrFail(params.id)
    const route = await Route.findOrFail(routeResponse.routeId)
    const project = await Project.findOrFail(route.projectId)
    await bouncer.with('RoutePolicy').authorize('isNotFolder', route, i18n)
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)
    await Database.transaction(async (trx) => {
      await route
        .related('responses')
        .query()
        .useTransaction(trx)
        .whereNot('id', routeResponse.id)
        .update('enabled', false)
      await routeResponse
        .useTransaction(trx)
        .merge({ ...routeResponse, enabled: true })
        .save()
    })
    Ws.io.emit(`route:${route.id}`, 'updated')
    return response.ok({
      message: i18n.formatMessage('responses.response.enable.response_enabled'),
    })
  }

  public async duplicate({ response, request, auth, bouncer, params, i18n }: HttpContextContract) {
    await auth.authenticate()
    const routeResponse = await Response.findOrFail(params.id)
    const route = await Route.findOrFail(routeResponse.routeId)
    const project = await Project.findOrFail(route.projectId)
    const processor = await routeResponse.related('processor').query().first()
    await bouncer.with('RoutePolicy').authorize('isNotFolder', route, i18n)
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)
    const headers = await routeResponse.related('headers').query()
    params['routeId'] = route.id // Send context to validator
    const data = await request.validate(DuplicateResponseValidator)
    const newResponse = await Response.create({
      name: data.name,
      body: routeResponse.body,
      isFile: routeResponse.isFile,
      routeId: routeResponse.routeId,
      status: routeResponse.status,
      enabled: false,
    })
    if (processor) {
      await Processor.create({
        responseId: newResponse.id,
        code: processor.code,
        enabled: processor.enabled,
      })
    }
    const newHeaders = headers.map(({ key, value }) => ({ key, value }))
    await newResponse.related('headers').createMany(newHeaders)
    Ws.io.emit(`route:${route.id}`, 'updated')
    return response.created({
      message: i18n.formatMessage('responses.response.duplicate.response_duplicated'),
    })
  }

  public async delete({ response, auth, bouncer, params, i18n }: HttpContextContract) {
    await auth.authenticate()

    const routeResponse = await Response.findOrFail(params.id)
    const route = await Route.findOrFail(routeResponse.routeId)
    const project = await Project.findOrFail(route.projectId)
    await bouncer.with('RoutePolicy').authorize('isNotFolder', route, i18n)
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)

    if (routeResponse.isFile) await deleteIfOnceUsed('responses', routeResponse.body)
    await routeResponse.delete()

    Ws.io.emit(`route:${route.id}`, 'updated')
    Ws.io.emit(`response:${routeResponse.id}`, 'deleted')

    return response.ok({
      message: i18n.formatMessage('responses.response.delete.response_deleted'),
    })
  }

  public async deleteMultiple({ request, response, auth, bouncer, i18n }: HttpContextContract) {
    await auth.authenticate()
    console.log('ENTRAAAA')

    const responseIds = request.input('ids', []) || []

    if (!Array.isArray(responseIds) || responseIds.length === 0) {
      return response.badRequest({
        message: i18n.formatMessage('responses.response.delete.no_ids_provided'),
      })
    }

    const responses = await Response.query().whereIn('id', responseIds)

    if (responses.length === 0) {
      return response.notFound({
        message: i18n.formatMessage('responses.response.delete.responses_not_found'),
      })
    }

    for (const routeResponse of responses) {
      const route = await Route.findOrFail(routeResponse.routeId)
      const project = await Project.findOrFail(route.projectId)

      await bouncer.with('RoutePolicy').authorize('isNotFolder', route, i18n)
      await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)

      if (routeResponse.isFile) {
        await deleteIfOnceUsed('responses', routeResponse.body)
      }
      await routeResponse.delete()

      Ws.io.emit(`route:${route.id}`, 'updated')
      Ws.io.emit(`response:${routeResponse.id}`, 'deleted')
    }

    return response.ok({
      message: i18n.formatMessage('responses.response.delete.responses_deleted'),
    })
  }

  public async getProcessor({ auth, params, bouncer, i18n, response }: HttpContextContract) {
    await auth.authenticate()
    const routeResponse = await Response.findOrFail(params.id)
    const route = await Route.findOrFail(routeResponse.routeId)
    const project = await Project.findOrFail(route.projectId)
    await bouncer.with('RoutePolicy').authorize('isNotFolder', route, i18n)
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)

    const [processor] = await routeResponse.related('processor').query()
    return response.ok(processor)
  }

  public async editProcessor({
    auth,
    params,
    bouncer,
    i18n,
    response,
    request,
  }: HttpContextContract) {
    await auth.authenticate()

    const data = await request.validate(CreateProcessorValidator)

    const routeResponse = await Response.findOrFail(params.id)
    const route = await Route.findOrFail(routeResponse.routeId)
    const project = await Project.findOrFail(route.projectId)

    await bouncer.with('RoutePolicy').authorize('isNotFolder', route, i18n)
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)

    const processor = await Processor.updateOrCreate(
      { responseId: routeResponse.id },
      { ...data, responseId: routeResponse.id }
    )

    Ws.io.emit(`route:${route.id}`, 'updated')

    return response.ok(processor)
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
