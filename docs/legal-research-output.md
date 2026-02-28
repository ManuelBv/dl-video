# Legal Research: Video Download Utility (dl-video)

> Research conducted: February 2026
> Jurisdictions covered: United States, United Kingdom, European Union
> Application profile: Client-side, GitHub Pages-hosted, no DRM bypass, open source

---

## Executive Summary

`dl-video` is a fully client-side web application that identifies publicly accessible video assets on third-party web pages and allows users to save those assets locally. It performs no DRM circumvention and operates no backend server. Research across 13 targeted queries covering US, UK, and EU law reveals a complex and materially risky legal landscape.

The principal legal exposures are:

1. **Copyright infringement liability** — both for the developer (as a tool provider) and for end-users (as direct infringers) — when the tool is used to download content that is protected by copyright and not licensed for local copying.
2. **Platform Terms of Service violations** — nearly every major streaming platform (YouTube, Vimeo, Twitch, etc.) prohibits downloading via ToS; such violations may constitute breach of contract actionable independently of copyright claims.
3. **Developer / contributory infringement liability** — under the *Sony* "substantial non-infringing use" doctrine, the tool may be protected if it has meaningful lawful uses, but this protection is not absolute and depends on the facts of use and any promotional framing.
4. **DMCA §1201 / EU Art. 6 / CDPA s.296ZA anti-circumvention exposure** — low risk for dl-video specifically because it does not bypass DRM, but the distinction must be maintained rigorously in the codebase and documentation.
5. **Enforcement trajectory** — industry bodies (RIAA, BPI, IFPI, MPAA) have actively and successfully sued or obtained ISP-blocking orders against stream-ripping tools across all three jurisdictions. The Hamburg Appeal Court (November 2024) confirmed liability against a hosting provider of youtube-dl, making the legal risk concrete and recent.

The tool sits in a legally contested space. It can be operated in a significantly lower-risk posture with careful feature constraints, clear user-facing disclosures, and proactive compliance measures — all detailed below.

---

## Applicable Jurisdictions

| Jurisdiction | Primary Laws | Enforcement Bodies |
|---|---|---|
| United States | Copyright Act (17 U.S.C.), DMCA (17 U.S.C. §§ 512, 1201), CFAA (18 U.S.C. § 1030) | DOJ, RIAA, MPAA, individual rights holders |
| United Kingdom | Copyright, Designs and Patents Act 1988 (CDPA), Online Safety Act 2023, UK GDPR | IPO, DCMS, BPI, Ofcom, High Court |
| European Union | InfoSoc Directive 2001/29/EC, DSA (Regulation (EU) 2022/2065), DSM Directive 2019/790, GDPR (Regulation (EU) 2016/679) | European Commission, national courts, collective rights organisations |

GitHub Pages is US-hosted infrastructure (Microsoft/GitHub), so US law applies directly to hosting. EU and UK law applies to the extent the tool targets or is used by residents in those territories.

---

## Findings by Legal Area

### Copyright & Intellectual Property

#### United States

US copyright law (17 U.S.C. § 106) grants rights holders exclusive rights to reproduce, distribute, and display their works. Reproducing a copyrighted video without authorisation infringes these rights. "Personal use" is **not** a blanket statutory exception in US law; it may be analysed under the four-factor fair use doctrine (17 U.S.C. § 107), but courts have generally not found that private copying of entertainment content from streaming services constitutes fair use.

The *Sony Corp. of America v. Universal City Studios* (1984) "Betamax doctrine" protects manufacturers of devices capable of "substantial non-infringing use." This doctrine is the primary defence available to a developer of dl-video. However, the Grokster line of cases (MGM v. Grokster, 2005) narrows this protection where a tool is actively marketed or designed to facilitate infringement. If the application's documentation, examples, or marketing emphasise use against copyrighted streaming content, this defence collapses.

**Direct user liability**: End-users who download copyrighted videos they do not own or have no licence to copy face civil copyright infringement exposure: statutory damages of $750–$30,000 per work infringed (up to $150,000 for wilful infringement) under 17 U.S.C. § 504.

