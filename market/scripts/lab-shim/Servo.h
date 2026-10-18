#pragma once
#include "Arduino.h"
/*
 * Servo on Timer1 like the real library: a 20 ms frame, each attached servo gets its pulse
 * in turn from a compare-match interrupt (0.5 µs ticks). Uses Timer1, so analogWrite on
 * D9/D10 stops working once a servo is attached — same as on a real Uno.
 */
#define MIN_PULSE_WIDTH 544
#define MAX_PULSE_WIDTH 2400
#define DEFAULT_PULSE_WIDTH 1500
#define __SERVO_MAX 8
#define __SERVO_FRAME_US 20000UL

static volatile uint8_t __servo_pins[__SERVO_MAX];
static volatile uint16_t __servo_ticks[__SERVO_MAX]; /* pulse length in 0.5 µs ticks */
static volatile uint8_t __servo_count = 0;
static volatile int8_t __servo_current = -1;

static inline void __servo_pin(uint8_t pin, uint8_t level) {
  volatile uint8_t *ddr, *port, *in;
  uint8_t b;
  if (!__pin_regs(pin, &ddr, &port, &in, &b)) return;
  if (level) *port |= (1 << b);
  else *port &= ~(1 << b);
}

/* Same scheme as the real library: each frame starts at TCNT1 = 0, every compare match ends
   one pulse and starts the next; after the last one we wait for the 20 ms frame to end. */
ISR(TIMER1_COMPA_vect) {
  if (__servo_current < 0) TCNT1 = 0;
  else if (__servo_current < (int8_t)__servo_count) __servo_pin(__servo_pins[__servo_current], LOW);
  __servo_current++;
  if (__servo_current < (int8_t)__servo_count) {
    OCR1A = TCNT1 + __servo_ticks[__servo_current];
    __servo_pin(__servo_pins[__servo_current], HIGH);
  } else {
    const uint16_t frame = (uint16_t)(__SERVO_FRAME_US * 2);
    OCR1A = (uint16_t)(TCNT1 + 8) < frame ? frame : TCNT1 + 8;
    __servo_current = -1;
  }
}

static inline void __servo_timer_start(void) {
  uint8_t s = SREG;
  cli();
  TCCR1A = 0;
  TCCR1B = (1 << CS11); /* /8 → 0.5 µs ticks, normal mode */
  TCNT1 = 0;
  OCR1A = 100;
  TIFR1 = (1 << OCF1A);
  TIMSK1 |= (1 << OCIE1A);
  SREG = s;
}

class Servo {
 public:
  uint8_t attach(int pin, int min = MIN_PULSE_WIDTH, int max = MAX_PULSE_WIDTH) {
    if (_index < 0) {
      if (__servo_count >= __SERVO_MAX) return 0;
      _index = __servo_count;
      __servo_pins[_index] = (uint8_t)pin;
      __servo_ticks[_index] = DEFAULT_PULSE_WIDTH * 2;
      __servo_count++;
    }
    _min = min;
    _max = max;
    pinMode(pin, OUTPUT);
    if (__servo_count == 1) __servo_timer_start();
    return (uint8_t)_index;
  }
  void detach() {}
  void write(int value) {
    if (value < MIN_PULSE_WIDTH) {
      value = constrain(value, 0, 180);
      value = (int)map(value, 0, 180, _min, _max);
    }
    writeMicroseconds(value);
  }
  void writeMicroseconds(int us) {
    if (_index < 0) return;
    us = constrain(us, _min, _max);
    uint8_t s = SREG;
    cli();
    __servo_ticks[_index] = (uint16_t)(us * 2);
    SREG = s;
  }
  int read() { return (int)map(readMicroseconds(), _min, _max, 0, 180); }
  int readMicroseconds() { return _index < 0 ? 0 : __servo_ticks[_index] / 2; }
  bool attached() { return _index >= 0; }

 private:
  int8_t _index = -1;
  int _min = MIN_PULSE_WIDTH;
  int _max = MAX_PULSE_WIDTH;
};
