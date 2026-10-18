// D13 toggles every 500 ms through delay() → checks millis()/Timer0 timing
void setup() { pinMode(13, OUTPUT); }
void loop() { digitalWrite(13, HIGH); delay(500); digitalWrite(13, LOW); delay(500); }