**RIAA enforcement (2023–2025)**: The RIAA won a case against FLVTO.biz and 2conv.com potentially yielding $83 million in damages. In 2024, the RIAA amended its lawsuit against AI music generator Suno to include stream-ripping allegations, signalling continued active enforcement. In November 2024, a US federal judge recommended millions in damages against Russian stream-ripping services in landmark RIAA litigation.

#### United Kingdom

The CDPA 1988 provides the primary copyright framework. The **private copying exception** (s.28B CDPA) — introduced in 2014 — was **quashed by the High Court in July 2015** following a judicial review (British Academy of Songwriters, Composers and Authors v. Secretary of State for Business). The court ruled that the government had insufficient evidence to justify omitting fair compensation for rights holders. As a result, **no private copying exception currently exists in UK law**. Copying any copyrighted work for personal use remains infringement.

The **BPI landmark 2021 ruling**: Mr Justice Miles at the High Court (under s.97A CDPA) ordered major ISPs (BT, EE, PlusNet, Sky, TalkTalk, Virgin Media) to block stream-ripping sites including Flvto and 2Conv. This established that stream-ripping constitutes copyright infringement actionable against both operators and their infrastructure providers in the UK.

#### European Union

Article 5(2)(b) of the InfoSoc Directive permits Member States to introduce a private copying exception "for private use and for ends that are neither directly nor indirectly commercial," conditioned on fair compensation to rights holders. Most EU Member States (Germany, France, Spain, Netherlands) have implemented such exceptions. However, the CJEU has consistently held that:

- The private copying exception **only applies to reproductions from lawful sources** (ACI Adam BV and Others v. Stichting de Thuiskopie, C-435/12, 2014).
- Where the source is an authorised streaming platform but the user does not have a licence for local copying (e.g., a YouTube video not licensed for download), the source may be deemed "unlawful" for the purpose of the exception.
- The Dutch Supreme Court has referred questions to the CJEU specifically about whether "offline streaming copies" fall within Article 5(2)(b) — this question was pending as of the date of this research.

**Germany enforcement (2023–2024)**: In April 2023, the Hamburg Regional Court issued an injunction against the individual hosting youtube-dl, requiring cessation of hosting. In November 2024, the Hamburg Appeal Court dismissed the appeal, confirming the injunction and requiring the defendant to pay damages. This decision is final.

---

### Platform Terms of Service & Contract Law

Virtually every major video platform prohibits automated downloading or scraping in its Terms of Service. Relevant prohibitions appear in:

- YouTube Terms of Service, §§ 5.B, 5.C: users may not download, reproduce, or otherwise exploit any content without prior written consent from YouTube.
- Vimeo Terms of Service: prohibits downloading or reproducing content without authorisation.
- Twitch Terms of Service: prohibits automated access or recording.

**Enforceability**: In the US, website ToS constitute binding contracts when users have notice and assent (browse-wrap or click-wrap). Breach of ToS can give rise to breach of contract claims independently of copyright claims. A 2024 federal court ruling (relating to X/Twitter scraping) held that the Copyright Act may **preempt** some ToS-based claims, creating a circuit split. However, this preemption argument is not universally available and ToS breach remains a live litigation risk.

**CFAA and ToS**: Under the CFAA (18 U.S.C. § 1030), accessing a computer "without authorisation" can constitute a federal crime. The Ninth Circuit's 2022 ruling in *hiQ Labs v. LinkedIn* held that scraping **publicly accessible** data does not violate the CFAA solely because it is prohibited by ToS. However, the case settled in December 2022 with hiQ paying $500,000 in damages under its own contractual obligations. The CFAA risk is **low** for dl-video in the context of fetching publicly accessible pages, but is not zero.

**UK**: Breach of ToS may be actionable in contract. No UK equivalent to the CFAA exists, but the Computer Misuse Act 1990 prohibits unauthorised access to computer material. Accessing a public web page is unlikely to constitute unauthorised access, but circumventing technical access controls would engage this Act.

**EU**: EU contract law similarly recognises ToS breaches. The DSA does not specifically address ToS enforcement but operates alongside existing contract law.

---

### Anti-Circumvention (DMCA §1201 / EU Art. 6 / CDPA s.296ZA)

#### United States — DMCA §1201

