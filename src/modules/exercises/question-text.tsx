// Store passage and question together so saved-attempt snapshots retain both.
export function QuestionText({ prompt, children }: { prompt: string; children?: React.ReactNode }) {
  const [passage, question] = prompt.split("\n\n[QUESTION]\n\n");
  return <>{question ? <details className="reading-passage" open><summary>Унших эх · Reading passage</summary><div lang="en">{passage.split("\n\n").map((p, index) => <p key={index}>{p}</p>)}</div></details> : null}{children ?? <h3>{question ?? passage}</h3>}</>;
}

export function questionOnly(prompt: string) { return prompt.split("\n\n[QUESTION]\n\n").at(-1)!; }
