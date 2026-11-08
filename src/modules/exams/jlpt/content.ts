// Node-only private content; never import this loader from a client component.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ExamDefinition } from '../types.ts';
import { jlptMocks } from './catalog.ts';
const cache=new Map<string,ExamDefinition>();
export function jlptDefinition(slug:string):ExamDefinition|undefined {
 if(!jlptMocks.some(mock=>mock.slug===slug))return;
 if(!cache.has(slug))cache.set(slug,JSON.parse(readFileSync(join(process.cwd(),'assets','jlpt',slug+'.json'),'utf8')));
 return cache.get(slug);
}
