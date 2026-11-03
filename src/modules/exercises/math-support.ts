// Public capability metadata only: this module must never import authored answer banks.
export function supportsMathTutor(examId:string) {
  return /^(sat-(algebra|advanced|data|geometry)|entrance-(math|physics))(?:-|$)/.test(examId);
}
