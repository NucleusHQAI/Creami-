# 11 — Online recipe adaptation

## Goal

Online recipes are inspiration, not authoritative imports. The app extracts or accepts the source
ingredients, rebuilds the idea around one of the household's existing CREAMi bases and current UK
ingredient library, explains every decision, then populates the normal recipe editor for review.

The user always chooses whether to save. The existing macro engine remains the only source of
nutrition figures.

## User flow

1. Tap **Add recipe** on the recipe list.
2. On the new-recipe screen, choose **Adapt from an online recipe**.
3. Either enter a public recipe URL or paste a title and ingredient list.
4. Review the suggested base, mapped UK ingredients, ingredients already covered by the base and
   unresolved lines.
5. Use the adaptation to populate the normal editor.
6. Change any base, category, quantity, role or ingredient and review the live app-calculated
   macros.
7. Save the recipe. Its source attribution is attached after the normal recipe save succeeds.

Existing recipe editing does not show the adaptation action.

## Macro contract

Source nutrition data is never extracted, stored, compared or used. Adapted drafts always set
`macro_override_kcal` and `macro_override_protein_g` to `null`.

Macros are calculated only from:

- the selected base and its current ingredient rows;
- matched additions and mix-ins from the current ingredient library;
- the quantities and normalised units in the draft;
- current freezer-fill, milk and serving settings; and
- the derived fill milk calculated by the existing macro engine.

Unresolved and free-text lines contribute no macros and must be labelled as needing attention.

## Adaptation decisions

Every source line produces one visible decision:

- **Using** — matched to an existing ingredient.
- **UK replacements** — mapped through a data-driven adaptation rule.
- **Covered by your base** — deliberately omitted because the selected base already supplies it.
- **Needs attention** — ambiguous quantity, unsupported conversion or unknown ingredient.

The matcher uses exact current ingredient names and slugs before adaptation rules. It does not
create ingredients, bases or categories. Similar-looking names may be suggested to the user but
are never inserted automatically.

Base hints are scored from the source title and ingredient text. A specialised base wins only with
a clear score; otherwise **Everyday creamy** is used. The selected base remains editable.

## Units

Metric mass and volume are preserved. US ounces and pounds convert to grams; fluid ounces and
liquid cups convert to millilitres. Teaspoons and tablespoons of solids convert only when the
matched ingredient has a trustworthy `grams_per_tsp`. Solid cups and quantity ranges remain
unresolved for human review.

The original source line is retained in every decision.

## UK substitution policy

Adaptation rules live in the database and prefer generic products already present in the curated
household library. Initial rules cover common yoghurt spelling, PB2, graham crackers, pudding mix,
US high-fat dairy descriptions and base hints for cheesecake, coconut, chocolate, fruit and
coffee.

Rules never claim live price or availability and never scrape supermarkets.

## URL extraction

An authenticated Supabase Edge Function fetches public HTTP or HTTPS pages and reads Schema.org
`Recipe` JSON-LD. It accepts a single object, arrays and `@graph`, and returns only source metadata,
name, short description, yield and ingredient lines.

The function:

- retains platform JWT verification;
- rejects credentials in URLs, non-web schemes, unusual ports and local, private, link-local or
  reserved destinations;
- revalidates every redirect;
- uses a short timeout, redirect limit and response-size limit;
- requires HTML content;
- never logs page content or authentication tokens; and
- never writes to the database.

Pages without supported structured recipe data use the paste fallback. Arbitrary DOM scraping,
social/video extraction, method copying, images and source nutrition are out of scope.

## Errors and offline behaviour

Extraction errors distinguish invalid links, blocked hosts, timeouts, oversized pages, unsupported
content and missing structured recipe data. The sheet preserves the entered link and offers retry
or paste fallback.

Recipe creation and adaptation are blocked offline with a clear explanation. Previously saved
recipes remain readable according to the offline specification.

If the recipe saves but source attribution fails, the recipe remains saved and the user receives a
specific warning. The app must never report that the whole recipe save failed in that case.

## Source attribution

Saved adaptations may have one or more source rows. The first UI creates one containing only the
source URL, title, site, short adaptation summary and retrieval time. Raw HTML and copied method
text are never stored.

Recipe detail shows a compact **Inspired by** card. A source URL becomes a link only after it is
revalidated as HTTP or HTTPS, and external links use `noopener noreferrer`.

## Acceptance journeys

- A birthday-cake source selects Everyday creamy, treats milk, protein and pudding as covered by
  the base, and keeps vanilla and sprinkles.
- Strawberry cheesecake selects Cheesecake, keeps strawberries and a digestive-style mix-in, and
  avoids duplicating base dairy.
- Chocolate peanut butter selects Chocolate creamy and maps PB2 to powdered peanut butter.
- A solid cup measurement and unknown brand are visibly unresolved.
- Changing the suggested base immediately changes the existing live macro readout.
- Saving attaches safe source attribution without changing shopping or recipe search behaviour.
- The same flow from pasted ingredients works when URL extraction is unsupported.
- Offline use is blocked with an explanation.
