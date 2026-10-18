// D2 with pull-up mirrored on D13; serial echo; 'a' prints analogRead(A0)
void setup() { Serial.begin(9600); pinMode(2, INPUT_PULLUP); pinMode(13, OUTPUT); }
void loop() {
  digitalWrite(13, digitalRead(2) == LOW ? HIGH : LOW);
  if (Serial.available()) {
    int c = Serial.read();
    if (c == 'a') { Serial.print("A0="); Serial.println(analogRead(A0)); }
    else Serial.write((uint8_t)c);
  }
}
