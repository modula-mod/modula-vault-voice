#!/usr/bin/env node
import {execFileSync} from 'node:child_process'
import {existsSync} from 'node:fs'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const candidates = [process.env.MODULA_PRODUCT_STANDARD_ROOT, resolve(root, '../modula-product-standard'), resolve(root, '../../modula-product-standard')].filter(Boolean)
const standardRoot = candidates.find(candidate => existsSync(join(candidate, 'packages/product-frontend/package.json')))
if (!standardRoot) throw new Error('Modula Product Standard checkout not found. Set MODULA_PRODUCT_STANDARD_ROOT.')
execFileSync('pnpm', ['--dir', standardRoot, 'mps-frontend', 'build', root], {stdio: 'inherit'})
