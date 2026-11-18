// Node-only private content (keys, listening scripts, writing models); never import this loader from a client component.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ExamDefinition } from '../types.ts';
import { topikMocks } from './catalog.ts';
const cache=new Map<string,ExamDefinition>();
export function topikDefinition(slug:string):ExamDefinition|undefined {
 if(!topikMocks.some(mock=>mock.slug===slug))return;
 if(!cache.has(slug))cache.set(slug,JSON.parse(readFileSync(join(process.cwd(),'assets','topik',slug+'.json'),'utf8')));
 return cache.get(slug);
}
