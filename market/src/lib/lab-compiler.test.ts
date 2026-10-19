import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compileSketch, hasFileEmbedding, hasUnsafeInclude, parseDiagnostics, readToolchain } from "./lab-compiler";

describe("lab compiler safety", () => {
  it("only allows bare header names", () => {
    assert.equal(hasUnsafeInclude("#include <Servo.h>\n#include \"Arduino.h\""), false);
    assert.equal(hasUnsafeInclude("#include \"/etc/passwd\""), true);
    assert.equal(hasUnsafeInclude("#include <../../secret.h>"), true);
    assert.equal(hasUnsafeInclude("#include <C:/Windows/win.ini>"), true);
    assert.equal(hasUnsafeInclude("#include MACRO"), true);
  });

  it("blocks assembler file embedding", () => {
    assert.equal(hasFileEmbedding('asm(".incbin \\"/etc/passwd\\"");'), true);
    assert.equal(hasFileEmbedding('__asm__(" .include \\"x.s\\"");'), true);
    assert.equal(hasFileEmbedding("#embed \"/etc/shadow\""), true);
    assert.equal(hasFileEmbedding("void loop() { digitalWrite(13, HIGH); }"), false);
  });

  it("rejects before reaching any compiler", async () => {
    const r = await compileSketch('asm(".incbin \\"/etc/passwd\\"");\nvoid setup(){}\nvoid loop(){}', "uno");
    assert.equal(r.ok, false);
    assert.equal(!r.ok && r.status, 422);
  });
});

describe("parseDiagnostics", () => {
  const out = [
    "C:\\Users\\x\\AppData\\Local\\Temp\\pushrsp-lab-abc\\sketch\\sketch.ino: In function 'void loop()':",
    "C:\\Users\\x\\AppData\\Local\\Temp\\pushrsp-lab-abc\\sketch\\sketch.ino:7:3: error: 'digitalWirte' was not declared in this scope",
    "/tmp/pushrsp-lab-xyz/sketch/sketch.ino:3:10: fatal error: Foo.h: No such file or directory",
    "/tmp/pushrsp-lab-xyz/sketch/sketch.ino:9:7: warning: unused variable 'x' [-Wunused-variable]",
    "/tmp/pushrsp-lab-xyz/sketch/sketch.ino:7:3: error: 'digitalWirte' was not declared in this scope",
  ].join("\n");

  it("maps compiler messages to sketch lines, once each", () => {
    const d = parseDiagnostics(out, /sketch\.ino/);
    assert.deepEqual(
      d.map((x) => [x.line, x.column, x.severity]),
      [
        [7, 3, "error"],
        [3, 10, "error"],
        [9, 7, "warning"],
      ],
    );
    assert.match(d[1].message, /Foo\.h: No such file/);
  });

  it("subtracts lines the compiler wrapper added", () => {
    const d = parseDiagnostics("/tmp/a/sketch.cpp:5:1: error: boom", /sketch\.cpp/, 1);
    assert.equal(d[0].line, 4);
  });
});

// Real compiles: only where a toolchain is installed (LAB_TOOLCHAIN_DIR, see scripts/lab-toolchain/setup.ts).
describe("arduino-cli backend", { skip: !readToolchain() && "LAB_TOOLCHAIN_DIR not set" }, () => {
  it("compiles a sketch using a real library", async () => {
    const r = await compileSketch("#include <Servo.h>\nServo s;\nvoid setup(){ s.attach(9); s.write(45); }\nvoid loop(){}\n", "uno");
    assert.ok(r.ok, !r.ok ? r.error : "");
    assert.equal(r.backend, "arduino-cli");
    assert.match(r.hex, /^:/);
  });

  it("points at the line of a typo", async () => {
    const r = await compileSketch("void setup() {}\n\nvoid loop() {\n  digitalWirte(13, HIGH);\n}\n", "uno");
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.diagnostics.find((d) => d.severity === "error")?.line, 4);
  });

  it("names the available libraries when one is missing", async () => {
    const r = await compileSketch("#include <NoSuchLib.h>\nvoid setup(){}\nvoid loop(){}\n", "uno");
    assert.equal(r.ok, false);
    if (!r.ok) assert.match(r.error, /NoSuchLib\.h.*Servo/);
  });

  it("serves a repeated compile from the cache", async () => {
    const code = "void setup(){ pinMode(13, OUTPUT); }\nvoid loop(){ digitalWrite(13, millis() % 1000 < 500); }\n";
    const first = await compileSketch(code, "uno");
    const again = await compileSketch(code, "uno");
    assert.ok(first.ok && again.ok && again.cached);
  });
});
