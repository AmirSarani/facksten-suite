import type { TemplateDef } from "../types";

const BLINK_CODE = `/*
  چشمک LED روی پایه ۱۳ (Blink)
  آزمایشگاه مجازی فکستن — واقعاً با avr8js اجرا می‌شود
*/
void setup() {
  pinMode(13, OUTPUT);
  Serial.begin(9600);
  Serial.println("Facksten Lab Blink");
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

const SERVO_CODE = `// سروو روی D9 — نیاز به کتابخانه Servo در سخت‌افزار واقعی
// در MVP فرم‌ویر پالس تقریبی کامپایل می‌شود
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
      version: 1,
      name: "چشمک LED",
      boardId: "arduino-uno",
      mode: "simple",
      code: BLINK_CODE,
      parts: [
        { instanceId: "uno1", componentId: "arduino-uno", x: 40, y: 40, rotation: 0 },
        { instanceId: "bb1", componentId: "breadboard", x: 300, y: 40, rotation: 0 },
        { instanceId: "r1", componentId: "resistor-220", x: 320, y: 220, rotation: 0 },
        { instanceId: "led1", componentId: "led-red", x: 420, y: 210, rotation: 0 },
      ],
      wires: [
        { id: "w1", from: { instanceId: "uno1", pinId: "d13" }, to: { instanceId: "r1", pinId: "a" }, color: "#3b82f6" },
        { id: "w2", from: { instanceId: "r1", pinId: "b" }, to: { instanceId: "led1", pinId: "anode" }, color: "#3b82f6" },
        { id: "w3", from: { instanceId: "led1", pinId: "cathode" }, to: { instanceId: "uno1", pinId: "gnd1" }, color: "#111111" },
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
      version: 1,
      name: "چراغ راهنمایی",
      boardId: "arduino-uno",
      mode: "simple",
      code: TRAFFIC_CODE,
      parts: [
        { instanceId: "uno1", componentId: "arduino-uno", x: 40, y: 40, rotation: 0 },
        { instanceId: "r1", componentId: "resistor-220", x: 300, y: 40, rotation: 0 },
        { instanceId: "r2", componentId: "resistor-220", x: 300, y: 100, rotation: 0 },
        { instanceId: "r3", componentId: "resistor-220", x: 300, y: 160, rotation: 0 },
        { instanceId: "led1", componentId: "led-red", x: 400, y: 30, rotation: 0 },
        { instanceId: "led2", componentId: "led-red", x: 400, y: 90, rotation: 0 },
        { instanceId: "led3", componentId: "led-red", x: 400, y: 150, rotation: 0 },
      ],
      wires: [
        { id: "w1", from: { instanceId: "uno1", pinId: "d11" }, to: { instanceId: "r1", pinId: "a" }, color: "#3b82f6" },
        { id: "w2", from: { instanceId: "r1", pinId: "b" }, to: { instanceId: "led1", pinId: "anode" }, color: "#3b82f6" },
        { id: "w3", from: { instanceId: "uno1", pinId: "d12" }, to: { instanceId: "r2", pinId: "a" }, color: "#22c55e" },
        { id: "w4", from: { instanceId: "r2", pinId: "b" }, to: { instanceId: "led2", pinId: "anode" }, color: "#22c55e" },
        { id: "w5", from: { instanceId: "uno1", pinId: "d13" }, to: { instanceId: "r3", pinId: "a" }, color: "#eab308" },
        { id: "w6", from: { instanceId: "r3", pinId: "b" }, to: { instanceId: "led3", pinId: "anode" }, color: "#eab308" },
        { id: "w7", from: { instanceId: "led1", pinId: "cathode" }, to: { instanceId: "uno1", pinId: "gnd1" }, color: "#111111" },
        { id: "w8", from: { instanceId: "led2", pinId: "cathode" }, to: { instanceId: "uno1", pinId: "gnd1" }, color: "#111111" },
        { id: "w9", from: { instanceId: "led3", pinId: "cathode" }, to: { instanceId: "uno1", pinId: "gnd1" }, color: "#111111" },
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
      version: 1,
      name: "دکمه و LED",
      boardId: "arduino-uno",
      mode: "simple",
      code: BUTTON_CODE,
      parts: [
        { instanceId: "uno1", componentId: "arduino-uno", x: 40, y: 40, rotation: 0 },
        { instanceId: "btn1", componentId: "button", x: 300, y: 40, rotation: 0 },
        { instanceId: "r1", componentId: "resistor-220", x: 300, y: 120, rotation: 0 },
        { instanceId: "led1", componentId: "led-red", x: 400, y: 110, rotation: 0 },
      ],
      wires: [
        { id: "w1", from: { instanceId: "uno1", pinId: "d2" }, to: { instanceId: "btn1", pinId: "a1" }, color: "#3b82f6" },
        { id: "w2", from: { instanceId: "btn1", pinId: "b1" }, to: { instanceId: "uno1", pinId: "gnd1" }, color: "#111111" },
        { id: "w3", from: { instanceId: "uno1", pinId: "d13" }, to: { instanceId: "r1", pinId: "a" }, color: "#3b82f6" },
        { id: "w4", from: { instanceId: "r1", pinId: "b" }, to: { instanceId: "led1", pinId: "anode" }, color: "#3b82f6" },
        { id: "w5", from: { instanceId: "led1", pinId: "cathode" }, to: { instanceId: "uno1", pinId: "gnd2" }, color: "#111111" },
      ],
    },
  },
  {
    id: "servo-sweep",
    name: "جاروب سروو",
    description: "سروو SG90 روی D9 — کد Arduino Servo؛ کامپایل کامل Servo در محدودیت‌ها مستند شده",
    difficulty: "medium",
    tags: ["servo", "pwm"],
    bom: [
      { componentId: "arduino-uno", qty: 1 },
      { componentId: "servo-sg90", qty: 1 },
    ],
    project: {
      version: 1,
      name: "جاروب سروو",
      boardId: "arduino-uno",
      mode: "pro",
      code: SERVO_CODE,
      parts: [
        { instanceId: "uno1", componentId: "arduino-uno", x: 40, y: 40, rotation: 0 },
        { instanceId: "srv1", componentId: "servo-sg90", x: 320, y: 80, rotation: 0 },
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
      version: 1,
      name: "فاصله‌سنج",
      boardId: "arduino-uno",
      mode: "pro",
      code: HCSR04_CODE,
      parts: [
        { instanceId: "uno1", componentId: "arduino-uno", x: 40, y: 40, rotation: 0 },
        { instanceId: "us1", componentId: "hc-sr04", x: 320, y: 60, rotation: 0 },
      ],
      wires: [
        { id: "w1", from: { instanceId: "uno1", pinId: "5v" }, to: { instanceId: "us1", pinId: "vcc" }, color: "#e11d48" },
        { id: "w2", from: { instanceId: "uno1", pinId: "gnd1" }, to: { instanceId: "us1", pinId: "gnd" }, color: "#111111" },
        { id: "w3", from: { instanceId: "uno1", pinId: "d9" }, to: { instanceId: "us1", pinId: "trig" }, color: "#3b82f6" },
        { id: "w4", from: { instanceId: "uno1", pinId: "d10" }, to: { instanceId: "us1", pinId: "echo" }, color: "#22c55e" },
      ],
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
    version: 1 as const,
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `t-${t.id}-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
}
