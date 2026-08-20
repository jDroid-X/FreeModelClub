# Goal

Refactor the Provider Registration UI so that when models are fetched and checked, the user can "Add" them to a persistent Staged Models Table that clearly displays their Metadata and Tokens. The final registration will submit the models present in this table.

## User Review Required

> [!IMPORTANT]
> Because you mentioned that hitting "+ Add Model" was showing a blank popup instead of handling your selected models, I will split the functionality into two distinct, clear actions to avoid confusion:
> 1. **Add Selected to Table**: This button will take all the checkboxes you selected in the box and instantly move them down into a beautiful, detailed table showing their Context Tokens, Max Tokens, and Family.
> 2. **+ Custom Model**: This will be a secondary button that keeps the manual popup behavior, just in case you ever need to manually define a model from scratch.

Does this two-button approach sound good, or would you prefer a single button that auto-detects what you want to do?

## Proposed Changes

### `public/js/views/RegistrationView.js`

- **State Management**: Introduce `RegistrationView.fetchedModels` to hold the live data returned from the provider, so we can access Context Window and Token data without losing it. Introduce `RegistrationView.stagedModels` to hold the models you've approved for registration.
- **UI Modifications**:
  - Update the "Available Free Models Box" header to have two buttons: `Add Selected to Table` and `+ Custom Model`.
  - Add a Staged Models Table container right above the final `Register Provider & Save Models` submit button.
- **Logic**:
  - `addSelectedToTable()`: Scans checked boxes, cross-references `fetchedModels`, and populates the Table.
  - `renderStagedTable()`: Draws a clean HTML table showing Model Name, ID, Context Tokens, Output Tokens, and an action to "Remove" a model if you change your mind.
  - `handleRegister()`: Modified to only submit the models that are present in the `stagedModels` table, ensuring you have full control over exactly what gets saved.

## Verification Plan
### Manual Verification
1. I will search for models using the Ping test.
2. I will check several models in the box and hit "Add Selected to Table".
3. I will verify that the table renders correctly with Metadata and Tokens.
4. I will hit "Register Provider" and ensure only the table models are saved to the backend database.