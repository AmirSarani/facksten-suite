#pragma once
#include <avr/io.h>
#include <avr/interrupt.h>
#include <util/delay.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

#ifdef __cplusplus
extern "C" {
#endif

#define HIGH 0x1
#define LOW  0x0
#define INPUT 0x0
#define OUTPUT 0x1
#define INPUT_PULLUP 0x2
#define LED_BUILTIN 13

static inline void pinMode(uint8_t pin, uint8_t mode) {
  volatile uint8_t *ddr, *port;
  uint8_t bit;
  if (pin <= 7) { ddr = &DDRD; port = &PORTD; bit = pin; }
  else if (pin <= 13) { ddr = &DDRB; port = &PORTB; bit = pin - 8; }
  else if (pin >= 14 && pin <= 19) { ddr = &DDRC; port = &PORTC; bit = pin - 14; }
  else return;
  if (mode == OUTPUT) *ddr |= (1 << bit);
  else {
    *ddr &= ~(1 << bit);
    if (mode == INPUT_PULLUP) *port |= (1 << bit);
    else *port &= ~(1 << bit);
  }
}

static inline void digitalWrite(uint8_t pin, uint8_t val) {
  volatile uint8_t *port;
  uint8_t bit;
  if (pin <= 7) { port = &PORTD; bit = pin; }
  else if (pin <= 13) { port = &PORTB; bit = pin - 8; }
  else if (pin >= 14 && pin <= 19) { port = &PORTC; bit = pin - 14; }
  else return;
  if (val) *port |= (1 << bit); else *port &= ~(1 << bit);
}

static inline int digitalRead(uint8_t pin) {
  volatile uint8_t *pinreg;
  uint8_t bit;
  if (pin <= 7) { pinreg = &PIND; bit = pin; }
  else if (pin <= 13) { pinreg = &PINB; bit = pin - 8; }
  else if (pin >= 14 && pin <= 19) { pinreg = &PINC; bit = pin - 14; }
  else return LOW;
  return (*pinreg & (1 << bit)) ? HIGH : LOW;
}

static inline void delay(unsigned long ms) {
  while (ms--) _delay_ms(1);
}

static inline void delayMicroseconds(unsigned int us) {
  while (us--) _delay_us(1);
}

static inline unsigned long pulseIn(uint8_t pin, uint8_t state) {
  (void)pin; (void)state;
  return 580; /* ~10cm stub so sketches that call pulseIn still link */
}

typedef struct {
  void (*begin)(unsigned long);
  void (*print)(const char*);
  void (*println)(const char*);
  void (*print_i)(int);
  void (*println_i)(int);
  void (*println_f)(double);
} Serial_t;

/* Minimal USART0 TX at 9600 @ 16MHz */
static inline void _serial_begin(unsigned long baud) {
  uint16_t ubrr = (F_CPU / 16 / baud) - 1;
  UBRR0H = (uint8_t)(ubrr >> 8);
  UBRR0L = (uint8_t)ubrr;
  UCSR0B = (1 << TXEN0);
  UCSR0C = (1 << UCSZ01) | (1 << UCSZ00);
}
static inline void _serial_write(char c) {
  while (!(UCSR0A & (1 << UDRE0)));
  UDR0 = c;
}
static inline void _serial_print(const char *s) { while (*s) _serial_write(*s++); }
static inline void _serial_println(const char *s) { _serial_print(s); _serial_write('\r'); _serial_write('\n'); }
static inline void _serial_print_i(int v) {
  char buf[16];
  snprintf(buf, sizeof(buf), "%d", v);
  _serial_print(buf);
}
static inline void _serial_println_i(int v) { _serial_print_i(v); _serial_write('\r'); _serial_write('\n'); }
static inline void _serial_println_f(double v) {
  char buf[24];
  int whole = (int)v;
  int frac = (int)((v - whole) * 100);
  if (frac < 0) frac = -frac;
  snprintf(buf, sizeof(buf), "%d.%02d", whole, frac);
  _serial_println(buf);
}

#ifdef __cplusplus
}

struct HardwareSerial {
  void begin(unsigned long b) { _serial_begin(b); }
  void print(const char *s) { _serial_print(s); }
  void println(const char *s) { _serial_println(s); }
  void print(int v) { _serial_print_i(v); }
  void println(int v) { _serial_println_i(v); }
  void println(double v) { _serial_println_f(v); }
  void println(float v) { _serial_println_f(v); }
  void print(double v) {
    char buf[24];
    int whole = (int)v;
    int frac = (int)((v - whole) * 100);
    if (frac < 0) frac = -frac;
    snprintf(buf, sizeof(buf), "%d.%02d", whole, frac);
    _serial_print(buf);
  }
};
static HardwareSerial Serial;
#endif
