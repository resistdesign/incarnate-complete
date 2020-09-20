require('ts-node/register');
const jsdomGlobal = require('jsdom-global');

// Required for `@testing-library/react render`.
jsdomGlobal();