Section 1201 of the DMCA prohibits: (a) circumventing technological protection measures (TPMs) controlling access to copyrighted works; and (b) trafficking in tools primarily designed to circumvent TPMs.

**The youtube-dl precedent**: In October 2020, the RIAA filed a §1201 DMCA takedown against youtube-dl on GitHub, claiming it circumvented YouTube's "rolling cipher." GitHub initially complied, but reinstated the project in November 2020 after the EFF intervened with a counter-notice arguing that: (i) the video streams themselves were **not DRM-encrypted**; (ii) the tool's behaviour was indistinguishable from that of a normal browser; and (iii) rolling cipher obfuscation of URLs is not a "technological protection measure" under §1201 because it does not control access to the copyrighted content itself — it controls the URL generation mechanism.

**Implication for dl-video**: Because dl-video targets **plain/public video URLs** (e.g., `<video src>` tags, HLS/DASH manifests that are already resolved in page source) and **does not bypass DRM**, the §1201 anti-circumvention risk is **low**. The tool does not circumvent CSS, Widevine, PlayReady, FairPlay, or any analogous TPM. GitHub confirmed post-youtube-dl that §1201 claims about software are scrutinised individually and require a plausible showing of circumvention.

**Risk caveat**: If dl-video were ever extended to decode or bypass any token-gated, signed, or DRM-protected URL (even one that is technically "accessible"), §1201 exposure would immediately arise.

The US Copyright Office conducted a triennial §1201 rulemaking in 2024 and issued updated exemptions; these primarily address preservation, accessibility, and security research — not general downloading tools.

#### European Union — InfoSoc Art. 6

Article 6 of the InfoSoc Directive prohibits circumvention of effective technological protection measures. EU Member States have implemented this in national law. The analysis parallels §1201: a tool that fetches already-public, non-DRM-protected video URLs does not circumvent a TPM within the meaning of Article 6, because no TPM is involved.

#### United Kingdom — CDPA s.296ZA

Section 296ZA CDPA implements the TPM anti-circumvention provisions. The analysis is the same as above: no exposure for dl-video in its current form, provided it never bypasses DRM.

---

### Developer Liability & Safe Harbour

#### Contributory and Vicarious Infringement (US)

Under US secondary liability doctrine:

- **Contributory infringement**: A party who, with knowledge of infringing activity, induces, causes, or materially contributes to the infringing conduct of another is liable. Knowledge is a required element. The *Sony* Betamax doctrine holds that distributing a tool capable of substantial non-infringing uses does not constitute contributory infringement absent evidence of intent to facilitate infringement.
- **Vicarious infringement**: Requires a direct financial benefit from infringement and the ability to control it. A free, open-source tool without monetisation is unlikely to meet this test.
- **Inducement**: *MGM v. Grokster* added an "inducement" theory: a party who distributes a device with the object of promoting its use to infringe, as shown by clear expression or other affirmative steps to foster infringement, is liable regardless of the device's non-infringing capabilities.

**Risk for dl-video**: If the tool's README, documentation, examples, or promotional material reference specific copyrighted streaming platforms (YouTube, Netflix, Spotify) as use cases, this constitutes affirmative evidence of inducement under *Grokster*. The tool must be positioned neutrally with respect to content ownership.

#### DMCA §512 Safe Harbour (US)

Section 512 provides safe harbour for service providers from copyright liability arising from user-generated actions, provided the provider: (a) has no actual knowledge of specific infringing activity; (b) does not financially benefit directly from the infringement; (c) expeditiously removes infringing material upon notification. GitHub, as the hosting platform, benefits from §512 safe harbour for hosting the dl-video repository. The developer of dl-video is **not a "service provider"** within §512 in relation to third-party platforms — §512 does not shield a developer whose tool is used to infringe on third-party platforms.

#### EU DSA Intermediary Liability

The Digital Services Act (Regulation (EU) 2022/2065), fully applicable since 17 February 2024, restates and updates the eCommerce Directive's intermediary liability framework. A provider of "mere conduit," "caching," or "hosting" services is shielded from liability provided it acts expeditiously on notices of illegal content. GitHub as a hosting provider benefits from these provisions. The developer of dl-video is not an "intermediary" under the DSA in relation to end-user infringement on third-party platforms.

