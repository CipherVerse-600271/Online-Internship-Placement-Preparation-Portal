# Accessibility Validation Checklist (WCAG 2.1 AA)

**Status:** Pending manual execution and evidence capture. This checklist is a test instrument, not a claim of conformance.

Record the build SHA, browser/OS, viewport, tester, date, result (Pass/Fail/Blocked), and evidence for every item.

| ID | Check | Expected result | Result / evidence |
|---|---|---|---|
| A11Y-01 | Navigate all public and authenticated pages using Tab / Shift+Tab | Every interactive control is reachable in a logical order | Not run |
| A11Y-02 | Operate menus, dialogs, forms and buttons using keyboard only | Controls work without a mouse; focus is visible | Not run |
| A11Y-03 | Inspect page headings and landmarks | Heading hierarchy is meaningful; landmarks identify main content and navigation | Not run |
| A11Y-04 | Inspect form labels and errors with a screen reader | Inputs have programmatic labels; errors are announced and associated with fields | Not run |
| A11Y-05 | Check text and UI contrast | Text meets 4.5:1 (normal) / 3:1 (large); meaningful UI components meet 3:1 | Not run |
| A11Y-06 | Zoom browser to 200% and 400% | Content remains usable without loss of information or two-dimensional scrolling except where essential | Not run |
| A11Y-07 | Test responsive layouts at 320px, 768px and desktop widths | No clipped controls or overlapping content | Not run |
| A11Y-08 | Check images and icons | Informative images have meaningful alternatives; decorative images are ignored | Not run |
| A11Y-09 | Check status messages and dynamic updates | Success, error and loading states are programmatically exposed | Not run |
| A11Y-10 | Run automated axe scan on public landing page | No critical or serious automated accessibility violations | CI scan; review latest workflow artifact |

## Execution notes

1. Run the automated Playwright accessibility test in CI.
2. Complete A11Y-01 through A11Y-09 manually using keyboard navigation and at least one screen reader (NVDA or VoiceOver).
3. Record each violation with page, element, impact, screenshot, and issue ID.
4. Re-test fixes and attach evidence before closing the related accessibility backlog.

Automated scans detect only a subset of accessibility problems. A clean axe scan does not establish full WCAG 2.1 AA conformance.
