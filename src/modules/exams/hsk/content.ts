// Node-only private content (keys and listening texts); never import this loader from a client component.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ExamDefinition } from '../types.ts';
import { hskMocks } from './catalog.ts';
const cache=new Map<string,ExamDefinition>();
export function hskDefinition(slug:string):ExamDefinition|undefined {
 if(!hskMocks.some(mock=>mock.slug===slug))return;
 if(!cache.has(slug))cache.set(slug,JSON.parse(readFileSync(join(process.cwd(),'assets','hsk',slug+'.json'),'utf8')));
 return cache.get(slug);
}