#### UK — CDPA Secondary Liability

Under ss.16–27 CDPA, secondary liability attaches to those who authorise infringement or deal in infringing copies with knowledge. A developer who publicly distributes a tool knowing it will be used to infringe, and who takes no steps to prevent this, risks secondary liability under UK law.

**Hamburg 2024 decision**: The Hamburg Appeal Court's November 2024 ruling against the individual hosting youtube-dl held the hosting provider (not the software author) liable under German copyright law. This is notable because it shows that even **hosting providers** — not just tool authors — can face liability. The decision is jurisdiction-specific (Germany) but signals EU judicial willingness to hold infrastructure providers accountable.

---

### Privacy & Data Protection

#### GDPR (EU) / UK GDPR

dl-video is described as fully client-side with no backend server. Key GDPR/UK GDPR implications:

- **No server-side data collection**: Because dl-video has no backend, it does not collect, store, or process personal data on a server. This significantly reduces GDPR exposure.
- **URL input as personal data**: A URL entered by a user could, in theory, constitute personal data if it is linked to an identifiable person (e.g., a URL containing a user ID). However, because processing occurs client-side and is not transmitted to any controller's server, the GDPR's data controller obligations are not triggered for the developer.
- **GitHub Pages analytics**: If GitHub Pages serves any analytics or telemetry to the developer, those may constitute processing of personal data (IP addresses, user agents) subject to GDPR. The developer should review GitHub Pages' data processing terms.
- **Cookie consent**: If dl-video uses any cookies or local storage for anything beyond pure functional operation, a cookie consent mechanism is required under the EU ePrivacy Directive (Cookie Directive) and its UK equivalent.
- **Privacy policy**: Even a minimal tool should have a privacy policy disclosing what data (if any) is processed, particularly if EU or UK users are targeted.

#### CCPA (California, US)

The California Consumer Privacy Act applies to for-profit businesses meeting certain thresholds. An open-source tool hosted on GitHub Pages, with no revenue, is unlikely to meet the CCPA's applicability thresholds.

---

### Jurisdictional Enforcement History

| Year | Jurisdiction | Action | Outcome |
|---|---|---|---|
| 2020 | US | RIAA DMCA takedown of youtube-dl on GitHub | Taken down; reinstated after EFF counter-notice |
| 2021 | UK | BPI High Court action (s.97A CDPA) against stream-ripping sites | ISP blocking orders against Flvto, 2Conv, Flv2mp3, H2Converter, MP3 Studio |
| 2022 | EU/US | hiQ v. LinkedIn (Ninth Circuit) | CFAA does not bar scraping public data; parties settled for $500k |
| 2023 | Germany | IFPI/BVMI vs. youtube-dl hosting provider | Hamburg Regional Court injunction; hosting provider ordered to cease |
| 2024 | Germany | Appeal of Hamburg 2023 decision | Hamburg Appeal Court dismissed appeal; injunction and damages confirmed (final) |
| 2024 | US | RIAA v. FLVTO / 2conv | Potential $83 million in damages recommended |
| 2024 | US | RIAA v. Suno (amended complaint) | Stream-ripping allegations added to AI copyright lawsuit |
| 2024 | EU | Europol Operation Timing | Dismantled hundreds of illegal sports streaming providers |
| 2025 (ongoing) | EU | Industry lobbying for real-time piracy blocking legislation | EU Commission considering mandatory ISP blocking frameworks |

---

## Legal Red Lines

The following features would materially increase legal risk and **must not** be implemented:

1. **DRM bypass of any kind**: Any feature that decodes Widevine, FairPlay, PlayReady, CSS, or any other technological protection measure would trigger DMCA §1201 / EU Art. 6 / CDPA s.296ZA anti-circumvention liability and would remove the tool's primary defence. This includes: decrypting HLS/DASH segments protected by AES-128 where the key is not served publicly, extracting tokens from DRM handshake flows, or bypassing geo-restriction systems.

