'use server'

import { handleServerFunctions } from '@payloadcms/next/layouts'
import configPromise from '@payload-config'
import { importMap } from './importMap'

export const payloadServerFunction = async (args: Parameters<typeof handleServerFunctions>[0]) =>
  handleServerFunctions({
    ...args,
    config: configPromise,
    importMap,
  })
