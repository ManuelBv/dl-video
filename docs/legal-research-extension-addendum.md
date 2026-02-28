# Legal Research Addendum: Architecture Change — GitHub Pages Website → Chrome Extension (MV3)

> This document supplements the primary legal research at `docs/legal-research-output.md`.
> It covers legal implications specific to the Chrome Extension (Manifest V3) architecture.
> Research conducted: February 2026.
> Jurisdictions covered: United States, United Kingdom, European Union.

---

## Summary of Architecture Change

The original research analysed dl-video as a **static GitHub Pages web application** — a website visited in a browser tab, operating entirely client-side, with no installation step, no persistent presence in the browser, and no elevated browser permissions. The tool read DOM elements (e.g., `<video src>` attributes) visible in the page context where it was hosted or referenced.

The product has been re-architected as a **Chrome Manifest V3 (MV3) Browser Extension** distributed privately as a zip file on GitHub. Users install it in developer/unpacked mode. The extension operates as a side panel within Chrome, uses the `webRequest` and/or `declarativeNetRequest` APIs to observe all network requests made by the active tab, injects content scripts into any website via `<all_urls>` host permissions, and reassembles intercepted HLS/DASH segment URLs into a complete `.mp4` file in browser memory. There is no backend server, no DRM bypass, and (except possibly a one-time acknowledgement) no persistent data storage.

This architectural shift introduces a set of legal considerations that are materially different from the website model and that were not addressed in the original research document.

---

## Key Legal Differences: Extension vs. Website

| Dimension | Website (Original) | Chrome Extension (New) |
|---|---|---|
| Distribution model | Served from GitHub Pages; user visits a URL | Distributed as a zip; user installs software into their browser |
| Installation footprint | None — session-scoped | Persistent resident in the browser; survives reboots |
| Browser permissions | Standard web origin permissions | Elevated: `<all_urls>`, `webRequest`, `declarativeNetRequest`, `sidePanel` |
| Network visibility | Can only observe its own page's network activity | Observes ALL network requests from ANY active tab |
| Code execution scope | Executes in a sandboxed page context | Injects content scripts into third-party websites |
| Intermediary / gatekeeper | None — GitHub Pages hosted | Google's Chrome extension ecosystem (even if distribution bypasses the Web Store) |
| Developer-user relationship | Stateless; user visits once | Developer ships a persistent software artefact users install and trust |
| Applicable safe harbours | DMCA §512 (hosting via GitHub) | Primarily software distribution liability doctrines; §512 applies differently |
| Privacy exposure | GitHub Pages telemetry only | Active observer of all tab traffic; elevated data access obligations |
| Applicable law | Web service law | Software distribution law + web service law + browser-specific obligations |

---

## New Legal Considerations

### 1. Software Distribution vs. Web Service Delivery

**Does distributing as a software package vs. serving a website change the Betamax/Grokster analysis?**

The original research identified the *Sony Corp. of America v. Universal City Studios* (1984) Betamax doctrine and the *MGM Studios v. Grokster* (2005) inducement theory as the primary US copyright liability framework for developers. Both of those cases involved the distribution of **software and hardware products**, not web services. The move to a Chrome extension therefore does not fundamentally shift the applicable legal framework — the Betamax/Grokster analysis was already the correct one.

However, the extension architecture makes several aspects of that analysis more salient:

**Persistent installation shifts the knowledge calculus.** Under contributory infringement doctrine, a party who has knowledge of specific infringing activity and materially contributes to it faces liability. A website that is visited and then forgotten involves transient knowledge. A browser extension that is installed, persists indefinitely in the user's browser, and continues to operate on every subsequent visit to a streaming platform could be argued to put the developer in a position of ongoing, constructive knowledge of repeated infringing use. The developer cannot claim ignorance of what a long-installed tool is routinely being used for.

**Software distribution invokes the VHS/Betamax product liability precedent more directly.** The extension is software delivered as a product (a zip file), analogous to the VHS recorder at issue in *Sony*. Courts have historically applied the substantial non-infringing use doctrine generously to hardware/software products distributed to consumers. This favours the developer. The extension's capability to download legitimately owned content, developer-created content, public domain video, and Creative Commons material constitutes substantial non-infringing use, provided these uses are genuine and not marginal.

**The Grokster inducement risk is unchanged, not elevated.** *Grokster* liability requires "clear expression or other affirmative steps taken to foster infringement." The form of distribution (extension vs. website) is irrelevant to this element. What matters is the content of the README, documentation, and UI. The same cautions from the original research apply without change.

**UK and EU software distribution law.** Under UK CDPA ss.16–27, secondary liability for authorising infringement applies equally to software distributed as a product. In Germany, the Hamburg Appeal Court's November 2024 confirmation of the youtube-dl injunction concerned software (the youtube-dl repository), not a website — so the precedent already accounts for the software distribution model and is directly applicable.

**Assessment:** The Betamax/Grokster secondary liability risk is **structurally similar** between the two architectures, but the persistent installation footprint marginally **increases the developer's exposure to a "knowledge" argument** under contributory infringement doctrine.

---

