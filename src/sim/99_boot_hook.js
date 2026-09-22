/* Boot entry hook. Kept in the LAST module of _order.txt so that even a
   synchronously-firing DOMContentLoaded stub (devtools probes) runs boot()
   only after every module's top-level bindings are initialized. */
window.addEventListener('DOMContentLoaded', boot);
