import swagger from "@apidevtools/swagger-parser";
import { load } from "js-yaml";
import { generate, JsonSchema } from "json-schema-faker";
import { OpenAPI, OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import { Entries } from "../types/entry";

export const convertContractToRoutes = async (contract: string) => {
  const parsed = await parseOpenApiSchema(contract);

  const routes = await Promise.all(
    (
      Object.entries(parsed.paths ?? {}) as Entries<
        OpenAPIV2.PathsObject | OpenAPIV3.PathsObject | OpenAPIV3_1.PathsObject
      >
    ).flatMap(([route, routeMethods]) =>
      ["get", "post", "put", "patch", "delete"]
        .filter(
          (method) =>
            Object.keys(routeMethods?.[method]?.responses ?? {}).length
        )
        .map(async (method) => ({
          path: route,
          method: method.toUpperCase() as
            | "GET"
            | "POST"
            | "PUT"
            | "PATCH"
            | "DELETE",
          name: String(
            routeMethods?.[method].summary ??
              routeMethods?.[method].description ??
              "Generated route from OpenAPI"
          ),
          responses: await Promise.all(
            (
              Object.entries(
                routeMethods?.[method]?.responses ?? {}
              ) as Entries<
                | OpenAPIV3.ResponsesObject
                | OpenAPIV2.ResponsesObject
                | (OpenAPIV3.ResponsesObject & OpenAPIV3_1.ResponsesObject)
              >
            )
              .filter(([code]) => !isNaN(Number(code)))
              .map(async ([code, response]) => ({
                code: Number(code),
                name: parseNameFromResponse(response) ?? `${code} response`,
                example: await parseExampleFromResponse(response),
              }))
          ),
        }))
    )
  );

  return routes;
};

const parseOpenApiSchema = (schema: string) => {
  let api: OpenAPI.Document;

  try {
    api = JSON.parse(schema) as OpenAPI.Document;
  } catch {
    api = load(schema) as OpenAPI.Document;
  }

  return swagger.dereference(api);
};

const parseNameFromResponse = (
  response:
    | OpenAPIV3.ReferenceObject
    | OpenAPIV3.ResponseObject
    | OpenAPIV2.Response
    | ((OpenAPIV3.ReferenceObject | OpenAPIV3.ResponseObject) &
        (OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.ResponseObject))
    | undefined
) => (response && "description" in response ? response.description : undefined);

const parseExampleFromResponse = async (
  response:
    | OpenAPIV3.ReferenceObject
    | OpenAPIV3.ResponseObject
    | OpenAPIV2.Response
    | ((OpenAPIV3.ReferenceObject | OpenAPIV3.ResponseObject) &
        (OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.ResponseObject))
    | undefined
) => {
  if (response && "schema" in response && response.schema) {
    return JSON.stringify(await generate(response.schema as JsonSchema));
  } else if (response && "content" in response && response.content) {
    return JSON.stringify(
      await generate(Object.values(response.content)[0].schema)
    );
  } else {
    return undefined;
  }
};