2. **Named references to specific copyrighted platforms in promotional materials**: Naming YouTube, Netflix, Disney+, Spotify, etc. as supported or target platforms in README, documentation, demo videos, or website copy constitutes *Grokster* inducement evidence and eliminates the *Sony* Betamax defence.

3. **Automated/batch downloading features**: Features that automate download of multiple videos without per-video user action increase the "scale of infringement" argument and make the tool look more like a mass-infringement facilitator.

4. **Monetisation of the tool**: Any advertising, paywalls, or affiliate links tied to the tool create vicarious liability exposure by establishing a "financial benefit" from infringement.

5. **Server-side proxying or caching of video content**: Introducing any server-side component that fetches, relays, or caches third-party video content would: (a) create direct infringement liability for the operator; (b) remove the "no backend" characterisation; (c) engage DSA and DMCA §512 obligations as a hosting service.

6. **Bypassing authentication or access controls**: Fetching videos from pages that require login (even if credentials are provided by the user) engages Computer Misuse Act 1990 (UK) and CFAA (US) risks, and may constitute circumvention of access controls under §1201.

7. **Creating or distributing pre-resolved download links**: Generating or publishing permanent direct-download links to third-party video content would constitute distribution of infringing copies.

---

## Recommended Legal Safeguards

### Technical Safeguards

1. **Implement a DRM detection layer**: Before presenting any download option, check whether the video asset is protected by a DRM system (e.g., presence of `encrypted-media` EME API usage, Widevine/FairPlay key system requests). If DRM is detected, **display no download option and show a disclosure** explaining that the content is DRM-protected and cannot be downloaded.

2. **Restrict to publicly accessible video elements only**: Target only `<video src>`, `<source src>`, and publicly served (non-authenticated) HLS/DASH manifests. Do not follow authentication flows or cookies to unlock content.

3. **No automated download queues**: Require affirmative per-video user action for each download. This reinforces the tool's positioning as a user-driven utility, not an automated scraper.

4. **Enforce a content source disclaimer at point of download**: Before each download begins, display an interstitial requiring the user to confirm they have the right to download the content (e.g., "I confirm I own or am licensed to copy this video").

### Legal / Policy Safeguards

5. **Publish a clear Terms of Use** for dl-video itself, stating:
   - The tool is intended for use with content the user owns, has licensed, or is otherwise legally entitled to copy.
   - The tool must not be used to download copyrighted content without authorisation.
   - The developer does not endorse or facilitate copyright infringement.
   - The tool does not bypass DRM and will not do so.

6. **Publish a Privacy Policy** disclosing: what data (if any) is processed; that no user data is sent to any server operated by the developer; and GitHub Pages' data handling.

7. **Include explicit DMCA contact information** (a designated DMCA agent) in case rights holders send takedown notices. Respond promptly to any such notices.

8. **Neutral positioning in documentation**: Do not list any commercial streaming platform by name as a supported source. Do not include example URLs pointing to copyrighted content. Focus examples on the user's own content (e.g., self-hosted video, public domain content, Creative Commons licensed material).

9. **Maintain open-source transparency**: Keeping the codebase public and auditable supports the argument that the tool has no hidden circumvention functionality and is a good-faith utility. Do not obfuscate or minify the deployed code.

10. **Monitor and respond to DMCA notices**: Register a DMCA agent with the US Copyright Office (even for a small project). This confers §512(c) safe harbour benefits and signals good faith.

11. **Consult a qualified IP attorney** before any major feature addition that involves fetching, parsing, or downloading content from authenticated platforms or that interacts with any streaming protocol beyond basic HTTP video files.

---

## Compliance Checklist

- [ ] DRM detection implemented; download blocked for DRM-protected content
- [ ] No named references to commercial streaming platforms in documentation or UI
- [ ] Per-download user confirmation / rights acknowledgement interstitial implemented
- [ ] Terms of Use published at the tool's URL
- [ ] Privacy Policy published and accurate
- [ ] DMCA designated agent registered with the US Copyright Office
- [ ] DMCA contact address published on the site
- [ ] No server-side component introduced without legal review
- [ ] No monetisation (ads, affiliate links, paywalls) without legal review
- [ ] README and documentation reviewed to remove any inducement language
- [ ] GitHub Pages analytics / telemetry reviewed for GDPR compliance
- [ ] Cookie consent mechanism in place if any cookies/local storage used
- [ ] Tool tested: confirms it does not follow authentication flows

