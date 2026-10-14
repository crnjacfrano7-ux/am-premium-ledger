<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Render apartment inventory as a five-unit architectural floor schematic matching the supplied drawing; keep any additional stored units accessible below their floor to avoid data loss.
- Generate new apartment labels through the shared apartmentLabel helper; this keeps floor and added-unit numbering consistent.
- Render the central staircase as a non-interactive layer below editable units so orientation cues do not intercept selection or dragging.
- Store staircase layouts by floor on each building; edit-mode handles stay below units so persisted orientation changes do not intercept apartment selection.
- Save custom apartment labels on blur or Enter and derive default labels from floor and slot, not user-edited names, to preserve automatic numbering.