### 2. Network Request Interception — Wiretapping / ECPA Risk

**Does intercepting all tab network requests create Electronic Communications Privacy Act or equivalent UK/EU liability?**

This is the most significant **new** legal risk introduced by the extension architecture with no direct parallel in the original website model.

#### United States — Federal Wiretap Act (18 U.S.C. § 2511) and ECPA

The Electronic Communications Privacy Act of 1986 (ECPA), incorporating the Wiretap Act (Title I), prohibits any person from intentionally intercepting or attempting to intercept any wire, oral, or electronic communication. Violations carry criminal penalties of up to five years imprisonment and civil damages.

The Chrome extension's use of the `webRequest` API to observe all network requests from the active tab raises a threshold question: does monitoring HTTP/HTTPS requests made by a tab constitute "interception" of "electronic communications" under the Wiretap Act?

**The party exception (key protection).** The Wiretap Act contains a "party exception" (18 U.S.C. § 2511(2)(d)): interception is not unlawful where one of the parties to the communication consents. A browser extension operates as part of the user's browser environment. The user installed the extension and granted its permissions. This is analogous to the user being a party to, or authoriser of, the monitoring. The Ninth Circuit applied this reasoning directly in the October 2025 decision *Karwowski v. Gen Digital, Inc.* (No. 24-7213), affirming dismissal of CIPA and ECPA claims against the Avast Online Security & Privacy browser extension, which intercepted users' browsing data including their search engine queries. The Court held that because Gen Digital was necessarily a party to the communications its extension monitored (given the extension's architecture required it to receive that data), the party exception defeated the wiretapping claim. The Court also found plaintiffs failed to allege that Gen Digital was not a party to the communications.

**Critically, dl-video does NOT transmit intercepted data to any server.** The Avast case involved a third party (Gen Digital) receiving the intercepted data server-side. The Ninth Circuit noted the extension could not function without Gen Digital receiving browsing data. For dl-video, there is no backend — intercepted network request data is processed entirely within the user's browser and discarded after use. This makes dl-video's position **considerably stronger** than Avast's on this point: the user's own browser is the only "party" observing the data, and no third-party server receives it.

**The crime-tort exception (residual risk).** Courts have expanded ECPA liability through the crime-tort exception (18 U.S.C. § 2511(2)(d)(ii)): consent is ineffective if the communication is intercepted for the purpose of committing any criminal or tortious act. If a court found that intercepting network requests for the purpose of facilitating copyright infringement constituted an underlying tortious act, the crime-tort exception could in principle override the party/consent exception. This argument is not settled but represents a non-zero residual risk, particularly if the developer is shown to have intended the tool for infringing uses (*Grokster* inducement).

**California — CIPA (California Invasion of Privacy Act, Penal Code § 630 et seq.)**

CIPA imposes one-party consent requirements stricter in some respects than federal law and has generated an enormous wave of class action litigation in 2024–2025. However, CIPA applies to interceptions of communications between parties — courts have increasingly limited CIPA's scope to interceptions by genuine third parties, not to a browser extension operated by the user themselves. The *Karwowski* decision (9th Circuit, 2025) is directly on point: CIPA claims against a browser extension that intercepted user–search engine communications were dismissed because the extension operator was found to be a party to those communications, not a third-party eavesdropper.

For dl-video, the no-server design removes the developer entirely from the interception loop. The user's browser intercepts its own traffic. This is the strongest possible position under CIPA and the Wiretap Act.

#### United Kingdom — Regulation of Investigatory Powers Act 2000 (RIPA) / Investigatory Powers Act 2016 (IPA)

RIPA Part I and the IPA 2016 regulate interception of communications in the UK. These statutes primarily govern law enforcement and intelligence agencies — they do not create civil or criminal liability for individuals operating their own browser tools on their own devices, with their own consent. A user who installs dl-video and uses it to observe their own tab's network traffic is not intercepting a communication in the sense these statutes contemplate (they require unauthorised interception without consent of the parties). No UK authority has applied RIPA or IPA to browser extensions operating on user devices with user consent.

#### European Union — ePrivacy Directive (2002/58/EC)

Article 5 of the ePrivacy Directive prohibits interception of electronic communications without consent of the users concerned. The extension operates with explicit user consent (installation and permission grant). Absent any backend data collection or transmission to the developer, there is no plausible ePrivacy claim — the user is consenting to their own browser observing its own traffic.

**Assessment:** The wiretapping / ECPA / RIPA risk is **low for dl-video specifically** because (a) the user installs and consents; (b) no data is transmitted to the developer's servers; and (c) recent US case law (Ninth Circuit 2025) confirms the party/consent exception protects browser extension developers in this scenario. The residual risk — the crime-tort exception if infringing intent is established — is a **secondary** concern but not the primary threat. This risk is **new** compared to the website model and should be monitored.

---

### 3. Broad Host Permissions (`<all_urls>`) — Privacy and GDPR

**Does requiring access to all URLs create data protection obligations even with no storage?**

#### The "Processing" Question

Under GDPR (EU) Article 4(2), "processing" includes any operation performed upon personal data, including collection, recording, organisation, storage, adaptation, retrieval, consultation, use, disclosure, erasure, or destruction. Article 4(1) defines personal data broadly as any information relating to an identified or identifiable natural person.

Network requests made by an active browser tab may contain personal data: URL paths containing user identifiers, session tokens, authentication headers (though dl-video explicitly does not follow authentication flows), or content revealing the user's identity or interests.

The critical question is whether a Chrome extension that observes network request URLs momentarily in RAM — solely for the purpose of detecting HLS/DASH manifest patterns — and then discards them without storage or transmission, constitutes "processing" of personal data by the developer.

**Arguments that GDPR does not apply:**

1. **No controller.** GDPR Article 4(7) defines a "controller" as a natural or legal person who determines the purposes and means of processing personal data. If the processing occurs entirely within the user's own device and the developer never receives, accesses, or controls that data, there is no controller-processor relationship between developer and user data. The user is effectively the controller of their own browser's RAM. This is analogous to the legal conclusion reached in the original research for the website model (no backend = no controller).

2. **Household exemption.** GDPR Article 2(2)(c) exempts processing "by a natural person in the course of a purely personal or household activity." A user using a browser extension to download videos for personal use falls squarely within this exemption for their own data.

3. **Transient in-memory operation.** Recital 15 of the GDPR notes that protection applies to processing that results in a filing system. Purely transient processing with no structured storage is at the periphery of GDPR's scope, though it is not formally excluded.

**Arguments that GDPR could apply:**

1. **Extension developer as "joint controller."** If the developer distributes software that systematically processes personal data (even ephemerally) as part of its designed function, some data protection authorities have taken the view that the developer who "determines the means" of the processing (by writing the code) could be characterised as a controller. This is contested and there is no confirmed enforcement precedent for this specific scenario, but it reflects a maximalist reading of the Regulation.

2. **`<all_urls>` as a signal of broad data access.** Google's own Chrome Web Store policies (which apply even conceptually to the extension model) require that extensions "only request the permissions necessary to implement their features." An `<all_urls>` permission is the broadest possible host permission. ICO guidance on UK GDPR mirrors the data minimisation principle: collect and process only what is necessary for the stated purpose. Even if the extension does not store data, the architectural choice of `<all_urls>` (vs. a narrower URL pattern matching only video-hosting domains) may attract regulatory scrutiny as disproportionate.

**UK GDPR / ICO**

The Information Commissioner's Office (ICO) applies UK GDPR principles to software developers whose products process personal data of UK residents. The ICO's guidance on "what privacy information should we provide" requires that when personal data is collected, users must be informed of the purposes, legal basis, and retention period. If dl-video processes any personal data (even network request URLs) in the course of its operation, a privacy notice is required. The ICO has fined organisations up to £500,000 for non-compliance with privacy notice requirements.

**Assessment:** The GDPR/UK GDPR risk is **low if no data leaves the device**, but the extension's `<all_urls>` permission creates a **higher regulatory scrutiny profile** than the original website model. The developer should: (a) publish a clear privacy notice explaining that no data is collected, transmitted, or stored; (b) consider whether `<all_urls>` can be narrowed to specific URL patterns; and (c) document the legal basis (legitimate interests / user consent) for any transient network request observation, however brief.

---

### 4. Content Script Injection — Legal Implications

**Does injecting scripts into third-party pages create legal exposure beyond scraping?**

The extension injects content scripts into any active tab via `<all_urls>`. This means JavaScript code written by the developer executes in the context of third-party websites — including YouTube, Vimeo, Netflix, and any other site the user visits while the extension is active.

#### Computer Fraud and Abuse Act (CFAA) — US

The original research correctly noted that *hiQ Labs v. LinkedIn* (9th Circuit, 2022) established that accessing publicly accessible data does not violate the CFAA solely on the grounds that the platform's Terms of Service prohibit it. However, that case concerned HTTP GET requests — fetching publicly served data from outside the platform.

Content script injection is meaningfully different: the extension executes code within the platform's own web application. This is more analogous to modifying the platform's web application than to passively fetching data. Some legal commentators have argued that injecting code into a web application whose ToS prohibits modification could constitute "exceeding authorised access" under CFAA § 1030(a)(2). This argument has not been definitively tested in the context of browser extensions that users deliberately install, but it represents a risk that does not exist in the website model.

The developer's strongest counter-argument is that the user installed the extension, and the extension modifies only the user's own browser environment — the third-party web application itself is never altered, only its rendering in the user's browser. This is broadly analogous to the user customising their own browser through legitimate means (e.g., user stylesheets, ad blockers). Courts have not held that ad blockers or accessibility extensions violate the CFAA.

#### UK Computer Misuse Act 1990 (CMA)

Section 1 CMA prohibits "unauthorised access to computer material." The analysis parallels the CFAA discussion: injecting a content script into a page loaded in the user's own browser, with the user's own consent and at the user's direction, does not constitute "unauthorised access" to the third-party's computer material. The "computer" in question is the user's own machine; the third-party's server is not touched. No UK authority has applied CMA s.1 to browser extension content scripts.

#### EU — Computer Crime Directive (2013/40/EU)

Article 3 of the Computer Crime Directive prohibits illegal access to information systems without authorisation. The same analysis applies: the user's browser is not the third-party's information system.

#### Website Terms of Service and Tortious Interference

Content script injection that alters the presentation or behaviour of a third-party website (e.g., adding a download button overlay) could be characterised as interference with that website's content or business. While there is no specific US tort of "browser manipulation," several platforms have sought to invoke their ToS to prohibit extension-based modifications. YouTube's ToS §§ 5.B and 5.C prohibit "access" to YouTube content "by means other than through the YouTube playback functionality as authorised by YouTube" — a content script that intercepts network requests and presents a download UI within YouTube's interface could be argued to fall within this prohibition. However, ToS-based claims against extension developers (as opposed to the users themselves) require establishing that the developer is bound by the ToS, which is contested.

**Assessment:** Content script injection introduces **moderate new legal exposure** primarily from a ToS and CFAA "exceeds authorised access" standpoint that does not arise with the website model. The risk is mitigated by the fact that the user consents to the extension and no third-party server is accessed. This risk is **higher than in the website model** where no code was injected into third-party pages.

---

### 5. Chrome Web Store Policies (Even for Private Distribution)

**Do Google's developer policies or Chrome's own security model create obligations or risks for a privately distributed unpacked extension?**

#### Not Submitting to the Web Store: The Tradeoff

The extension is distributed privately as a zip file on GitHub, installed in developer (unpacked) mode. This means:

- **Google exercises no review** of the extension before installation. Users are warned by Chrome that the extension is "unpackaged" and not subject to Web Store review.
- **Chrome Web Store policies formally apply only to extensions distributed through the Web Store.** Google's Developer Program Policies, which prohibit extensions that "encourage, facilitate, or enable the unauthorized access, download, or streaming of copyrighted content," are not directly enforceable against a non-Store extension.
- **Google has incrementally tightened its ability to disable non-Store extensions.** In MV3, Google's "Enhanced Safe Browsing" can flag extensions. Chrome's "side-loading" restrictions introduced in 2023–2024 mean that Windows users who have not enabled developer mode cannot install unpacked extensions at all, and Chrome may warn users about or disable externally installed extensions. These are technical rather than legal constraints, but they affect distribution risk.

#### The Indirect Policy Relevance

Even though Google's policies do not directly bind a non-Store extension, they are **evidentially relevant** in litigation. If a rights holder brings a contributory infringement claim and seeks to establish that the developer knew the extension would be used for infringing purposes, the fact that the extension could not be listed on the Chrome Web Store precisely because it violates policies prohibiting copyright-infringing download tools could be introduced as evidence of the developer's constructive knowledge. A plaintiff could argue: "The developer knew they could not distribute this through legitimate channels because it facilitates infringement, so they chose private distribution to evade accountability."

This argument is not yet case-tested but represents a litigation risk unique to extensions that avoid the Web Store to escape content review.

#### Developer Mode / Unpacked Warnings

Chrome's own security model presents unpacked extensions to users with a developer mode warning. While this serves a protective function for users, it also functions as a paper trail: users affirmatively enable developer mode to install the extension. If a user later claims they were deceived about the extension's capabilities, the developer mode requirement undercuts that claim (the user took deliberate technical steps to install it).

**Assessment:** Private distribution avoids direct Chrome Web Store policy enforcement, but the same policies are **indirectly relevant as evidence of knowledge in secondary liability claims**. This is a **new risk** not present in the website model. The developer should not document or communicate privately that the extension was kept off the Web Store because of its video download capabilities.

---

### 6. HLS/DASH In-Browser Reassembly

**Does assembling video segments inside the extension memory create reproduction rights issues distinct from a simple download?**

#### The Technical Process

HLS and DASH streaming protocols divide video content into small segments (typically 2–10 seconds each), each fetched as a separate HTTP request. The extension intercepts the URLs of these segment requests, fetches them (or observes their fetching by the page's own video player), and concatenates the binary data into a single `.mp4` file in browser memory before presenting it to the user for download.

#### Does Reassembly Create a New Copyright Issue?

The original research addressed download of a single video file. The reassembly process involves:

1. Multiple ephemeral copies of segments in RAM during interception.
2. A concatenation step that creates a new unified file not delivered by the server in that form.
3. A final copy written to the user's local disk on download.

**US analysis.** Under 17 U.S.C. § 106(1), the exclusive right to "reproduce the copyrighted work in copies" is triggered. The RAM copies created during segment reassembly are relevant: *MAI Systems Corp. v. Peak Computer, Inc.* (9th Cir. 1993) established that loading copyrighted software into RAM constitutes "copying" for § 106 purposes. However, the *AHRA (Audio Home Recording Act)* and subsequent fair use litigation have created a doctrine that transient buffer copies made in the course of normal playback are not actionable reproductions. The extension's RAM copies exist only long enough to be assembled and are not stored independently — this is analogous to the playback buffer.

The act of assembling the final `.mp4` is more significant. It creates a persistent, complete copy of the copyrighted work in a format not served by the rights holder. This is not meaningfully different from the original research's conclusion about downloading a single `.mp4`: the copy is made without authorisation and the same analysis (fair use, Betamax, Grokster) applies.

There is no established precedent that the multi-segment reassembly process creates a qualitatively different or more severe copyright exposure compared to a direct file download. Both result in an unauthorised copy of a complete work on the user's device. The mechanism is more complex but the legal conclusion is the same.

**EU analysis.** Recital 33 of the InfoSoc Directive provides that transient copies forming part of a technological process are covered by the temporary copies exception (Art. 5(1)). The segment copies in RAM during the streaming/reassembly process could qualify. The final assembled `.mp4` copy does not, as it is not transient. The same conclusion as for a direct download applies.

**One arguable distinction.** If the extension is fetching the HLS/DASH segments independently (i.e., making its own HTTP requests for segments, separate from the page's video player), this could be characterised as the extension making direct copies — not merely passively observing a playback buffer. If the extension only observes the URLs of segments already being fetched by the page player (using `webRequest` in observe-only mode) and then re-downloads those segments itself, each segment download is an independent act of copying. This marginally strengthens the "direct copying" characterisation but does not change the ultimate conclusion: the analysis under Betamax/Grokster and the InfoSoc Directive is unchanged.

**Assessment:** HLS/DASH reassembly does not create **qualitatively new reproduction rights exposure** beyond what applies to a direct file download. The multi-copy process during reassembly is covered by transient copy defences. However, the developer should ensure the extension does not independently re-fetch segments that the page player has already fetched, as this would represent separate acts of copying, not merely a "save what the browser already downloaded" operation.

---

### 7. Developer Liability — Unpacked Distribution via GitHub

**How does distributing as a zip on GitHub differ legally from hosting a live website?**

#### DMCA §512 Safe Harbour — Changed Applicability

The original research noted that GitHub (as the hosting platform) benefits from §512 safe harbour for hosting the dl-video repository. The developer, as the author of the tool, is not a §512 service provider and does not personally benefit from §512. This is unchanged.

However, the **distribution model** changes the DMCA §512 analysis in one important respect. The website model meant that users accessed dl-video as a live service — the GitHub Pages server was the point of delivery. Rights holders seeking to take down the tool would file a §512 notice against GitHub Pages, and GitHub (as a service provider) would be the target. Reinstatement via counter-notice (as youtube-dl achieved in 2020) is a well-established mechanism in this context.

For a zip-file distributed extension, there are two distinct targets for a DMCA notice:
1. The **GitHub repository** hosting the source code and zip releases (§512 applies to GitHub; same mechanism as before).
2. The **installed extension** on users' machines, which is no longer the developer's responsibility to remove — the developer cannot "take down" software already installed on user devices.

This creates a scenario where a successful §512 takedown of the GitHub repository removes the distribution point but does not deactivate the extension on existing users' devices. Rights holders who are aware of this may pursue the developer personally (not via §512) or seek injunctive relief requiring the developer to push an update disabling the software.

#### Injunctive Relief Against the Developer Personally

The Hamburg Appeal Court (November 2024) confirmed an injunction against the **individual hosting** youtube-dl on GitHub, requiring cessation of hosting. This precedent suggests that where a developer distributes software through GitHub, they are personally liable under applicable national law for the consequences of that distribution, regardless of §512 safe harbour protections (which are a US-law defence unavailable in German courts).

An injunction in Germany (or another EU member state) requiring the developer to cease distribution would apply to the GitHub repository. It would not directly "undo" existing user installations, but the developer could face contempt proceedings if they failed to push an update disabling the extension.

#### No Web Store Mediation Layer

When a tool is distributed via the Chrome Web Store, Google acts as an intermediary: rights holders can file takedown complaints with Google, who removes the extension from the Store, which prevents new installations. This mediation layer actually **benefits** the developer in some respects: it provides a structured process, and a §512-equivalent "notice and takedown" mechanism at the distribution point.

For privately distributed unpacked extensions, there is no such mediation layer. Rights holders who want the distribution stopped must go directly to the developer (via GitHub DMCA notice) or the courts. The developer's only fallback is GitHub's own DMCA takedown process (with counter-notice rights, as youtube-dl demonstrated).

**Assessment:** The distribution model shifts the enforcement dynamics: it removes Google as a gatekeeper and structured intermediary, placing more direct pressure on the GitHub repository as the sole distribution point. This is **modestly higher risk** than the website model because: (a) it confirms the developer as the sole responsible party for distribution; (b) successful takedown does not deactivate already-installed instances; and (c) there is no Web Store mediation layer. The §512 counter-notice mechanism via GitHub remains available.

---

### 8. Updated Enforcement Risk

**Has there been any enforcement action specifically against browser extension video downloaders?**

#### Direct Extension Enforcement

Google has actively removed video downloader extensions from the Chrome Web Store since approximately 2014, specifically targeting extensions that facilitate downloading from YouTube, Instagram, TikTok, and similar platforms. Several major video downloader extensions have had their YouTube/Instagram download capabilities removed or disabled as a condition of remaining in the Web Store. This constitutes platform-level enforcement (not court-ordered), but demonstrates active and ongoing industry pressure on this category of tool.

The Android app *Downloader* (by Elias Saba) provides a cross-platform analogy: it was twice suspended from Google Play after DMCA notices from content owners (Israeli TV companies; later Warner Bros. via MarkScan), even though the app itself did not contain infringing content — it was suspended because it *could* be used to access pirated content. Google ultimately reversed the suspension in both cases, but the episode demonstrates that rights holders are willing to file aggressive DMCA notices against general-purpose download/browser utilities and that distribution platforms (even Google) may comply provisionally before full review.

#### No US Court Judgment Specifically Against a Browser Extension for Video Downloading

As of the date of this research, there is no confirmed US federal court judgment holding a browser extension developer liable for contributory or direct copyright infringement based solely on the extension's video download capabilities. Enforcement has predominantly targeted:
- Web-based stream-ripping services (FLVTO, 2Conv, MP3 Studio) — server-side tools.
- Software repositories (youtube-dl on GitHub) — DMCA §512 notices.
- Hosting providers (Hamburg cases) — under EU/German law.

The absence of a specific browser extension case does not mean the risk is low — it may reflect that most infringing extensions are removed from the Web Store before litigation is necessary, and that private/unpacked distribution has so far been below the enforcement threshold for direct legal action.

#### UK and EU Extension Enforcement

No UK High Court injunction under CDPA s.97A has been directed specifically at a browser extension developer as of February 2026. All ISP blocking orders have targeted domain-accessible web services. Similarly, no EU court has issued an injunction specifically against a browser extension developer.

The Hamburg youtube-dl decisions targeted software distributed via a GitHub repository — which is closely analogous to the zip-file distribution model proposed here. Those decisions are the closest applicable precedent and should be treated as the benchmark for EU enforcement risk.

---

## Updated Risk Register

Only new or materially changed risks compared to the original risk register in `docs/legal-research-output.md` are listed here.

| Risk | Jurisdiction | Regulation | Likelihood | Impact | Change vs. Website | Mitigation |
|---|---|---|---|---|---|---|
| ECPA / Federal Wiretap Act claim for webRequest interception | US | 18 U.S.C. § 2511; ECPA | Low (party exception applies; no server backend) | High (criminal: up to 5 years; civil damages) | NEW risk — not present in website model | No-backend design; user installs/consents; document the one-party consent basis; publish privacy notice |
| CIPA (California) wiretap claim for network request monitoring | US (California) | Cal. Penal Code § 630 | Low (9th Circuit *Karwowski* 2025 confirms party exception) | High (class action exposure) | NEW risk — not present in website model | Same as above; user-installed/consent-based design; 2025 Ninth Circuit precedent strongly protective |
| CFAA "exceeds authorised access" claim for content script injection into third-party pages | US | 18 U.S.C. § 1030 | Low–Medium (untested in extension context; user-consented) | High (federal criminal exposure) | ELEVATED vs. website model | Restrict content scripts to observe-only / UI overlay; do not modify third-party page data; document user consent flow |
| GDPR / UK GDPR obligation triggered by broad `<all_urls>` network monitoring | EU / UK | GDPR Art. 4, 6, 13; UK GDPR | Low–Medium (no data stored/transmitted; but regulator scrutiny of `<all_urls>` elevated) | Medium (regulatory fine; reputational) | ELEVATED vs. website model (website had only GitHub Pages analytics; extension actively observes all tab traffic) | Publish explicit privacy notice; document no-storage/no-transmission design; consider narrowing `<all_urls>` permission |
| Chrome Web Store policy cited as evidence of developer knowledge of infringement in secondary liability claim | US / EU | Copyright Act §§ 106, 501; *Grokster*; German UrhG | Low–Medium (circumstantial; no direct precedent) | High (eliminates Sony Betamax defence) | NEW risk — not present in website model | Do not document that the extension was kept off the Web Store due to copyright concerns; maintain neutral positioning |
| Injunction requiring developer to push disabling update / cease GitHub distribution | EU (Germany primarily) | German UrhG; Hamburg 2024 precedent | Low–Medium | High (cessation of distribution; potential contempt) | SIMILAR to website model but harder to comply with (cannot de-install from existing user devices) | Maintain clean neutral documentation; respond promptly to notices; consider built-in kill-switch update mechanism |
| Rights holder files DMCA notice against GitHub zip release asset | US | DMCA § 512 | Medium (same as website model; GitHub is the distribution point) | Medium (zip release removed; source code may survive) | SIMILAR to website model | Counter-notice readiness; EFF developer fund contact; keep source code and releases in separate release assets |
| UK RIPA / IPA applied to extension network monitoring | UK | IPA 2016; RIPA 2000 | Very Low (statutes target public authorities, not private tools) | High (criminal if applicable) | NEW theoretical risk — not present in website model | Confirm no interception of encrypted communications; user-consent-based design |

---

## Updated Compliance Checklist Additions

The following items supplement (and do not replace) the compliance checklist in the primary research document.

**Privacy and Data Protection (Extension-Specific)**

- [ ] Publish a privacy notice specifically addressing the extension's network request monitoring: state explicitly that no network request data is stored, transmitted, or shared with any server operated by the developer.
- [ ] Evaluate whether `<all_urls>` host permission can be narrowed (e.g., to `*://*.youtube.com/*`, `*://*.vimeo.com/*`, or known video-hosting patterns) without breaking functionality; narrower permissions reduce GDPR/UK GDPR data minimisation exposure.
- [ ] Document the legal basis for any transient personal data processing (recommended: legitimate interests or implied user consent via installation and permission grant).
- [ ] Add a one-time on-install disclosure (the "one-time user acknowledgement" already contemplated in the architecture) that explicitly informs the user that the extension monitors network requests made by the active tab, for the sole purpose of detecting downloadable video.

**ECPA / Wiretap Act (Extension-Specific)**

- [ ] Confirm that the extension does NOT transmit any network request data, URLs, or headers to any remote server operated by the developer — this is the primary protection against ECPA / Wiretap Act claims.
- [ ] Document in code comments and in the README that the extension operates entirely in the user's local browser environment and that no data leaves the device.
- [ ] Review whether the `webRequest` listener reads request bodies or authentication headers; if so, restrict the listener to metadata only (URL, method, content-type) sufficient for HLS/DASH manifest detection.

**Content Script Injection (Extension-Specific)**

- [ ] Scope content scripts to perform the minimum necessary DOM operations (e.g., adding a UI overlay, reading the active tab's URL). Do not read, modify, or transmit the content of form inputs, cookies, authentication tokens, or session data visible in the injected page's DOM.
- [ ] Include a manifest-level description of what content scripts do, visible to users during extension installation.

**Distribution and Secondary Liability (Extension-Specific)**

- [ ] Do not include any statement, in any developer communication, commit message, issue comment, or README, indicating that the extension is distributed outside the Chrome Web Store to avoid copyright enforcement.
- [ ] Maintain the GitHub repository with neutral, lawful-use-only documentation (same principle as in original checklist, now even more critical given the Web Store policy evidence risk).
- [ ] Consider adding a software licence (e.g., MIT with a copyright-compliance rider) that explicitly prohibits use of the extension to infringe third-party intellectual property rights.
- [ ] Prepare a DMCA counter-notice template in advance for the GitHub zip release assets, in the same manner as for the source code repository.

**HLS/DASH Reassembly (Extension-Specific)**

- [ ] Confirm in technical documentation that the extension reassembles only segments that the tab's video player has already fetched (passive observation mode), rather than independently re-fetching those segments. Passive observation minimises the "direct copying" characterisation.
- [ ] If the extension independently fetches segments (active mode), add this to the DRM detection and rights confirmation interstitial flow — each independent HTTP request for a segment constitutes a separate act of copying.

---

## Revised Overall Risk Assessment

**The Chrome Extension architecture is modestly higher risk overall than the GitHub Pages website approach, for reasons that are substantially mitigatable.**

The core copyright secondary liability framework (Betamax/Grokster in the US; Hamburg model in the EU; CDPA secondary liability in the UK) applies to both architectures in essentially the same way. The extension is not fundamentally more exposed on copyright grounds than the website was. The original research's risk assessment on copyright liability carries over without material change.

The extension introduces three **new categories of risk** not present in the website model:

1. **ECPA/wiretap risk** from network request interception — materially new, but the specific design of dl-video (no backend, user-consented, observe-only) means this risk is **low** and is directly addressed by the 2025 Ninth Circuit precedent in *Karwowski*. This risk is controllable through the no-server design.

2. **GDPR / privacy obligation elevation** from `<all_urls>` network monitoring — the extension observes vastly more network traffic than a website that only processes its own requests. Even with no storage, this creates enhanced privacy notice obligations and regulatory scrutiny. This risk is **low-to-medium** and is **controllable** through: a clear privacy notice, possible permission narrowing, and the no-storage design.

3. **Content script injection legal exposure** from injecting code into third-party pages — introduces a CFAA "exceeds authorised access" argument and a ToS-based claim that does not arise when a website merely presents a UI in its own domain. This risk is **low-to-medium** and is **controllable** through: limiting content scripts to minimum-necessary DOM operations and not modifying or reading sensitive third-party page data.

The extension also introduces a **distribution-specific risk**: the absence of the Chrome Web Store as a mediating layer means rights holders must approach the developer directly, and the fact that the Web Store would have rejected the extension could be cited as evidence of knowledge in secondary liability litigation. This is an indirect but real risk.

**Net assessment:** The extension architecture is **10–20% higher risk overall** than the website model, driven primarily by the ECPA/privacy dimension and the content script injection dimension. This elevated risk is substantially addressable through the technical and legal mitigations described in this document. The copyright secondary liability risk — which was the primary concern in the original research — is **unchanged** between the two architectures.

---

## References

### Legal Sources — Extension-Specific

- [Chrome Web Store Developer Program Policies](https://developer.chrome.com/docs/webstore/program-policies/policies)
- [Chrome Web Store: Flag Issues & Report Copyright Infringement](https://support.google.com/chrome_webstore/answer/7508032?hl=en)
- [Chrome for Developers: chrome.webRequest API](https://developer.chrome.com/docs/extensions/reference/api/webRequest)
- [Chrome for Developers: Replace Blocking Web Request Listeners (MV3)](https://developer.chrome.com/docs/extensions/develop/migrate/blocking-web-requests)
- [Chrome for Developers: Distribute Your Extension](https://developer.chrome.com/docs/extensions/how-to/distribute)
- [Chrome Web Store: Updated Privacy Policy & Secure Handling Requirements](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)
- [Chrome Web Store: Limited Use Policy](https://developer.chrome.com/docs/webstore/program-policies/limited-use)
- [Electronic Communications Privacy Act — EPIC](https://epic.org/ecpa/)
- [Electronic Communications Privacy Act — Wikipedia](https://en.wikipedia.org/wiki/Electronic_Communications_Privacy_Act)
- [Privacy: An Overview of the ECPA — Congress.gov](https://www.congress.gov/crs-product/R41733)
- [Regulation of Investigatory Powers Act 2000 — GOV.UK](https://www.gov.uk/government/publications/regulation-of-investigatory-powers-act-2000-ripa/regulation-of-investigatory-powers-act-2000-ripa)
- [ICO: What Privacy Information Should We Provide?](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/the-right-to-be-informed/what-privacy-information-should-we-provide/)
- [ICO: UK GDPR Guidance and Resources](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/)
- [Chrome Extensions Requirements for Privacy Policy and Secure Handling](https://www.privacypolicies.com/blog/chrome-extensions-requirements-privacy-policy-secure-handling/)

### Key Cases — Extension-Specific

- *Karwowski v. Gen Digital, Inc.*, No. 24-7213, 2025 WL 3002610 (9th Cir. Oct. 27, 2025) — CIPA and ECPA claims against browser extension dismissed under party exception; directly on point for dl-video's network monitoring
- *MAI Systems Corp. v. Peak Computer, Inc.*, 991 F.2d 511 (9th Cir. 1993) — RAM copies constitute "copying" under 17 U.S.C. § 106
- Davis+Gilbert LLP: [Can You Wiretap a Website? Decades-Old Privacy Laws Are Being Used to Attack Common Internet Technologies](https://www.dglaw.com/can-you-wiretap-a-website-decades-old-privacy-laws-are-being-used-to-attack-common-internet-technologies/)

### Case Commentary and Analysis

- [Ninth Circuit Affirms Dismissal of Wiretap Claims Based on Party Exception — Inside Class Actions (Oct. 2025)](https://www.insideclassactions.com/2025/10/29/ninth-circuit-affirms-dismissal-of-wiretap-claims-based-on-party-exception/)
- [Ninth Circuit Affirms that CIPA Only Applies to Third-Party Eavesdropping — Crowell & Moring (2025)](https://www.crowell.com/en/insights/client-alerts/ninth-circuit-affirms-that-cipa-only-applies-to-third-party-eavesdropping)
- [Courts Expand ECPA Wiretapping Liability Through Crime-Tort Exception — Lexology](https://www.lexology.com/library/detail.aspx?g=327db976-8095-487e-82d7-553fd86a46b5)
- [Year in Review: 2024 Web Tracking Litigation and Enforcement — WilmerHale (2025)](https://www.wilmerhale.com/en/insights/blogs/wilmerhale-privacy-and-cybersecurity-law/20250225-year-in-review-2024-web-tracking-litigation-and-enforcement)
- [2025 Update: Website Tracking Litigation and Enforcement — Byte Back](https://www.bytebacklaw.com/2025/11/2025-update-website-tracking-litigation-and-enforcement/)
- [CIPA: Why Old Statutes May Be the Strongest Force of Web Privacy — Vault JS](https://vaultjs.com/insights/cipa-why-old-statutes-may-be-the-strongest-force-of-web-privacy/)
- [Secondary Copyright Infringement — Copyright Alliance](https://copyrightalliance.org/education/copyright-law-explained/copyright-infringement/secondary-copyright-infringement/)
- [Legal Agreements for Chrome Extensions — TermsFeed](https://www.termsfeed.com/blog/legal-agreements-chrome-extensions/)
- [Privacy Policy for Browser Extensions — TermsFeed](https://www.termsfeed.com/blog/browser-extension-privacy-policy/)

---

## Disclaimer

This document is a legal research summary produced as an addendum for informational and compliance planning purposes. It is **not legal advice** and does not constitute the rendering of legal services. The information contained herein reflects the state of publicly available law, case decisions, and enforcement activity as of February 2026. Laws change, court decisions evolve, and enforcement priorities shift.

This document must not be relied upon as a substitute for advice from a qualified intellectual property and technology law attorney admitted to practice in the relevant jurisdiction(s). The architecture change described in this addendum introduces legal dimensions — particularly around ECPA, GDPR, and content script injection — that are at the frontier of legal development and where qualified counsel's advice is especially important.

The author of this research document accepts no liability for any legal consequences arising from actions taken in reliance on this document.
