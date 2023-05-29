import { TransactionClientContract } from '@ioc:Adonis/Lucid/Database'
import Route from 'App/Models/Route'

export async function recalculateRouteOrder(sortedRoutes: Route[], trx: TransactionClientContract) {
  const lastRouteOrder = sortedRoutes.reduce(
    (acc, value) => (value.order > acc ? value.order : acc),
    1
  )
  await Promise.all(
    sortedRoutes.map(async (r, index) => {
      r.order = index + lastRouteOrder + 1
      await r.useTransaction(trx).save()
    })
  )
  await Promise.all(
    sortedRoutes.map(async (r, index) => {
      r.order = index + 1
      await r.useTransaction(trx).save()
    })
  )
}
