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

```
.
├── index.html            # Charter: the viewer, deployed at public-charters.coraliesage.com
├── about.html            # How it works: the concept, the process, and the research behind it
├── participate.html      # Participate: compare answers, rate, concerns, propose (optional background)
├── results.html          # Results: status of every suggestion by group, charter check, concerns, safety floor, feedback
├── organise.html         # Organise: phases, groups and their shares, invitations, AI settings
├── sample-data.js        # sample charter, proposals and test cases used by the prototype pages
├── bridge.js             # the scoring rule: support in every group, group weights, dissent record (browser and Node)
├── community.js          # the demo hospital community, plus this browser's own input
├── journey.js            # logic of the Participate page
├── site.css              # shared navigation and page styles
├── app.js / app.css      # accounts, invitations and the proposal form, shared by all pages
├── config.js             # per-organisation settings (Supabase URL and public key, default space)
├── kit.config.json       # model and pipeline settings (default: swiss-ai/Apertus-v1.1-1.5B-Instruct)
├── supabase/
│   ├── schema.sql        # tables, access rules and join/invite functions
│   └── seed.sql          # demo space with an excerpt of the Apertus Charter
├── DATA_MODEL.md         # data model, including the tables added for the Charter Kit
├── Democratic fine-tuning a charter wiki for open models-2.pdf  # initial brainstorming document
├── README.md             # this file
└── CNAME                 # record for the website
```

## How the process works

Public Charters is a kit that lets a community, such as a hospital, a school or a canton, write and keep amending the charter its AI model follows, and then train its own copy of the model on it. It works with Apertus by default and with any other open model.

**Each community runs its own instance.** There is no central platform: an organisation forks this repository, connects its own database, hosts the site on its own server, and invites its own members. Its charter, contributions and fine-tuned model stay with it. Instances can adapt the charter and test cases to their own use cases, and can start from another community's published charter.

Each round works like this:

1. **Set up a space.** An organiser creates a space for the community, chooses whether it is open to anyone or invitation-only, loads a starting charter (for example the Apertus Charter), and sets the **groups**: for example doctors, nurses and carers, patients and relatives, and admin staff, with the share of the community each stands for.
2. **Invite people.** Members join through invitation links, get an account and say which group they belong to.
3. **Contribute, in any order.** Background reading and a survey before and after are offered, never required. Members:
   - **compare answers:** see a situation and two answers, one following the current charter and one following a proposed change, and pick the better one before learning which is which (like Smartvote);
   - **rate suggestions** as helpful, somewhat or not helpful, with an optional reason;
   - **share concerns** in their own words and add *me too* to others'; no AI reads or summarises them;
   - **propose changes** with **test cases**: situations where the new wording should change what the AI does. The form starts from situations other members already wrote for the clause.
4. **Support in every group.** A suggestion is *endorsed* when at least 60% of raters in every group find it helpful (at least 3 ratings per group), *contested* when some groups are for it and others against, and otherwise does not have enough support. Each group counts at its share of the community, however many of its members turn up (a simplified version of DemPO weighting). When every group prefers the alternative answer in a comparison, the clause is flagged as possibly lacking.
5. **Bridges.** For contested changes, members see both sides' reasons and write bridge wordings, rated the same way. No AI writes compromises.
6. **Publish, check and train.** Endorsed changes become a new charter version with a **dissent record** (which groups were partly against, and why). Two members confirm each test case, the version is checked against a **safety floor** no amendment can lower, and the test cases are split 80/20 for training and testing. A before/after scorecard and the members' **process feedback** open the next round.

A panel drawn by lot can be added later, as an option, for communities that want one.

**What exists today (charter-kit branch):** the viewer, accounts and invitations, the Participate and Results pages with the scoring rule in `bridge.js`, the proposal form with test cases, and the Organise page with groups and shares. In demo mode (no database connected) the pages use a made-up hospital of 40 members, and your own answers are added to theirs in your browser. With a database connected, consent, surveys, ratings, comparisons and feedback are saved as judgements, and proposals with their test cases are saved to the database; the lists of suggestions, situations and concerns still come from the demo data. Next: reading those lists from the database, the scoring job, test-case confirmation, and fine-tuning.

