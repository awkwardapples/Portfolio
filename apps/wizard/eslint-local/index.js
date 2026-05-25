// eslint-local/index.js
//
// A tiny local ESLint plugin for ADR-0012 constraints that are awkward to
// express as esquery attribute-regex selectors. esquery's selector regex does
// not reliably honour the /u flag or \u{...} escapes, which makes emoji
// detection unreliable when written as no-restricted-syntax selectors.
//
// This rule walks string-bearing nodes (Literal, JSXText, TemplateElement)
// and tests their text with a REAL compiled JavaScript RegExp (with the /u
// flag), which is dependable. It catches pictographic emoji while leaving
// legitimate BMP UI glyphs (e.g. arrows like U+21BA) alone.

const EMOJI_RE =
  /[\u{1F000}-\u{1FAFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|\u{2B50}|\u{2728}|[\u{1F1E6}-\u{1F1FF}]|\u{FE0F}/u;

const noEmoji = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow emoji in UI source (ADR-0012).',
    },
    schema: [],
    messages: {
      emoji: 'Emoji are banned in the UI (ADR-0012). Use an SVG icon or plain text.',
    },
  },
  create(context) {
    function check(node, text) {
      if (typeof text === 'string' && EMOJI_RE.test(text)) {
        context.report({ node, messageId: 'emoji' });
      }
    }
    return {
      Literal(node) {
        if (typeof node.value === 'string') check(node, node.value);
      },
      JSXText(node) {
        check(node, node.value);
      },
      TemplateElement(node) {
        check(node, node.value && node.value.raw);
      },
    };
  },
};

export default {
  rules: {
    'no-emoji': noEmoji,
  },
};