---

## Risk Register

| Risk | Jurisdiction | Regulation | Likelihood | Impact | Mitigation |
|---|---|---|---|---|---|
| Developer sued for contributory infringement by rights holder | US | Copyright Act §§ 106, 501; *Grokster* | Medium | High (statutory damages $750–$150k per work) | *Sony* Betamax defence; neutral documentation; DRM detection; ToU |
| DMCA §512 takedown of GitHub repository | US | DMCA §512 | Medium | Medium (repository removal; reinstatement possible) | Proactive DMCA agent; counter-notice readiness; EFF/GitHub developer fund |
| DMCA §1201 claim for anti-circumvention | US | DMCA §1201 | Low (no DRM bypass in current design) | Very High | Maintain strict no-DRM-bypass policy; document this clearly |
| ISP blocking order obtained by BPI/RIAA | UK | CDPA s.97A | Low–Medium (requires commercial scale) | High (UK inaccessibility) | Avoid becoming a high-traffic destination; comply with notices |
| Injunction against hosting provider (Hamburg model) | EU (Germany) | German UrhG / InfoSoc Directive | Low–Medium | Medium–High (removal from hosting) | Neutral positioning; DRM detection; ToU; comply with injunctions |
| Breach of platform ToS — YouTube/Vimeo civil claim | US/UK/EU | Contract law | Medium | Medium (injunction, damages) | ToU on dl-video disclaiming platform ToS compliance responsibility |
| CFAA claim for accessing authenticated content | US | CFAA 18 U.S.C. § 1030 | Low (if restricted to public pages) | High (criminal exposure possible) | Restrict to publicly accessible pages only; no auth bypass |
| GDPR enforcement for analytics/tracking data | EU / UK | GDPR / UK GDPR | Low (no backend) | Medium (fines up to €20M or 4% revenue) | Review GitHub Pages telemetry; publish Privacy Policy |
| Computer Misuse Act (UK) for unauthorised access | UK | CMA 1990 | Low (if restricted to public pages) | High (criminal) | Restrict to public pages only |
| EU DSA compliance obligations if scale increases | EU | DSA Regulation 2022/2065 | Low (currently small-scale) | Medium | Monitor user scale; DSA obligations increase at "very large platform" thresholds |

---

## References

### Primary Legal Sources

