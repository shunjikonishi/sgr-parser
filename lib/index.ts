const CODE_LF   = 0x0a;
const CODE_CR   = 0x0d;
const CODE_ESC  = 0x1b;
const CODE_0    = 0x30;
const CODE_9    = 0x39;
const CODE_SEMI = 0x3b;
const CODE_A    = 0x41;
const CODE_K    = 0x4b;
const CODE_S    = 0x53;
const CODE_f    = 0x66;
const CODE_m    = 0x6d;

function isValidEscapeChar(c: number) {
  // A-H
  if (c >= CODE_A && c <= CODE_A + 7) return true;
  // J,K
  if (c === CODE_A + 9 || c === CODE_A + 10) return true;
  // S,T
  if (c === CODE_S || c === CODE_S + 1) return true;
  // f,m
  if (c === CODE_f || c == CODE_m) return true;

  return false;
}

export enum TokenType {
  Escape,
  String,
  Error
}

enum TokenState {
  Normal,
  Escape
}

export interface IToken {
  tokenType: TokenType;
}

export class EscapeToken implements IToken {
  constructor(private _options: Array<number>, private _code: number) {}

  public get tokenType(): TokenType { return TokenType.Escape; }
  public get options(): Array<number> { return this._options; }
  public get code(): number { return this._code; }
}

export class StringToken implements IToken {

  constructor(private _str: string) {}

  public get tokenType(): TokenType { return TokenType.String; }
  public get str(): string { return this._str; }
}

export class ErrorToken implements IToken {

  constructor(private _str: string) {}

  public get tokenType(): TokenType { return TokenType.Error; }
  public get str(): string { return this._str; }
}

export class Line {
  constructor(
    private _str: string, 
    private _classname: string, 
    private _newLine: boolean, 
    private _removeLine: boolean
  ) {}

  public get str(): string { return this._str; }
  public get classname(): string { return this._classname; }
  public get newLine(): boolean { return this._newLine; }
  public get removeLine(): boolean { return this._removeLine; }

}


export class SGRParser {
  private classes: Array<string> = [];
  private state: TokenState = TokenState.Normal;
  private options: Array<number> = [];

  constructor(private keepState: boolean, private handleCR: boolean) {}

  parse(line: string): Array<Line> {
    var newLine = false;
    const ret: Array<Line> = [];
    this.tokenize(line).forEach(token => {
      switch(token.tokenType) {
        case TokenType.String:
        case TokenType.Error:
          let nextNewLine = false;
          const lines = (token as StringToken).str.split("\n");
          if (lines.length > 1 && lines[lines.length - 1].length === 0) {
            lines.pop();
            nextNewLine = true;
          }
          lines.forEach((str, index) => {
            ret.push(new Line(str, this.classes.join(" "), newLine, false));
            newLine = true;
          });
          newLine = nextNewLine;
          break;
        case TokenType.Escape:
          const escapeToken = token as EscapeToken;
          switch (escapeToken.code) {
            case CODE_K:
              if (escapeToken.options.length === 1 && escapeToken.options[0] === 2) {
                ret.push(new Line("", "", false, true));
              }
              break;
            case CODE_m:
              if (escapeToken.options.length > 0) {
                switch (escapeToken.options[0]) {
                  case 0:
                    this.classes = [];
                    break;
                  case 39:
                    this.classes = this.classes.filter(v => {
                      return v.indexOf("sgr-3") === 0 && v !== "sgr-3-m";
                    });
                    break;
                  case 49:
                    this.classes = this.classes.filter(v => {
                      return v.indexOf("sgr-4") === 0 && v !== "sgr-4-m";
                    });
                    break;
                  default:
                    escapeToken.options.forEach(n => {
                      this.classes.push(`sgr-${n}-m`);
                    });
                    break;
                }
              }
              break;
          }
          break;
      }
    });
    return ret;
  }

  tokenize(line: string): Array<IToken> {
    if (!line || line.length === 0) {
      return [];
    }
    var state = this.state;
    var options: Array<number> = this.options.concat([]);
    var index = 0;
    var spos = 0;
    const ret = [];
    while (index < line.length) {
      const c = line.charCodeAt(index++);
      switch (state) {
        case TokenState.Normal:
          switch(c) {
            case CODE_ESC:
              if (spos !== index - 1) {
                ret.push(new StringToken(line.substring(spos, index - 1)));
              }
              if (line.charAt(index) === '[') {
                index++;
                state = TokenState.Escape;
                options = [];
              } else {
                ret.push(new ErrorToken(""));
                spos = index;
              }
              break;
            case CODE_CR:
              if (this.handleCR) {
                if (spos !== index - 1) {
                  ret.push(new StringToken(line.substring(spos, index - 1)));
                }
                ret.push(new EscapeToken([2], CODE_K));
                spos = index;
              }
              break;
            default:
              break;
          }
          break;
        case TokenState.Escape:
          if (c >= 0x30 && c <= 0x39) {
            if (options.length === 0) {
              options.push(c - 0x30);
            } else {
              const n = options[options.length - 1];
              if (n === -1) {
                options[options.length - 1] = c - 0x30;
              } else {
                options[options.length - 1] = n * 10 + (c - 0x30);
              }
            }
          } else if (c === CODE_SEMI) {
            if (options.length === 0) {
              ret.push(new ErrorToken("[;"));
              state = TokenState.Normal;
            } else {
              options.push(-1);
            }
          } else if (isValidEscapeChar(c)) {
            ret.push(new EscapeToken(options.filter(n => n >= 0), c));
            state = TokenState.Normal;
          } else {
            ret.push(new ErrorToken("[" + options.filter(n => n >= 0).join(";") + line.charAt(index - 1)));
            state = TokenState.Normal;
          }
          if (state === TokenState.Normal) {
            spos = index;
          }
          break;
      }
    }
    if (state === TokenState.Normal && spos < line.length) {
      ret.push(new StringToken(line.substring(spos, line.length)));
    } else if (!this.keepState) {
      ret.push(new ErrorToken("[" + options.filter(n => n >= 0).join(";")));
    }
    if (this.keepState) {
      this.state = state;
      this.options = options;
    }
    return ret;
  }
}