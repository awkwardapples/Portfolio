/* global window */
// The public config the WordPress plugin used to inject, for the SCB demo in
// Josh Lennon's portfolio (ADR-0044). A file rather than an inline script so
// the demo runs under a Content Security Policy without 'unsafe-inline'
// (ADR-0048). restUrl is empty, so QuotePage uses its built-in development
// port: nothing is ever sent.
window.GOQW_CONFIG = {
  contractVersion: 3,
  wizardId: 'fencing',
  enableCategoryNavigation: false,
  businessName: 'SCB Handyman',
  businessPhone: '',
  businessEmail: '',
  primaryColor: '#1C4A3D',
  calendlyUrl: '',
  turnstileSiteKey: '',
  restNamespace: 'qw/v1',
  restUrl: '',
  restNonce: '',
  pluginVersion: 'demo',
  buildTimestamp: '',
};
