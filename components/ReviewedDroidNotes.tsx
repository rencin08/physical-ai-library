import guide from "@/lib/learning/reviewed/droid.json";

export const reviewedDroidGuide = guide;

export function DroidFigurePanels({chapter, asset}: {chapter: number; asset: string}) {
  const view = guide.chapters[chapter].views.find(item => item.asset === asset);
  if (!view?.panels.length) return null;
  return <div className="figure-panel-notes"><span className="eyebrow">Read the panels</span><dl>{view.panels.map(panel => <div key={panel.label}><dt>{panel.label}</dt><dd>{panel.explanation}</dd></div>)}</dl></div>;
}

export function DroidChapterExplanation({chapter}: {chapter:number}) {
  const content = guide.chapters[chapter];
  return <details className="reviewed-chapter-explanation">
    <summary>Understand the {chapter === 0 ? "paper" : chapter === 1 ? "collection method" : chapter === 2 ? "training and inference" : chapter === 3 ? "evidence" : "limits"}</summary>
    <div className="reviewed-explanation-body">
      {content.explanation.map((item,index)=><p key={index}>{item.text} <a href={`${guide.provenance.sourceUrl}#${item.sourceAnchor}`} target="_blank" rel="noreferrer" aria-label={`Source for paragraph ${index+1}`}>↗</a></p>)}
      <div className="reviewed-comprehension"><h3>Check your understanding</h3><p>{content.question}</p><details><summary>Show explanation</summary><p>{content.answer}</p></details></div>
      {chapter===4 && <details className="paper-source-uncertainties"><summary>Ambiguities in this paper version</summary><ul>{guide.uncertainties.map(note=><li key={note}>{note}</li>)}</ul></details>}
    </div>
  </details>;
}
