import type { TemplateDef } from "../types";
import { LAB_PROJECT_VERSION } from "../project/schema";

/*
 * Layout: Uno at (40,40); breadboard at (350,40). Breadboard holes are then at
 * x = 380 + 10·(column − 1), rows a–e at y 100–140, f–j at 170–210 (see BB in registry.ts).
 * Parts are positioned so their leads land in holes — they connect by being plugged in.
 */

const BLINK_CODE = `/*
  چشمک LED روی پایه ۱۳ (Blink)
  آزمایشگاه مجازی PushRSP — واقعاً با avr8js اجرا می‌شود
*/
void setup() {
  pinMode(13, OUTPUT);
  Serial.begin(9600);
  Serial.println("PushRSP Lab Blink");
}

void loop() {
  digitalWrite(13, HIGH);
  delay(500);
  digitalWrite(13, LOW);
  delay(500);
}
`;

const TRAFFIC_CODE = `// چراغ راهنمایی ساده روی D11/D12/D13
void setup() {
  pinMode(11, OUTPUT);
  pinMode(12, OUTPUT);
  pinMode(13, OUTPUT);
}
void loop() {
  digitalWrite(11, HIGH); digitalWrite(12, LOW); digitalWrite(13, LOW);
  delay(2000);
  digitalWrite(11, LOW); digitalWrite(12, HIGH);
  delay(500);
  digitalWrite(11, LOW); digitalWrite(12, LOW); digitalWrite(13, HIGH);
  delay(2000);
}
`;

const BUTTON_CODE = `// دکمه روی D2 (INPUT_PULLUP) و LED روی D13
void setup() {
  pinMode(13, OUTPUT);
  pinMode(2, INPUT_PULLUP);
}
void loop() {
  if (digitalRead(2) == LOW) {
    digitalWrite(13, HIGH);
  } else {
    digitalWrite(13, LOW);
  }
}
`;

const SERVO_CODE = `// سروو روی D9 — کتابخانه‌ی Servo پالس واقعی ۵۴۴ تا ۲۴۰۰ میکروثانیه می‌سازد
#include <Servo.h>
Servo s;
void setup() {
  s.attach(9);
}
void loop() {
  s.write(0);
  delay(1000);
  s.write(90);
  delay(1000);
  s.write(180);
  delay(1000);
}
`;

const HCSR04_CODE = `// HC-SR04: Trig=D9 Echo=D10 — خروجی سریال
const int trigPin = 9;
const int echoPin = 10;
void setup() {
  Serial.begin(9600);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
}
void loop() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  long duration = pulseIn(echoPin, HIGH);
  float distance = duration * 0.034 / 2;
  Serial.print("Distance cm: ");
  Serial.println(distance);
  delay(500);
}
`;

const FADE_CODE = `// محو شدن نرم LED با PWM روی D9 (analogWrite)
void setup() {
  pinMode(9, OUTPUT);
}

void loop() {
  for (int v = 0; v <= 255; v += 5) {
    analogWrite(9, v);
    delay(20);
  }
  for (int v = 255; v >= 0; v -= 5) {
    analogWrite(9, v);
    delay(20);
  }
}
`;

const DIMMER_CODE = `// ولوم روی A0 نور LED روی D9 را تنظیم می‌کند
// در حین اجرا ولوم را روی میز کار بالا/پایین بکشید
void setup() {
  Serial.begin(9600);
  pinMode(9, OUTPUT);
}

void loop() {
  int raw = analogRead(A0);          // 0..1023
  analogWrite(9, raw / 4);           // 0..255
  Serial.print("A0 = ");
  Serial.println(raw);
  delay(100);
}
`;

const MELODY_CODE = `// ملودی با tone() روی بازر D8
int notes[] = {262, 294, 330, 349, 392, 440, 494, 523};

void setup() {}

void loop() {
  for (int i = 0; i < 8; i++) {
    tone(8, notes[i], 200);
    delay(250);
  }
  noTone(8);
  delay(1000);
}
`;

