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

index.html -> website deployed at public-charters.coraliesage.com
Democratic fine-tuning a ... -> initial brainstorming document
README.md -> self-explanatory
DATA_MODEL.md -> initial Claude brainstorm of the backend datamodel. Needs to be reviewed and edited!
CNAME -> record for the website

### Documents & Deadlines
6. November: 1-pager: https://docs.google.com/document/d 1uiNv3wiHFuFnpSBEH5XlCaNscwk9bIWvY1uUpk8HSD8/edit?usp=sharing

15. November: Half-page progress note: [link to be added here]

22. November: Draft Version: [link to be added here]

29. November: Final Version: [link to be added here]

3. December: Presentation
