#pragma once
#include "Arduino.h"
class Servo {
public:
  void attach(int pin) { _pin = pin; pinMode(pin, OUTPUT); }
  void write(int angle) {
    (void)angle;
    digitalWrite(_pin, HIGH);
    delayMicroseconds(1500);
    digitalWrite(_pin, LOW);
  }
private:
  int _pin = 9;
};