- [17 U.S.C. § 1201 — DMCA Anti-Circumvention](https://www.law.cornell.edu/uscode/text/17/1201)
- [U.S. Copyright Office — Section 1201 Study](https://www.copyright.gov/policy/1201/)
- [DMCA Takedown Policy — GitHub Docs](https://docs.github.com/en/site-policy/content-removal-policies/dmca-takedown-policy)
- [Copyright and Information Society Directive 2001/29/EC — Wikipedia](https://en.wikipedia.org/wiki/Copyright_and_Information_Society_Directive_2001)
- [EU Digital Services Act — European Commission](https://commission.europa.eu/strategy-and-policy/priorities-2019-2024/europe-fit-digital-age/digital-services-act_en)
- [UK Exceptions to Copyright — GOV.UK](https://www.gov.uk/guidance/exceptions-to-copyright)
- [Online Safety Act 2023 — legislation.gov.uk](https://www.legislation.gov.uk/ukpga/2023/50)

### Key Cases

- *Sony Corp. of America v. Universal City Studios*, 464 U.S. 417 (1984) — Betamax doctrine
- *MGM Studios, Inc. v. Grokster, Ltd.*, 545 U.S. 913 (2005) — Inducement theory
- *hiQ Labs, Inc. v. LinkedIn Corp.*, 9th Cir. (April 2022) — CFAA and public web scraping
- *ACI Adam BV and Others v. Stichting de Thuiskopie*, C-435/12 (CJEU 2014) — Private copying from lawful sources only
- Hamburg Regional Court injunction against youtube-dl hosting provider (April 2023)
- Hamburg Appeal Court — confirmed injunction, dismissed appeal (November 2024)
- BPI High Court stream-ripping ISP blocking order, Mr Justice Miles (February 2021)

### Industry / Enforcement Sources

- [EFF: GitHub Reinstates youtube-dl After RIAA's Abuse of DMCA](https://www.eff.org/deeplinks/2020/11/github-reinstates-youtube-dl-after-riaas-abuse-dmca)
- [GitHub Blog: Standing Up for Developers — youtube-dl Is Back](https://github.blog/news-insights/policy-news-and-insights/standing-up-for-developers-youtube-dl-is-back/)
- [RIAA: US Judge Recommends Millions in Damages Against Russian Stream-Ripping Services](https://www.riaa.com/u-s-judge-recommends-millions-in-damages-against-russian-stream-ripping-services-in-landmark-riaa-litigation/)
- [RIAA: World's Largest Music Stream Ripping Site Shuts Down](https://www.riaa.com/worlds-largest-music-stream-ripping-site-shuts-successful-international-legal-action-record-industry/)
- [IFPI: Hamburg Appeal Court Upholds Injunction Against youtube-dl Hosting Provider](https://www.ifpi.org/comment-from-ifpi-on-the-hamburg-appeal-courts-decision-to-uphold-its-order-against-hosting-provider-of-youtube-dl/)
- [BPI: Record Industry Wins Double Landmark UK Court Victory](https://www.bpi.co.uk/news-analysis/record-industry-wins-double-landmark-uk-court-victory-in-new-cyberlocker-and-stream-ripping-piracy-cases)
- [Fieldfisher: First UK Injunctions Against Cyberlocker and Stream-Ripping Sites](https://www.fieldfisher.com/en/services/intellectual-property/intellectual-property-blog/first-injunctions-ever-granted-in-the-uk-to-block)
- [IFPI: Record Companies in Germany Take Successful Action Against youtube-dl Hosting Provider](https://www.ifpi.org/record-companies-in-germany-take-successful-action-against-hosting-provider-of-stream-ripping-software-youtube-dl/)
- [TorrentFreak: High Court Orders UK ISPs to Block Stream-Ripping Sites](https://torrentfreat.com/high-court-orders-uk-isps-to-block-stream-ripping-cyberlocker-sites-210225/)
- [Osborne Clarke: The Impact of Stream Ripping](https://www.osborneclarke.com/insights/the-impact-of-stream-ripping)
- [Kluwer Copyright Blog: UK Private Copying Exception Ruled Illegal](https://legalblogs.wolterskluwer.com/copyright-blog/uk-private-copying-exception-ruled-illegal/)
- [Lexology: CJEU Confirms Private Copying Exception Only Applies to Reproductions from Lawful Sources](https://www.lexology.com/library/detail.aspx?g=c4c427e9-bf67-4b2e-b761-c254582ffb26)
- [Jenner & Block: hiQ v. LinkedIn — Ninth Circuit Reaffirms Narrow CFAA Interpretation](https://www.jenner.com/en/news-insights/publications/client-alert-data-scraping-in-hiq-v-linkedin-the-ninth-circuit-reaffirms-narrow-interpretation-of-cfaa)
- [ZwillGen: hiQ v. LinkedIn Wrapped Up — Web Scraping Lessons Learned](https://www.zwillgen.com/alternative-data/hiq-v-linkedin-wrapped-up-web-scraping-lessons-learned/)
- [Osborne Clarke: DSA Now Fully Applicable — 17 February 2024](https://www.osborneclarke.com/insights/17-february-2024-digital-services-act-dsa-now-fully-applicable)

---

## Disclaimer

This document is a legal research summary produced for informational and compliance planning purposes. It is **not legal advice** and does not constitute the rendering of legal services. The information contained herein reflects the state of publicly available law, case decisions, and enforcement activity as of February 2026. Laws change, court decisions evolve, and enforcement priorities shift.

**This document must not be relied upon as a substitute for advice from a qualified intellectual property attorney** admitted to practice in the relevant jurisdiction(s). Before launching, modifying, or marketing dl-video, the developer should seek independent legal counsel, particularly in the US, UK, and at least one EU Member State.

The author of this research document accepts no liability for any legal consequences arising from actions taken in reliance on this document.