const ECHO_CODE = `// هر چه در Serial Monitor بفرستید، برمی‌گردد
void setup() {
  Serial.begin(9600);
  Serial.println("Send me something:");
}

void loop() {
  if (Serial.available()) {
    char c = Serial.read();
    Serial.print("got: ");
    Serial.println(c);
  }
}
`;

export const LAB_TEMPLATES: TemplateDef[] = [
  {
    id: "blink-led",
    name: "چشمک LED (Blink)",
    description: "کلاسیک Arduino — LED روی D13 با مقاومت ۲۲۰Ω واقعاً با avr8js چشمک می‌زند",
    difficulty: "easy",
    tags: ["led", "blink", "beginner"],
    firmwareHex: "/lab/firmware/blink.hex",
    bom: [
      { componentId: "arduino-uno", qty: 1 },
      { componentId: "led-red", qty: 1 },
      { componentId: "resistor-220", qty: 1 },
      { componentId: "breadboard", qty: 1 },
    ],
    project: {
      version: LAB_PROJECT_VERSION,
      name: "چشمک LED",
      boardId: "arduino-uno",
      mode: "simple",
      code: BLINK_CODE,
      // LED in c10 (cathode) / c11 (anode); 220Ω from e11 to e15; D13 → a15; GND → d10.
      parts: [
        { instanceId: "uno1", componentId: "arduino-uno", x: 40, y: 40, rotation: 0 },
        { instanceId: "bb1", componentId: "breadboard", x: 350, y: 40, rotation: 0 },
        { instanceId: "led1", componentId: "led-red", x: 460, y: 100, rotation: 0 },
        { instanceId: "r1", componentId: "resistor-220", x: 470, y: 130, rotation: 0 },
      ],
      wires: [
        { id: "w1", from: { instanceId: "uno1", pinId: "d13" }, to: { instanceId: "bb1", pinId: "a15" }, color: "#3b82f6" },
        { id: "w2", from: { instanceId: "uno1", pinId: "gnd3" }, to: { instanceId: "bb1", pinId: "d10" }, color: "#111111" },
      ],
    },
  },
  {
    id: "traffic-light",
    name: "چراغ راهنمایی",
    description: "سه LED روی پایه‌های ۱۱/۱۲/۱۳ با توالی قرمز-زرد-سبز",
    difficulty: "easy",
    tags: ["led", "timing"],
    firmwareHex: "/lab/firmware/blink.hex",
    bom: [
      { componentId: "arduino-uno", qty: 1 },
      { componentId: "led-red", qty: 3 },
      { componentId: "resistor-220", qty: 3 },
    ],
    project: {
      version: LAB_PROJECT_VERSION,
      name: "چراغ راهنمایی",
      boardId: "arduino-uno",
      mode: "simple",
      code: TRAFFIC_CODE,
      // Three copies of the Blink layout at columns 10, 20 and 30; GND through the top − rail.
      parts: [
        { instanceId: "uno1", componentId: "arduino-uno", x: 40, y: 40, rotation: 0 },
        { instanceId: "bb1", componentId: "breadboard", x: 350, y: 40, rotation: 0 },
        { instanceId: "led1", componentId: "led-red", x: 460, y: 100, rotation: 0 },
        { instanceId: "r1", componentId: "resistor-220", x: 470, y: 130, rotation: 0 },
        { instanceId: "led2", componentId: "led-red", x: 560, y: 100, rotation: 0 },
        { instanceId: "r2", componentId: "resistor-220", x: 570, y: 130, rotation: 0 },
        { instanceId: "led3", componentId: "led-red", x: 660, y: 100, rotation: 0 },
        { instanceId: "r3", componentId: "resistor-220", x: 670, y: 130, rotation: 0 },
      ],
      wires: [
        { id: "w1", from: { instanceId: "uno1", pinId: "d11" }, to: { instanceId: "bb1", pinId: "a15" }, color: "#3b82f6" },
        { id: "w2", from: { instanceId: "uno1", pinId: "d12" }, to: { instanceId: "bb1", pinId: "a25" }, color: "#22c55e" },
        { id: "w3", from: { instanceId: "uno1", pinId: "d13" }, to: { instanceId: "bb1", pinId: "a35" }, color: "#eab308" },
        { id: "w4", from: { instanceId: "uno1", pinId: "gnd3" }, to: { instanceId: "bb1", pinId: "tn1" }, color: "#111111" },
        { id: "w5", from: { instanceId: "bb1", pinId: "tn6" }, to: { instanceId: "bb1", pinId: "d10" }, color: "#111111" },
        { id: "w6", from: { instanceId: "bb1", pinId: "tn15" }, to: { instanceId: "bb1", pinId: "d20" }, color: "#111111" },
        { id: "w7", from: { instanceId: "bb1", pinId: "tn23" }, to: { instanceId: "bb1", pinId: "d30" }, color: "#111111" },
      ],
    },
  },
  {
    id: "button-led",
    name: "دکمه + LED",
    description: "با فشردن دکمه (پول‌آپ داخلی) LED روشن می‌شود",
    difficulty: "easy",
    tags: ["button", "input"],
    firmwareHex: "/lab/firmware/blink.hex",
    bom: [
      { componentId: "arduino-uno", qty: 1 },
      { componentId: "button", qty: 1 },
      { componentId: "led-red", qty: 1 },
      { componentId: "resistor-220", qty: 1 },
    ],
    project: {
      version: LAB_PROJECT_VERSION,
      name: "دکمه و LED",
      boardId: "arduino-uno",
      mode: "simple",
      code: BUTTON_CODE,
      // Blink LED at column 10; the button straddles the trench at columns 40 and 43.
      parts: [
        { instanceId: "uno1", componentId: "arduino-uno", x: 40, y: 40, rotation: 0 },
        { instanceId: "bb1", componentId: "breadboard", x: 350, y: 40, rotation: 0 },
        { instanceId: "led1", componentId: "led-red", x: 460, y: 100, rotation: 0 },
        { instanceId: "r1", componentId: "resistor-220", x: 470, y: 130, rotation: 0 },
        { instanceId: "btn1", componentId: "button", x: 760, y: 130, rotation: 0 },
      ],
      wires: [
        { id: "w1", from: { instanceId: "uno1", pinId: "d13" }, to: { instanceId: "bb1", pinId: "a15" }, color: "#3b82f6" },
        { id: "w2", from: { instanceId: "uno1", pinId: "gnd3" }, to: { instanceId: "bb1", pinId: "d10" }, color: "#111111" },
        { id: "w3", from: { instanceId: "uno1", pinId: "d2" }, to: { instanceId: "bb1", pinId: "a40" }, color: "#22c55e" },
        { id: "w4", from: { instanceId: "uno1", pinId: "gnd1" }, to: { instanceId: "bb1", pinId: "j43" }, color: "#111111" },
      ],
    },
  },
  {
    id: "servo-sweep",
    name: "جاروب سروو",
    description: "سروو SG90 روی D9 — بوق سروو روی میز کار با پالس واقعی می‌چرخد",
    difficulty: "medium",
    tags: ["servo", "pwm"],
    bom: [
      { componentId: "arduino-uno", qty: 1 },
      { componentId: "servo-sg90", qty: 1 },
    ],
    project: {
      version: LAB_PROJECT_VERSION,
      name: "جاروب سروو",
      boardId: "arduino-uno",
      mode: "pro",
      code: SERVO_CODE,
      parts: [
        { instanceId: "uno1", componentId: "arduino-uno", x: 40, y: 40, rotation: 0 },
        { instanceId: "srv1", componentId: "servo-sg90", x: 380, y: 120, rotation: 0 },
      ],
      wires: [
        { id: "w1", from: { instanceId: "uno1", pinId: "d9" }, to: { instanceId: "srv1", pinId: "sig" }, color: "#eab308" },
        { id: "w2", from: { instanceId: "uno1", pinId: "5v" }, to: { instanceId: "srv1", pinId: "vcc" }, color: "#e11d48" },
        { id: "w3", from: { instanceId: "uno1", pinId: "gnd1" }, to: { instanceId: "srv1", pinId: "gnd" }, color: "#111111" },
      ],
    },
  },
  {
    id: "hcsr04-distance",
    name: "فاصله‌سنج HC-SR04",
    description: "اندازه‌گیری فاصله و چاپ روی Serial Monitor",
    difficulty: "medium",
    tags: ["ultrasonic", "serial"],
    bom: [
      { componentId: "arduino-uno", qty: 1 },
      { componentId: "hc-sr04", qty: 1 },
    ],
    project: {
      version: LAB_PROJECT_VERSION,
      name: "فاصله‌سنج",
      boardId: "arduino-uno",
      mode: "pro",
      code: HCSR04_CODE,
      parts: [
        { instanceId: "uno1", componentId: "arduino-uno", x: 40, y: 40, rotation: 0 },
        { instanceId: "us1", componentId: "hc-sr04", x: 380, y: 100, rotation: 0 },
      ],
      wires: [
        { id: "w1", from: { instanceId: "uno1", pinId: "5v" }, to: { instanceId: "us1", pinId: "vcc" }, color: "#e11d48" },
        { id: "w2", from: { instanceId: "uno1", pinId: "gnd1" }, to: { instanceId: "us1", pinId: "gnd" }, color: "#111111" },
        { id: "w3", from: { instanceId: "uno1", pinId: "d9" }, to: { instanceId: "us1", pinId: "trig" }, color: "#3b82f6" },
        { id: "w4", from: { instanceId: "uno1", pinId: "d10" }, to: { instanceId: "us1", pinId: "echo" }, color: "#22c55e" },
      ],
    },
  },
  {
    id: "fade-pwm",
    name: "محو شدن LED (PWM)",
    description: "analogWrite روی D9 — روشنایی LED نرم بالا و پایین می‌رود",
    difficulty: "easy",
    tags: ["led", "pwm"],
    bom: [
      { componentId: "arduino-uno", qty: 1 },
      { componentId: "led-red", qty: 1 },
      { componentId: "resistor-220", qty: 1 },
      { componentId: "breadboard", qty: 1 },
    ],
    project: {
      version: LAB_PROJECT_VERSION,
      name: "محو شدن LED",
      boardId: "arduino-uno",
      mode: "simple",
      code: FADE_CODE,
      // Blink layout, fed from the PWM pin D9
      parts: [
        { instanceId: "uno1", componentId: "arduino-uno", x: 40, y: 40, rotation: 0 },
        { instanceId: "bb1", componentId: "breadboard", x: 350, y: 40, rotation: 0 },
        { instanceId: "led1", componentId: "led-red", x: 460, y: 100, rotation: 0 },
        { instanceId: "r1", componentId: "resistor-220", x: 470, y: 130, rotation: 0 },
      ],
      wires: [
        { id: "w1", from: { instanceId: "uno1", pinId: "d9" }, to: { instanceId: "bb1", pinId: "a15" }, color: "#f97316" },
        { id: "w2", from: { instanceId: "uno1", pinId: "gnd3" }, to: { instanceId: "bb1", pinId: "d10" }, color: "#111111" },
      ],
    },
  },
  {
    id: "pot-dimmer",
    name: "دیمر با ولوم",
    description: "analogRead از ولوم روی A0 و analogWrite روی LED — ولوم را حین اجرا بچرخانید",
    difficulty: "easy",
    tags: ["analog", "pwm", "potentiometer"],
    bom: [
      { componentId: "arduino-uno", qty: 1 },
      { componentId: "potentiometer", qty: 1 },
      { componentId: "led-red", qty: 1 },
      { componentId: "resistor-220", qty: 1 },
      { componentId: "breadboard", qty: 1 },
    ],
    project: {
      version: LAB_PROJECT_VERSION,
      name: "دیمر با ولوم",
      boardId: "arduino-uno",
      mode: "simple",
      code: DIMMER_CODE,
      // LED as in Blink (on D9); potentiometer legs in j50/j51/j52
      parts: [
        { instanceId: "uno1", componentId: "arduino-uno", x: 40, y: 40, rotation: 0 },
        { instanceId: "bb1", componentId: "breadboard", x: 350, y: 40, rotation: 0 },
        { instanceId: "led1", componentId: "led-red", x: 460, y: 100, rotation: 0 },
        { instanceId: "r1", componentId: "resistor-220", x: 470, y: 130, rotation: 0 },
        { instanceId: "pot1", componentId: "potentiometer", x: 860, y: 160, rotation: 0 },
      ],
      wires: [
        { id: "w1", from: { instanceId: "uno1", pinId: "d9" }, to: { instanceId: "bb1", pinId: "a15" }, color: "#f97316" },
        { id: "w2", from: { instanceId: "uno1", pinId: "gnd3" }, to: { instanceId: "bb1", pinId: "d10" }, color: "#111111" },
        { id: "w3", from: { instanceId: "uno1", pinId: "5v" }, to: { instanceId: "bb1", pinId: "f50" }, color: "#e11d48" },
        { id: "w4", from: { instanceId: "uno1", pinId: "a0" }, to: { instanceId: "bb1", pinId: "f51" }, color: "#22c55e" },
        { id: "w5", from: { instanceId: "uno1", pinId: "gnd2" }, to: { instanceId: "bb1", pinId: "f52" }, color: "#111111" },
      ],
    },
  },
  {
    id: "buzzer-melody",
    name: "ملودی با بازر",
    description: "tone() روی D8 — صدای واقعی از بلندگوی کامپیوتر پخش می‌شود",
    difficulty: "easy",
    tags: ["buzzer", "tone", "sound"],
    bom: [
      { componentId: "arduino-uno", qty: 1 },
      { componentId: "buzzer", qty: 1 },
      { componentId: "breadboard", qty: 1 },
    ],
    project: {
      version: LAB_PROJECT_VERSION,
      name: "ملودی با بازر",
      boardId: "arduino-uno",
      mode: "simple",
      code: MELODY_CODE,
      // buzzer legs in e20 (+) and e23 (−)
      parts: [
        { instanceId: "uno1", componentId: "arduino-uno", x: 40, y: 40, rotation: 0 },
        { instanceId: "bb1", componentId: "breadboard", x: 350, y: 40, rotation: 0 },
        { instanceId: "bz1", componentId: "buzzer", x: 560, y: 100, rotation: 0 },
      ],
      wires: [
        { id: "w1", from: { instanceId: "uno1", pinId: "d8" }, to: { instanceId: "bb1", pinId: "a20" }, color: "#3b82f6" },
        { id: "w2", from: { instanceId: "uno1", pinId: "gnd3" }, to: { instanceId: "bb1", pinId: "a23" }, color: "#111111" },
      ],
    },
  },
  {
    id: "serial-echo",
    name: "پژواک سریال",
    description: "Serial.read — هر چه در Serial Monitor بفرستید، برد پاسخ می‌دهد",
    difficulty: "easy",
    tags: ["serial"],
    bom: [{ componentId: "arduino-uno", qty: 1 }],
    project: {
      version: LAB_PROJECT_VERSION,
      name: "پژواک سریال",
      boardId: "arduino-uno",
      mode: "simple",
      code: ECHO_CODE,
      parts: [{ instanceId: "uno1", componentId: "arduino-uno", x: 40, y: 40, rotation: 0 }],
      wires: [],
    },
  },
];

export function getTemplate(id: string): TemplateDef | undefined {
  return LAB_TEMPLATES.find((t) => t.id === id);
}

export function templateToProject(t: TemplateDef) {
  const now = new Date().toISOString();
  return {
    ...t.project,
    version: LAB_PROJECT_VERSION,
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `t-${t.id}-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
}
