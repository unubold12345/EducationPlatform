import data from './catalog.json' with { type: 'json' };
export const jlptMocks = data as {slug:string;level:'N5'|'N4';number:number;title:string;theme:string;questions:number;minutes:number}[];
export const jlptSlugs = () => jlptMocks.map(mock=>mock.slug);
