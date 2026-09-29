human-in-loop.dev marks (generators; not part of the served pages)

logo-gen.cjs   The current mark ("A - Brush"): a stick figure in the loop drawn as brush strokes.
               node -e "require('./logo-gen.cjs')" exposes svg(), favicon() and the stroke builders.
concepts.cjs   Other concepts on the same figure: one line (spiral), engraved, stamp.
apply-mark.cjs Writes the compact nav mark into every page's nav.

assets/img/logo.svg        the current mark, full detail
assets/img/favicon.svg     the current mark, bold, on a paper disc
assets/img/mark-stamp.svg  concept D (stamp): kept for a future component, not used on the site yet
