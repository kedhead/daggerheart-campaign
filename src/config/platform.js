/**
 * Which target the running bundle was built for.
 *
 * Set by `vite build --mode mobile`, so it's a build-time constant that
 * minifies away — the web bundle never carries the mobile branches and the
 * mobile bundle never carries the web ones.
 *
 * Use this only for things that are genuinely impossible on one target
 * (native WebView restrictions), not for layout. Screen size is handled by
 * useIsMobile and CSS breakpoints; a phone browser on the web build is still
 * the web app and should keep every web affordance.
 */
// Written as a bare `import.meta.env.MODE` on purpose. Vite substitutes that
// exact expression with a string literal at build time, so the comparison
// folds to a constant and the dead branch is dropped. Guarding it with
// optional chaining or a typeof check defeats the substitution — the branch
// then survives minification and the mobile bundle ships a Google button that
// cannot work.
export const IS_MOBILE_APP = import.meta.env.MODE === 'mobile';

/**
 * Google sign-in uses signInWithPopup, which cannot work inside the app's
 * WebView: Google refuses OAuth in embedded user agents (the
 * `disallowed_useragent` error), and the popup has no window to open into.
 * Until the shell brokers the token natively, the mobile app offers
 * email/password only. Accounts are the same either way — a player who
 * signed up with Google on the web can set a password via "Forgot password"
 * and sign in here with it.
 */
export const SUPPORTS_OAUTH_POPUP = !IS_MOBILE_APP;
