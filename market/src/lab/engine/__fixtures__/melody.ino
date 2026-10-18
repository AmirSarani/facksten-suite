// the buzzer template's melody: tone(pin, f, 200) then 250 ms per note
int notes[] = {262, 294, 330, 349, 392, 440, 494, 523};
void setup() {}
void loop() {
  for (int i = 0; i < 8; i++) { tone(8, notes[i], 200); delay(250); }
  noTone(8);
  delay(1000);
}
