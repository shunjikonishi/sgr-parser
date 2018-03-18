# sgr-parser
Parse console output which includes escape sequence.

## Install
```
npm install sgr-parser
```

## How to use
SGRParser takes two constructor parameters.

- `keepState`: Keep previous state while continuous parsing.
- `handleCR` : Deal CR(0x0d) code as `ESC[2K`(Remove current line.)

SGRParser has following two methods.

- tokenize(str: string): Array<IToken>;
  - It returns 3 kind of Token(StringToken, EscapeToken, ErrorToken)
  - StringToken has `str` property. It holds tokenized string.
  - EscapeToken has `options` property and `code` property. options is array of number. code is code of key.
  - ErrorToken means invalid EscapeSequence. It is almost same as StringToken.
- parse(str)
  - It returns Array of Line object.
  - Line object has following four properties.
  - `str`: string
  - `classname`: It holds sgr classname. (e.g. `sgr-33-m`)
  - `newLine`: `true` means LF exists before this string.
  - `removeLine`: If the escape sequence `ESC[2K` exists, it will be `Line("", "", false, true)`.
  - Other escapes except `ESC[[n]m` will be ignored.

```
var SGRParser = require("sgr-parser");

var input = "\u001b[31mtest\u001b[0m";
var lines = new SGRParser(true, true).parse(input); // [Line("test", "sgr-31-m", false, false)]
```
