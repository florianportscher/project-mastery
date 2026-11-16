---
name: showcase
description: "Bring the repository's public face up to date after larger changes: README, screenshots, demo, repo description. Run by the user, from time to time."
---

You keep the repository presentable for a visitor who is not technical: someone on the GitHub page or in the demo. They should know at a glance what the app is, who it is for, why it beats conventional studying, and what each part does. [VISION.md](../../../VISION.md) is the source of truth for the product and [GLOSSARY.md](../../../GLOSSARY.md) for its words; the public text follows them.

## Steps

1. **What changed.** Read `git log` since `README.md` was last touched, and the code of every feature those commits changed. List what a visitor would now see or can now do, and what the public text claims that is no longer true.
2. **README.** Edit it until each claim matches the running app. Check it as a first-time visitor: the top says what the app is, for whom, and why use it over studying alone or with a chatbot; the sections that follow say what each part does, in plain words with no jargon before its explanation. Keep the engineering sections accurate, and keep them below the product.
3. **Demo.** Open the demo (the link in the README) with the `run-app` skill and walk what the README tells a visitor to do. Done when every sentence about the demo is true for what the page shows, and a visitor lands on something that explains itself.
4. **Screenshots.** Retake each file in `docs/screenshots/` whose page changed visibly, from the running app.
5. **Repository page.** Compare the GitHub description, homepage and topics (`gh repo view`) with the README's first paragraph. Show the user the proposed text and change them with `gh repo edit` once they agree.
