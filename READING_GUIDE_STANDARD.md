# Standard for every paper we read

Apply this standard when creating or revising a paper’s learning guide. Existing guides are not automatically compliant; audit them before claiming they are.

## Explain before illustrating

Open with the paper’s question, why the problem matters, what the authors contribute, and what their evidence establishes. Identify whether the contribution is a dataset, model, method, benchmark, or survey. Explain unfamiliar terms in context. A hardware picture or catchy headline alone is not an explanation of the paper.

## Teach each section with its own visual

Use the warm, figure-led reader layout with brief explanations. Each section must answer a different question:

- Overview: What is the paper about, and why does it matter?
- Method: How does the proposed approach work?
- Training and example: What is learned, from which data, with what objective? How does inference differ? Adapt this section to datasets and surveys rather than pretending every paper trains a model.
- Results: What was compared, what changed, and what evidence supports the claim?
- Limitations and takeaway: Where does the evidence stop, and what should the reader retain?

Do not recycle the same image across chapters and merely change its caption. Select a figure because it explains the section. Prefer relevant original paper figures. Use an explicitly labeled original teaching diagram or interaction when the paper has no suitable figure. Do not invent measured results or present a conceptual interaction as an actual model simulation.

## Explain how to read the visual

Explain the important panels, axes, colors, symbols, and sequence. Give the conclusion and its reason, not only a question asking the reader to figure it out. For software screenshots, explain what each screen does and why it matters to the method. Keep optional detail available without making it the default opening view.

Verify every figure against the precise paper version. Link its figure or section, record attribution and reuse terms, and distinguish author figures from library teaching diagrams. Do not claim figures are in a paper until verified.

## Generation and review

Configure your own model and key as described in README.md. Ordinary reading and discovery must not initiate paid generation. Generate only when explicitly requested, preserve request artifacts to avoid repeat charges, and review the draft before integrating it.

Inspect every extracted crop against the exact source PDF. Record source hashes, figure numbers, pages, and attribution. Validate supporting passages and distinguish authors' claims, editorial explanations, and measured evidence. More than 30 extracted figures requires manual curation before generation.

Use `npm run guide:library:integrate -- --slug=<slug> --reviewed` after review. Integration checks source hashes and selected figure references. Local imports remain separate from public redistribution: review each image's license before sharing it.

## Public edition

DROID and FAST include attributed original figures. Other bundled guides link to source PDFs and explicitly explain omitted figures. The public edition excludes unverified redistribution assets; the local figure-import command can restore them for the reader's own installation. Never label a supporting teaching diagram as an author figure.

Preserve reading records and passage anchors. Check image loading, mobile layout, chapter navigation, and saved highlights after changing a guide.
