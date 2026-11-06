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
├── index.html            # the charter viewer, deployed at public-charters.coraliesage.com
├── app.js / app.css      # participation layer: sign-in, invitations, proposals with test cases
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

Public Charters is a kit that lets a community, such as a hospital, a school or a whole country, write and keep amending the charter its AI model follows, and then train the model on it. It works with Apertus by default and with any other open model.

Each round has six steps:

1. **Set up a space.** An organiser creates a space for the community, chooses whether it is open to anyone or invitation-only, and loads a starting charter (for example the Apertus Charter).
2. **Invite people.** Members join through invitation links and get an account. They can add an optional profile (role, department, language) that is used only to keep later steps representative.
3. **Open track: everyone edits.** Members select words in a clause and propose a rewording, an addition or a removal, with a short reason. Each proposal comes with **test cases**: questions someone might ask the AI, with what it does today and what it should do after the change. Members rate each other's proposals and improve the test cases, like a wiki.
4. **Score.** Proposals are scored so that support must come from people who usually disagree (the method behind Community Notes). Each proposal ends up *endorsed*, *contested* or *weak*. For contested clauses, an AI drafts a few compromise wordings that try to cover the different positions.
5. **Selected track: final edits.** A small panel is drawn by lot from the members, balanced by the space's quotas, using a published random seed so anyone can check the draw. The panel discusses the endorsed proposals and the compromise wordings, makes the final edits and votes. Its votes are weighted so the panel stands in for the whole membership.
6. **Publish and train.** The ratified changes become a new charter version, shown in the viewer as tracked changes. Its confirmed test cases are split 80/20: 80% become training data for fine-tuning the model, 20% are held back to test it. A before/after scorecard shows whether the new model actually follows the amended charter.

Then the next round starts from the new version.

Members can also spend a budget of **priority points** on what matters most to them. Spending more on one item costs more and more (quadratic cost), so strong views count without letting a few people dominate. Points set priorities only, such as the agenda order and which test cases must pass; they never decide whether a change is accepted.

**What exists today (charter-kit branch):** the viewer, accounts, invitations, and proposals with test cases. Scoring, the panel draw, AI-drafted test cases and fine-tuning are next.

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

- **Invite people:** click *Invite people* (top right) to create a link. Choose how many people may use it and for how many days. Send it through your usual channels. For an open space, set `access` to `open` and anyone can join with *Join this space*.
- **Open track:** give people one to three weeks to propose changes and write test cases. Remind them that one good test case is worth more than a long argument.
- **Panel and publication:** draw the panel, hold the panel session, then publish the new charter version. (These steps are being built; until then they are done by hand in the database.)
- **Model:** set the model in `kit.config.json`. The default, `swiss-ai/Apertus-v1.1-1.5B-Instruct`, is small enough to fine-tune on a free Colab GPU.

**Good practice:** say clearly in your invitation what the charter is for and what happens with the results; collect only the profile fields you need for balancing the panel; and publish each round's random seed and outcome.

## Guide for participants

You have been invited to help decide how an AI model should behave in your community.

1. **Join.** Open your invitation link and enter your email. You get a sign-in link by email, no password needed. Opening it adds you to the space.
2. **Read.** Each coloured highlight in the charter is a place where people have proposed a change. Click it to see the proposed wording, the reasons, and an example question showing what would change.
3. **Propose a change.** Select any words in a clause and click *Propose a change*, or use *Propose another change here* on a highlight. Choose reword, remove or add, write the new text and say why.
4. **Add a test case.** Write a question someone might ask the AI where your change makes a difference, what the AI tends to do today, and what it should do instead. Concrete, everyday examples work best. Test cases are what the model is trained and checked on, so they matter as much as the wording.
5. **See all proposals** under *Proposals* (top right).

Later in the round you may be asked to rate other proposals, spend priority points, or, if you are drawn by lot, sit on the panel that makes the final edits. Your ratings are private; only the combined results are shown.

### Documents & Deadlines
6. November: 1-pager: https://docs.google.com/document/d 1uiNv3wiHFuFnpSBEH5XlCaNscwk9bIWvY1uUpk8HSD8/edit?usp=sharing

15. November: Half-page progress note: [link to be added here]

22. November: Draft Version: [link to be added here]

29. November: Final Version: [link to be added here]

3. December: Presentation
