import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginRedoc } from '@kubb/plugin-redoc'
import { pluginZod } from '@kubb/plugin-zod'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig(() => {
  return {
    root: '.',
    input: {
      path: './openapi.json',
    },
    output: {
      path: './redoc',
      clean: true,
    },
    plugins: [
      pluginOas({
        output: {
          path: './redoc/swagger.json',
        },
      }),
      pluginRedoc({
        output: {
          path: './redoc/redoc.html',
        },
      }),
      pluginZod({
        output: {
          path: './redoc/zod',
        },
      }),
      pluginTs({
        output: {
          path: './redoc/types',
        },
      }),
    ],
  }
}) 