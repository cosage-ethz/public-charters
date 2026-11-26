currently deployed at http://public-charters.coraliesage.com (DNS check in progress, hopefully https:// soon.)

## Public Charters: Public Opinion Platforms as Participatory Mechanisms to influence Model Values

**Step 1:** build platform prototype (visualisation, backend) and collect reference charter edits from family and friends (potentially analog, paper & pencil), research opinion aggregation/voting mechanisms
-> technical note: good backend contender apparently Supabase (gives us Postgres 500 MB database, 50k accounts, access rules, EU region hosting for GDPR and Swiss data law compilance, with free version, so likely more than enough)

**Step 2:** build opinion aggregation mechanism and live update views and user-specific site views. Collect user opinions here?

**Step 3.0:** (optional, final) add functionality to download finetuned 0.5B/1.5B Apertus model version to your own constitutional ideas or to a specific reference constitution version.
-> technical note: can use free Google Colab T3, can run it locally. Only works if we have enough testcases for each of the constitution versions

**Step 3.1:** make this entire pipeline modular, so different communities can use it to create their own public charters.

**Step 3.2:** make this a public dataset, can be used by social scientists and CS scientists to make more informative public charter decisions
-> technical note: easy, just export to HuggingFace

### Repo contents

This branch (`main`) is the public website for the Apertus Charter. The [`charter-kit`](https://github.com/cosage-ethz/public-charters/tree/charter-kit) branch is the version any community can install for its own AI and charter.

```
.
├── index.html            # home: what an AI charter is, why take part (public-charters.coraliesage.com)
├── participate.html      # Take part: rate changes one at a time, suggest your own
├── results.html          # Results: how each suggested change was rated, with breakdowns
├── charter.html          # The charter: the overlay viewer of the Apertus Charter
├── about.html            # About: what this is, how we count, your data, research behind it
├── organise.html         # Organise (admins only, English only, not in the menu)
├── lang/
│   ├── en.js             # all English text
│   ├── de.js             # all German text, incl. translated charter excerpt (draft: needs native review)
│   └── fr.js             # all French text, incl. translated charter excerpt (draft: needs native review)
├── i18n.js               # picks the language (?lang=, saved choice, browser) and fills in the text
├── sample-data.js        # sample charter excerpt, suggested changes and examples (English; translations in lang/)
├── bridge.js             # the scoring rule: net support, breakdowns, dissent record (browser and Node)
├── community.js          # the sample round (140 made-up participants), plus this browser's own input
├── journey.js            # logic of the Take part page
├── site.css              # shared navigation and page styles
├── app.js / app.css      # accounts and the proposal form, shared by all pages
├── config.js             # Supabase URL and public key, and the space slug ('apertus')
├── kit.config.json       # model and pipeline settings (default: swiss-ai/Apertus-v1.1-1.5B-Instruct)
├── supabase/
│   ├── schema.sql        # tables, access rules and join/invite functions
│   └── seed.sql          # the open 'apertus' space with an excerpt of the Apertus Charter
├── DATA_MODEL.md         # data model, including the tables added for the Charter Kit
├── Democratic fine-tuning a charter wiki for open models-2.pdf  # initial brainstorming document
├── README.md             # this file
└── CNAME                 # record for the website
```

## Languages

The site is in English, German and French. A visitor's language comes from the link (`?lang=de`), then their earlier choice, then their browser, then English; the EN · DE · FR switch is at the top of every page. All text is in `lang/en.js`, `lang/de.js` and `lang/fr.js`, with the same keys in each, so wording can be corrected without touching the code. To add a language, copy `lang/en.js`, translate it (including the `sample` section, see `lang/de.js`), load it in each page's `<head>` and add its code to `LANGS` in `i18n.js`.

The Apertus Charter is published in English only, so the German and French charter sentences are our own translations. Both translations are drafts and should be checked by native speakers before launch. Suggestions made in German or French store the quoted words and the language with them (`anchor.lang`), since the database holds the English charter text.

## Editing the text

Every word on the site lives in three files, one per language, with the same structure:

| File | What's in it |
|---|---|
| `lang/en.js` | English |
| `lang/de.js` | German (Swiss spelling, formal *Sie*) |
| `lang/fr.js` | French (*vous*) |

Each file is grouped by page: `home` (homepage), `take`, `join`, `rate`, `propose`, `done` (Take part), `results`, `about`, `viewer` (the charter page), plus shared bits (`nav`, `status`, `answer`, `form`, `acct`, `demo`, `common`). Change only the text between the quotes; keep the key names on the left identical in all three files.

- `<b>…</b>` makes text bold, `<em>…</em>` makes the second part of a big headline red, and `<a href="…">…</a>` is a link.
- `{n}`, `{email}`, `{name}` and similar are filled in automatically; keep them as they are.
- A quote mark inside a text must be written as `’` (typographic apostrophe), not `'`, or the file breaks.
- Keys ending in `_one` are the singular version of the key without it (for example `rate.count` / `rate.count_one`).

**After editing `lang/en.js`, run `node tools/fill-fallback.js`.** It copies the English text into the HTML pages, so they are readable without JavaScript and for search engines (German and French are filled in by the browser as before).

The charter sentences and the sample suggestions are separate: English in `sample-data.js`, German and French under `sample` at the end of `lang/de.js` and `lang/fr.js`. After editing, reload the page; if a page goes blank, the browser console names the line with the problem.

## How the public site works

*(Simplified on 25 November: Take part now has only "rate changes" and "suggest your own change", without test cases. The comparison of answers, concerns and surveys were removed from the public site.)*

Anyone can take part in one open round on the Apertus Charter. People sign in with their email (no password), optionally answer three profile questions (age group, main language, how often they use AI chatbots), and then, in any order:

- **compare answers:** see a situation and two answers, one following the current charter and one following a proposed change, and pick the better one before learning which is which (like Smartvote);
- **rate suggestions** as helpful, somewhat or not helpful, with an optional reason;
- **share concerns** in their own words and add *me too* to others'; no AI reads or summarises them;
- **propose changes**, optionally with **test cases**: situations where the new wording should change what the AI does.

**Scoring (`bridge.js`).** Everyone is in one pool. Each rating counts +1 (helpful), 0 (somewhat) or −1 (not helpful). A suggestion is *endorsed* with a net score of at least +0.3 from at least 10 ratings, *contested* when at least 30% find it helpful and at least 30% do not, and otherwise does not have enough support. The profile questions only produce **breakdowns** (how each group rated a change), never vetoes, and groups with fewer than 5 answers are not shown. The thresholds are placeholders until real ratings come in. Opinion groups (Polis-style) can be added later as another breakdown.

**Test cases** are optional when proposing. Before training, admins review them: only admins (and the pipeline) can change a test case's status or tier.

**What exists today:** until enough real input has come in, the pages show a sample round of 140 made-up participants, clearly labelled, and your own answers are added in your browser. With a database connected, sign-in, joining, consent, profile answers, ratings, comparisons, feedback and proposals are saved; the lists of suggestions, situations and concerns still come from the sample data. Next: reading those lists from the database, the scoring job, test-case review, and fine-tuning.

## Setting up the database

You need a free [Supabase](https://supabase.com) account.

1. Create a Supabase project in an EU region (Frankfurt).
2. In the SQL editor, run `supabase/schema.sql`, then `supabase/seed.sql`. This creates the single open space `apertus`.
3. Under Authentication > URL configuration, add `https://public-charters.coraliesage.com` as the site URL and as a redirect URL.
4. Copy the project URL and the public `anon` key from Project settings > API into `config.js`. The `anon` key is meant to be public: the access rules in `schema.sql` decide what each visitor can read and write. **Never put the `service_role` key in the site.**
5. Sign in on the site once with your email, then make yourself an admin in the SQL editor:

   ```sql
   insert into membership (space_id, user_id, role)
   select s.id, u.id, r from space s, auth.users u, (values ('admin'), ('member')) as v(r)
   where s.slug = 'apertus' and u.email = 'you@example.org';
   ```

Admins see an *Organise* link in the account bar. Sign-in emails use Supabase's built-in sender, which allows only a few emails per hour; before a larger session (such as the presentation), connect your own SMTP sender or enable Google sign-in.

### Documents & Deadlines
6. November: [1-pager] (https://docs.google.com/document/d 1uiNv3wiHFuFnpSBEH5XlCaNscwk9bIWvY1uUpk8HSD8/edit?usp=sharing)

23. November: [Half-page progress note] (https://docs.google.com/document/d/1eZqBLXRaK0G6BPYF9t8VtyKy-xgoJ3hmOeAgIPPXdVg/edit?tab=t.0)

26. November: Draft Version [link to be added here]

30. November: Final Version [link to be added here]

3. December: 10-12 minute in-class Presentation
