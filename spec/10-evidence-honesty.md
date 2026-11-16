# 10. Evidence and honesty

*Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.5 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)* · [Index](index.md)

## Labels

### FP-HONEST-01 · Every rule carries an evidence label

Every rule in this specification MUST carry exactly one label: `cited`, with a source whose requirement the rule restates; `convention`; `convention (protocol choice)`; or `contested`. A convention MAY add a basis: a cited source for the fact it rests on. A basis MUST NOT be presented as if the source required the rule. The reason for a rule MUST NOT be "because it is φ".

- **Level:** Guard · **Status:** normative · **Applies when:** the specification · **Test:** machine, `honest.labels` · **Evidence:** convention (protocol choice)


### FP-HONEST-02 · Banned words

A conformance claim or report, and the protocol's own text, MUST NOT describe φ, Fibonacci numbers or a design that uses them as: sacred, divine, perfect, magic, nature's code, a universal law, the most beautiful, or scientifically proven. The names of the musical intervals used for type ratios ("perfect fourth", "perfect fifth") and this list itself are excepted.

- **Level:** Guard · **Status:** normative · **Applies when:** the report · **Test:** machine, `honest.banned-words` · **Evidence:** convention (protocol choice)


### FP-HONEST-03 · Claims that are never made

The following MUST NOT be claimed: that the Parthenon, the Great Pyramid, the Mona Lisa, or any company logo was designed on φ; that φ is the ratio people find most pleasing; that people are "wired" for φ; that Fibonacci numbers are universal in nature.

- **Level:** Guard · **Status:** normative · **Applies when:** always · **Test:** self-report, `honest.banned-claims` · **Evidence:** convention; basis: [cited source](https://webarchive.lib.cuhk.edu.hk/20210329125916mp_/http://www.math.cuhk.edu.hk/~pschan/uged1533/markowsky.pdf)


### FP-HONEST-04 · A claim says what was tested

A conformance claim MUST state the level, mode, unit, platform and version (FP-CONF-04) and nothing about quality or beauty.

- **Level:** Guard · **Status:** normative · **Applies when:** the report · **Test:** machine, `honest.claim-wording` · **Evidence:** convention (protocol choice)


### FP-HONEST-05 · Invent nothing

A design or a document made under the protocol MUST NOT present invented numbers, names or results as real. An unknown in real content is written as a marked placeholder, such as `[name]`. Made-up sample content (sample people, sample figures) is allowed when it is labelled as below. Demonstration content MUST be labelled in visible text, either beside the content or once at the top of the view, with the words "Demonstration content" or "Sample data" or their translation.

- **Level:** Guard · **Status:** normative · **Applies when:** always · **Test:** self-report, `honest.invent-nothing` · **Evidence:** convention (protocol choice)


### FP-HONEST-06 · Null results are stated

Where this specification discusses preference for φ, it MUST state the null and mixed results beside the positive ones.

- **Level:** Guard · **Status:** normative · **Applies when:** the specification · **Test:** self-report, `honest.null-results` · **Evidence:** convention (protocol choice); basis: [cited source](https://pmc.ncbi.nlm.nih.gov/articles/PMC4937063)


## What the evidence shows

**Preference for φ: contested.** Fechner's 1876 study found choices clustered near 1.62 among ten rectangles. Later work questioned the method; a 1997 replication did not find the golden section preferred; studies by McManus and colleagues found only a weak group preference with large, stable differences between individuals. A 2016 review concludes that a universal preference is weak and may vanish under bias-free methods ([review](https://pmc.ncbi.nlm.nih.gov/articles/PMC4937063); [Green 1995](https://journals.sagepub.com/doi/10.1068/p240937); [Höge 1997](https://doi.org/10.2190/2PNH-8TT0-EMC5-FTW5)). This protocol's summary, which is a reading and not a measured result: people tend to prefer moderately elongated rectangles, somewhere around 1.4 to 1.8, over squares and slivers, and nothing isolates φ within that range.

**Famous examples: not supported.** The usual golden rectangle does not fit the Parthenon, whose measured ratio is nearer 1.72 ([Markowsky 1992](https://webarchive.lib.cuhk.edu.hk/20210329125916mp_/http://www.math.cuhk.edu.hk/~pschan/uged1533/markowsky.pdf)). There is no documentary evidence that the Mona Lisa was composed on golden rectangles. Overlays of circles on logos are fitted after the fact.

**Plants: measured, not universal.** The golden angle and Fibonacci spiral counts are well documented in plant growth and have a physical explanation ([Douady and Couder 1992](https://dx.doi.org/10.1103/PhysRevLett.68.2098)). In a study of 657 sunflowers, 74% of counts were Fibonacci and about 18% were not ([Swinton and Ochu 2016](https://pmc.ncbi.nlm.nih.gov/articles/PMC4892450)).

**A system may choose φ.** Le Corbusier's Modulor deliberately combined φ, the Fibonacci series and human height. Choosing φ on purpose is legitimate. It is not evidence that φ is best.

**What this protocol claims for itself.** One set of numbers used everywhere makes a system easier to keep consistent and easier for an agent to follow. That is the whole claim.

## Sources

- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Apple Human Interface Guidelines, typography and accessibility: https://developer.apple.com/design/human-interface-guidelines/typography , https://developer.apple.com/design/human-interface-guidelines/accessibility
- Material metrics and keylines: https://m1.material.io/layout/metrics-keylines.html ; Android target size: https://support.google.com/accessibility/android/answer/7101858
- Animation duration guidance: https://www.nngroup.com/articles/animation-duration/
- Modular scales: https://alistapart.com/article/more-meaningful-typography/
- Nice numbers for graph labels: https://www.ri.cmu.edu/publications/nice-numbers-for-graph-labels
- Truncating the y-axis: https://ar5iv.arxiv.org/html/1907.02035
- Perceptually uniform colour maps: https://bids.github.io/colormap/ ; OKLab: https://bottosson.github.io/posts/oklab/
- Design Tokens Format Module 2025.10: https://www.designtokens.org/tr/2025.10/

---

Lyrikai: Fibonacci Protocol for UI/UX Design Agents · version 1.0.0-rc.5 · MIT License · [www.lyrikai.com](https://www.lyrikai.com)
