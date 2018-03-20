var assert = require("chai").assert;
var SGRParser = require("../dist/index").SGRParser;
var TokenType = require("../dist/index").TokenType; 


describe("SGRParser#tokenize", () => {
  it("must tokenize simple", () => {
    const input1 = "test";
    const parser = new SGRParser(true, true);
    const tokens = parser.tokenize(input1);
    assert.equal(tokens.length, 1);
  });

  it("must tokenize with escape", () => {
    const input1 = "\u001b[31mtest\u001b[0m";
    const parser = new SGRParser(true, true);
    const tokens = parser.tokenize(input1);
    assert.equal(tokens.length, 3);
    assert.equal(tokens[0].tokenType, TokenType.Escape);
    assert.equal(tokens[1].tokenType, TokenType.String);
    assert.equal(tokens[2].tokenType, TokenType.Escape);
    assert.deepEqual(tokens[0].options, [31]);
    assert.deepEqual(tokens[2].options, [0]);
    assert.deepEqual(tokens[0].code, 0x6d);
    assert.deepEqual(tokens[2].code, 0x6d);
    assert.equal(tokens[1].str, "test");
  });

  it("must tokenize with lf", () => {
    const input1 = "\u001b[31mtest\ntest\u001b[0m";
    const parser = new SGRParser(true, true);
    const tokens = parser.tokenize(input1);
    assert.equal(tokens.length, 3);
    assert.equal(tokens[0].tokenType, TokenType.Escape);
    assert.equal(tokens[1].tokenType, TokenType.String);
    assert.equal(tokens[2].tokenType, TokenType.Escape);
    assert.deepEqual(tokens[0].options, [31]);
    assert.deepEqual(tokens[2].options, [0]);
    assert.deepEqual(tokens[0].code, 0x6d);
    assert.deepEqual(tokens[2].code, 0x6d);
    assert.equal(tokens[1].str, "test\ntest");
  });

  it("must tokenize with crlf", () => {
    const input1 = "\u001b[31mtest\r\ntest\u001b[0m";
    const parser = new SGRParser(true, true);
    const tokens = parser.tokenize(input1);
    assert.equal(tokens.length, 5);
    assert.equal(tokens[0].tokenType, TokenType.Escape);
    assert.equal(tokens[1].tokenType, TokenType.String);
    assert.equal(tokens[2].tokenType, TokenType.Escape);
    assert.equal(tokens[3].tokenType, TokenType.String);
    assert.equal(tokens[4].tokenType, TokenType.Escape);
    assert.deepEqual(tokens[0].options, [31]);
    assert.deepEqual(tokens[2].options, [2]);
    assert.deepEqual(tokens[0].code, 0x6d);
    assert.deepEqual(tokens[2].code, 0x4b);
    assert.equal(tokens[1].str, "test");
    assert.equal(tokens[3].str, "\ntest");
  });
});

describe("SGRParser#parse", () => {
  it("must parse simple", () => {
    const input1 = "test";
    const parser = new SGRParser(true, true);
    const lines = parser.parse(input1);
    assert.equal(lines.length, 1);
    assert.equal(lines[0].str, "test");
    assert.equal(lines[0].classname, "");
    assert.equal(lines[0].newLine, false);
    assert.equal(lines[0].removeLine, false);
  });

  it("must parse with escape", () => {
    const input1 = "\u001b[31mtest\u001b[0m";
    const parser = new SGRParser(true, true);
    const lines = parser.parse(input1);
    assert.equal(lines.length, 1);
    assert.equal(lines[0].str, "test");
    assert.equal(lines[0].classname, "sgr-31-m");
    assert.equal(lines[0].newLine, false);
    assert.equal(lines[0].removeLine, false);
  });

  it("must parse with lf", () => {
    const input1 = "\u001b[31mtest\ntest\u001b[0m";
    const parser = new SGRParser(true, true);
    const lines = parser.parse(input1);
    assert.equal(lines.length, 2);
    assert.equal(lines[0].str, "test");
    assert.equal(lines[0].classname, "sgr-31-m");
    assert.equal(lines[0].newLine, false);
    assert.equal(lines[0].removeLine, false);
    assert.equal(lines[1].str, "test");
    assert.equal(lines[1].classname, "sgr-31-m");
    assert.equal(lines[1].newLine, true);
    assert.equal(lines[1].removeLine, false);
  });

  it("must parse with crlf", () => {
    const input1 = "\u001b[31mtest\rtest\u001b[0m";
    const parser = new SGRParser(true, true);
    const lines = parser.parse(input1);
    assert.equal(lines.length, 3);
    assert.equal(lines[0].str, "test");
    assert.equal(lines[0].classname, "sgr-31-m");
    assert.equal(lines[0].newLine, false);
    assert.equal(lines[0].removeLine, false);
    assert.equal(lines[1].removeLine, true);
    assert.equal(lines[2].str, "test");
    assert.equal(lines[2].classname, "sgr-31-m");
    assert.equal(lines[2].newLine, false);
    assert.equal(lines[2].removeLine, false);
  });
});

describe("Edge case", () => {
  it("must handle LF only", () => {
    const input1 = "\n";
    const input2 = "hoge";
    const parser = new SGRParser(true, true);
    const lines = parser.parse(input1).concat(parser.parse(input2));

    assert.equal(lines.length, 2);
    assert.equal(lines[0].str, "");
    assert.equal(lines[0].classname, "");
    assert.equal(lines[0].newLine, false);
    assert.equal(lines[0].removeLine, false);
    assert.equal(lines[1].str, "hoge");
    assert.equal(lines[1].classname, "");
    assert.equal(lines[1].newLine, true);
    assert.equal(lines[1].removeLine, false);
  });
  it("must handle LF only", () => {
    const input1 = "\n";
    const input2 = "\rhoge";
    const parser = new SGRParser(true, true);
    const lines = parser.parse(input1).concat(parser.parse(input2));

    assert.equal(lines.length, 3);
    assert.equal(lines[0].str, "");
    assert.equal(lines[0].classname, "");
    assert.equal(lines[0].newLine, false);
    assert.equal(lines[0].removeLine, false);
    assert.equal(lines[1].str, "");
    assert.equal(lines[1].classname, "");
    assert.equal(lines[1].newLine, true);
    assert.equal(lines[1].removeLine, false);
    assert.equal(lines[2].str, "hoge");
    assert.equal(lines[2].classname, "");
    assert.equal(lines[2].newLine, false);
    assert.equal(lines[2].removeLine, false);
  });
});