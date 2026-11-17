// Node-only private content (keys, scripts and model answers); never import this loader from a client component.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ExamDefinition } from '../types.ts';
import { isToeflSlug } from './catalog.ts';
const cache=new Map<string,ExamDefinition>();
export function toeflDefinition(slug:string):ExamDefinition|undefined {
 if(!isToeflSlug(slug))return;
 if(!cache.has(slug))cache.set(slug,JSON.parse(readFileSync(join(process.cwd(),'assets','toefl',slug+'.json'),'utf8')));
 return cache.get(slug);
}
