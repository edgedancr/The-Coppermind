---
type: schema
status: verified
owner: Harrison Nickles
updated: 2026-11-20
verified_on: 2026-11-20
---
How to write a page in `Wiki/`, a source card, or (for me) a perspective: what to name it, what goes in its properties, how it links, how it cites, whose voice it is in, and how it reads. Any agent drafting or editing a page reads the sections the edit touches.

## Naming

- **The file name is the page title.** Use Title Case and plain words: `Automation Bias.md`, not `automation-bias.md`.
- **Use the singular** for concepts: `Hallucination`, not `Hallucinations`.
- **Spell out acronyms in titles** and put the acronym in `aliases`: `Analysis of Competing Hypotheses` with alias `ACH`.
- **Every file name is unique across the whole vault**, because links resolve by name.
- **Add a disambiguator in parentheses only when two pages would collide**, and make it readable to an outsider: `Leak (Intelligence)`, not `Leak (SI)`.
- **People:** first and last name: `Dalinar Kholin`.
- **Case studies:** the common name of the case, with the year when helpful: `Mata v. Avianca (2023)`.
- **Analyses:** a short descriptive title of the question answered: `Frameworks for Assessing AI Risk`.
- **Source cards:** `SRC - ` plus the source title: `SRC - SAIL Class Notes (Fall 2026)`.
- **Original source files** keep a descriptive name: `SAIL Class Notes (Fall 2026).md`. My own assignments keep the course's submission name (e.g., `Nickles_HW1_Unverified_GenAI_Information`).
- **No dates in wiki page names.** Dates belong in sources, properties, and the log.
- **Records are the exception**, because they are not wiki pages: health check reports (`Health Check 2026-11-17`) and the log's month files (`_log 11-26`).

## Page properties

Every page in `Wiki/`, `Perspectives/`, and `Sources/Source Cards/` starts with YAML properties. The templates in `_templates/` show the exact set for each type.

