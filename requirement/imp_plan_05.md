# Add Provider Configuration Matrix to ProvidersView

This plan outlines how the Provider Configuration Matrix (from the Markdown RAG report) will be integrated directly into the UI of `ProvidersView.js`, complete with sorting and filtering capabilities.

## User Review Required

- **Placement**: I plan to place the table at the very top of the Right Workspace Pane, immediately above the individual provider panels (the card grid). Since the table will list ALL providers, it may take up significant vertical space above the cards. 
- **Filters of Skills**: I will implement interactive, clickable table headers that allow you to dynamically sort the table by columns (e.g., Status, Protocol, Quota Limit) without reloading the page. Is this what you meant by "various filters of skills"?

## Open Questions

- Should the table only show the providers that belong to the currently selected tab (Active/Inactive/Sleep), or should the table *always* show ALL providers, sorted with Active on top? (My current plan is to show ALL providers in the table, sorted Active on top, regardless of the tab filter).

## Proposed Changes

### [Component: ProvidersView.js]

#### [MODIFY] [`public/js/views/ProvidersView.js`](file:///C:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/ProvidersView.js)
- **Table Generation Logic**: Inside `ProvidersView.render()`, before rendering the grid of panels, I will use the `allProviders` array to construct a native HTML `<table>` identical to the RAG report matrix.
- **Sorting Logic**: I will pre-sort the `allProviders` array so that Active providers appear at the top. I will also attach JavaScript `onclick` handlers to the table headers `<th>` to enable interactive sorting (e.g., sort by Protocol, Name, etc.).
- **CSS Styling**: I will apply `glass-panel` and standard table classes so it matches the beautiful dark mode aesthetics of the rest of the application.

## Verification Plan

### Manual Verification
- Hard refresh the UI and navigate to the Providers screen.
- Verify the Configuration Matrix table renders correctly above the provider cards.
- Verify that clicking table headers correctly sorts the rows without breaking the UI.