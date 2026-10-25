// Old attempt snapshots retain the original archive URLs. Resolve only the exact
// reviewed pages to byte-identical bundled copies without rewriting those snapshots.
export function paperImageUrl(sourceUrl:string){
 const page=/^https?:\/\/help\.eec\.mn\/modelItems\/2020\/mat\/([A-D])\/([1-8])\.jpg$/.exec(sourceUrl);
 return page?`/exam-assets/eec-math-2020/${page[1]}/${page[2]}.jpg`:sourceUrl;
}