| Property | Values | Notes |
| --- | --- | --- |
| `type` | concept, glossary, framework, case-study, person, summary, prompt, workflow, guide, analysis, perspective, source | Required |
| `status` | `draft` or `verified` | Required. See [[SCHEMA - Review]] |
| `aliases` | list | Acronyms and other names |
| `courses` | SAIL, Intro to Intelligence, Freedom's Foundations | Which course(s) the content comes from |
| `sources` | list of source-card links | Every source the page draws on |
| `type_of`, `part_of`, `example_of`, `causes`, `counters`, `applies_to`, `supports`, `contradicts`, `developed_by`, `related` | lists of links | Typed links. See [[#Typed links]] |
| `drafted_by` | e.g. `Claude (claude-opus-5-5)` | The agent and model that wrote the draft |
| `drafted_on` | YYYY-MM-DD | |
| `verified_on` | YYYY-MM-DD | Set only when I verify the page |
| `changes_since_verified` | list of one-line notes | Only on a verified page the agent changed at my request. Not in the templates. See [[SCHEMA - Review#Changing a verified page]] |

Rules:
- Dates are always `YYYY-MM-DD`.
- Links in properties are written in quotes: `supports: ["[[Automation Bias]]"]`.

## Typed links

Links should carry meaning. A plain link in the body says "see also"; a typed link in the properties says *how* two ideas relate.

### Relationship types

Read each one as a sentence: "this page ___ the target." The types are listed in the order the agent tries them (see rule 4).

| Property       | Meaning: "This page ___ the target"                      | Example                                                                     |
| -------------- | -------------------------------------------------------- | --------------------------------------------------------------------------- |
| `type_of`      | is a kind of                                             | Large Language Model → type_of → Generative AI                              |
| `part_of`      | is a component or stage of                               | Attention Head → part_of → Self-Attention                                   |
| `example_of`   | is a specific case or instance of                        | Mata v. Avianca (2023) → example_of → Hallucination                         |
| `causes`       | leads to, enables, or makes more likely                  | Deepfake → causes → Liar's Dividend                                         |
| `counters`     | is a safeguard against, or mitigates                     | Analysis of Competing Hypotheses → counters → Confirmation Bias             |
| `applies_to`   | is a method, tool, or rule used on or governing          | Executive Order 12333 → applies_to → United States Intelligence Community   |
| `supports`     | gives evidence or argument for the target's main claim   | Mata v. Avianca (2023) → supports → Capability vs. Reliability              |
| `contradicts`  | argues against, or is in tension with, the target's main claim | Any "Sources disagree" callout that sets this page's claim against another page's |
| `developed_by` | was created, proposed, or argued by (the target is a person page) | Bitter Lesson → developed_by → Richard Sutton                        |
| `related`      | is connected, but none of the above fit                  | The last resort. Its reason must say why the closest type doesn't fit       |

`part_of` is for components and stages; `type_of` is for kinds. A transformer has self-attention as a part; a large language model is a kind of generative AI.

`supports`, `contradicts`, and `related` mirror the Supports / Contradicts / Neither marks in an ACH matrix. Concept pages can support or contradict each other: a page supports another when its content is evidence or argument for that page's main claim, and contradicts it when its content argues against it.

### Linking rules

1. **Store a relationship once, on the page the sentence starts with.** "ACH counters Confirmation Bias" goes on the ACH page. Never also store the reverse, as `related` or as any other type; Obsidian's backlinks show it.
2. **If that page is verified,** the agent proposes the link there as a before/after change ([[SCHEMA - Review]]). It never puts a `related` link on the other page instead.
3. **Typed links say how two ideas relate; plain links in the text say "see also."** A link that only means "see also" or "compare" stays in the page text ("Used in:", "See", "Compare") and does not also go in `related`.
4. **Choose the type in table order.** Try each type from the top, and use `related` only when none fits. Every proposed `related` link names the closest type and says why it doesn't fit.
5. **When a "Sources disagree" callout sets a claim on one page against a claim on another page,** the agent also proposes a `contradicts` link between the two pages.
6. **Glossary terms and the concept pages that use them link to each other in the page text:** a glossary term's "Used in:" line names the concept pages, and a concept page links a glossary term on first use. Add a typed link only when a type fits, and only on one of the two pages (rule 1).
7. **Link to a page that doesn't exist yet only if the agent is proposing to create it** in the same operation. Otherwise use plain text.
8. **Links inside original source files are left alone**, even if they point to notes outside this vault.

## Citations

1. **Every factual claim (or group of claims that originate from the same source) in a wiki page is cited with a footnote, right after the claim**, linking to the original source and a location. The marker goes in the text (`…four flights.[^1]`) and the definition goes at the bottom of the page. The display text in the definition should be readable:
   - Class notes, by date heading: `[^1]: [[SAIL Class Notes (Fall 2026)#10/20/26|SAIL notes, 10/20/26]]`
   - Classical texts, by Stephanus or Bekker number, plus where I took the note: `[^2]: Republic 425, via [[Freedom's Foundations 1 Class Notes (Fall 2026)#9/9/26|FF1 notes, 9/9/26]]`
   - PDFs, by page: `[^3]: [[ODNI Principles of AI Ethics.pdf#page=2|ODNI, p. 2]]`
   - Other sources: a link to the source card plus a page, section, or timestamp.
   - **Keep the class-notes display text in the form `<Course> notes, M/D/YY`** (`SAIL notes, 10/20/26`, `Intro notes, 10/20/26`) so citations read the same everywhere.
   - Web pages used only for a guide about the Coppermind's own tools (not course content) may be cited by URL directly in the footnote, without a source card.
2. **How footnotes are written.**
   - **IDs are numbers** (`[^1]`, `[^2]`, …), in order of first use when a page is drafted. When adding to an existing page, use the next unused number; Obsidian shows them in order anyway, so existing footnotes are never renumbered.
   - **Definitions go in a `## Footnotes` section, the last section of the page**, one per line: `[^1]: <citation>`.
   - **One footnote per source and location.** A second claim from the same place reuses its number. A claim with two sources gets two markers side by side: `[^2][^3]`.
   - **The marker goes after punctuation** (`.`, `,`, `;`, `:`, a closing quote), but before a dash.
   - **Markers can go in callouts and tables; definitions never do.** In a table, write the link in the definition with a plain `|`, not the table's `\|`.
   - **A source that is part of the sentence stays an inline link**, with no footnote: `All from [[Intro to Intelligence Class Notes (Fall 2026)#9/29/26|Intro notes, 9/29/26]] unless noted.` A plain link to another wiki page (`see [[Mirror Imaging]]`) is a link, not a citation, and stays in the text.
3. **Every source a page cites is also listed in its `sources` property.**
4. **No unsourced claims.** If the agent thinks background knowledge is needed that no source in the vault provides, it goes in a callout that I must either source or delete before verifying:
   ```
   > [!warning] Unsourced background — verify or remove
   > ...
   ```
   A verified page never contains one of these callouts.
5. **Direct quotes** use quotation marks or a blockquote and name the speaker; the footnote gives the location.

## Attribution: whose voice is this?

My class notes mix four voices, and the wiki keeps them separate:

| Voice | How to write it |
|---|---|
| **A source or author** (a book, article, quoted person) | Name them: "Heuer developed ACH to counter confirmation bias…" |
| **The instructor / course** | Name the course in the text; the footnote gives the date: `SAIL presented the Three-Ps framework as…[^1]` |
| **A guest lecturer** | Name them, by the title and name my notes give, with the course in the text and the date in the footnote: `In an Intro to Intelligence guest lecture, CDR Blocker argued…[^2]` |
| **Me** | Never in a wiki page as fact. My views go in `Perspectives/`, or in a `## My Take` section that only I write |

Rules:
- **By default, content in my class notes is treated as what was taught in class**, unless it is quoted (then it belongs to the person quoted).
- **Content under a guest-lecture heading belongs to the guest lecturer**, not the course, and is attributed to them by name. Their name is the only personal detail that goes in the wiki: never their contact information, where they live, or other personal information. Guest lecturers don't get People pages unless I ask for one.
- **If a line in my notes sounds like an opinion or a judgment** and it isn't clear whether it was the instructor's or mine, the agent does not guess. It flags it:
  ```
  > [!question] Whose view is this?
  > "<the line from my notes>"[^n]
  ```
  I resolve it before verifying: attribute it, move it to Perspectives, or cut it.
- **The agent never turns a line from my notes into a neutral statement of fact** about the world. "SAIL taught X" is not the same as "X is true."
- **The agent never writes my opinions for me**, even if it can guess them from `Perspectives/My Worldview.md`.

## Source reliability

Each source card rates the source with the Admiralty Code. The agent may propose a rating with a one-sentence reason; I set the final rating.

| Reliability of the source | Credibility of the information |
|---|---|
| A: Completely reliable | 1: Confirmed by other sources |
| B: Usually reliable | 2: Probably true |
| C: Fairly reliable | 3: Possibly true |
| D: Not usually reliable | 4: Doubtful |
| E: Unreliable | 5: Improbable |
| F: Cannot be judged | 6: Cannot be judged |

## Page style

- **Start with two or three sentences of plain prose** that explain the idea to a smart reader who wasn't in the class. **Put them in a `> [!summary]` callout** as the first thing on the page, so the summary stands out. A glossary term's definition goes in the callout too.
- **Then use nested bullets**, the way I take notes, for the details.
- **Use `==highlight==` for the key claim or two** on the page, as I do in my notes. Use **bold** for terms being defined. Don't overuse either.
- **Write for an outsider:** spell out acronyms on first use, and never say "in class" without naming the course and date.
- **Keep the tone neutral and plain**, in the spirit of ICD 203: report what sources say, attribute claims, and don't editorialize.
- **Length:** glossary terms are 1–3 sentences plus links. Concept and framework pages are usually 150–500 words. Split anything longer into linked pages.
- **Don't repeat the title as a heading at the top of the page**; Obsidian already shows it.