## Guide for organisers

You run the process for your community. You need a free [Supabase](https://supabase.com) account and somewhere to host static files (GitHub Pages works).

**One-time setup (about 20 minutes)**

1. Fork this repository.
2. Create a Supabase project. Choose an EU region if your members are in Switzerland or the EU.
3. In the Supabase SQL editor, run `supabase/schema.sql`, then `supabase/seed.sql` (or adapt the seed to load your own charter).
4. In Supabase, under Authentication > URL configuration, add your site's address as the site URL and as a redirect URL, so sign-in links point back to your site.
5. Copy the project URL and the public `anon` key from Project settings > API into `config.js`, and set `space` to your space's slug. The `anon` key is meant to be public: the access rules in `schema.sql` decide what each visitor can read and write. **Never put the `service_role` key in the site.**
6. Publish the site (for GitHub Pages: Settings > Pages > deploy from your branch).
7. Sign in on your site once with your email, then make yourself an admin in the SQL editor:

   ```sql
   insert into membership (space_id, user_id, role)
   select s.id, u.id, r from space s, auth.users u, (values ('admin'), ('member')) as v(r)
   where s.slug = 'apertus-demo' and u.email = 'you@example.org';
   ```

**Running a round**

- **The Organise page** shows the current phase (setting up, open, bridges, published), lets you move to the next one, shows how many people take part, and is where you set the groups and their shares.
- **Invite people:** click *Invite people* (top right) or use the Organise page to create a link. Choose how many people may use it and for how many days. Send it through your usual channels. For an open space, set `access` to `open` and anyone can join with *Join this space*.
- **Open phase:** give people one to three weeks. Ask each member for about 15 minutes: 10 comparisons and 10 ratings. Turn the most shared concerns into new situations to compare.
- **Bridges and publication:** give one week for bridges on contested changes, then publish the new version with its dissent record. (Publication is being built; until then it is done by hand in the database.)
- **Groups:** with fewer than about 100 active members, use roles you set. Opinion groups found from the votes, as in Polis, need more data.
- **Model:** set the model in `kit.config.json`. The default, `swiss-ai/Apertus-v1.1-1.5B-Instruct`, is small enough to fine-tune on a free Colab GPU.

**Good practice:** say clearly in your invitation what the charter is for and what happens with the results; collect only what you need (the group, and optionally language and age to check reach); publish each round's results, dissent record and process feedback.

## Guide for participants

You have been invited to help decide how an AI model should behave in your community. On the **Participate** page you can do as much or as little as you like, in any order. About 15 minutes covers your share of a round.

1. **Join.** Open your invitation link and enter your email. You get a sign-in link by email, no password needed. Choose your group and agree to how your input is used.
2. **Background, if you want it.** The most debated clauses with every option side by side, and four optional questions you can answer again at the end to see whether your views moved.
3. **Compare answers.** You see a situation and two ways the AI could respond. Pick the better one; then you see which follows the current charter, and how each group chose. After five, you see your match with the charter.
4. **Rate suggestions.** Helpful, somewhat or not helpful, with an optional reason. Suggestions that still need ratings from your group come first.
5. **Concerns.** Write what worries you, in your own words, and add *me too* to concerns you share.
6. **Propose a change.** Select words in a clause and click *Propose a change*. Write the new text, why, and at least one test case: a situation where your wording should change what the AI does. For contested changes, try the bridge challenge: a wording both sides could accept.
7. **Wrap up.** Optional feedback on the process, then see the **Results** page.

Your ratings and answers are private; only combined results by group are shown.

### Documents & Deadlines
6. November: 1-pager: https://docs.google.com/document/d 1uiNv3wiHFuFnpSBEH5XlCaNscwk9bIWvY1uUpk8HSD8/edit?usp=sharing

15. November: Half-page progress note: [link to be added here]

22. November: Draft Version: [link to be added here]

29. November: Final Version: [link to be added here]

3. December: Presentation
