#pragma once
/*
 * PushRSP Lab mini Arduino core for ATmega328P @ 16 MHz (single translation unit).
 * Mirrors the real core where it matters for simulation: Timer0 drives millis()/micros()
 * and PWM on D5/D6, Timer1 PWM on D9/D10 (or Servo), Timer2 PWM on D3/D11 (or tone()),
 * ADC with AVcc reference, interrupt-driven Serial RX/TX polling.
 * The compile route calls __lab_init() before setup().
 */
#include <avr/io.h>
#include <avr/interrupt.h>
#include <util/delay.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define HIGH 0x1
#define LOW 0x0
#define INPUT 0x0
#define OUTPUT 0x1
#define INPUT_PULLUP 0x2
#define LED_BUILTIN 13
#define A0 14
#define A1 15
#define A2 16
#define A3 17
#define A4 18
#define A5 19
#define DEC 10
#define HEX 16
#define BIN 2
#define OCT 8
#define PI 3.1415926535897932384626433832795
#define bitRead(v, b) (((v) >> (b)) & 0x01)
#define bitSet(v, b) ((v) |= (1UL << (b)))
#define bitClear(v, b) ((v) &= ~(1UL << (b)))
#define bitWrite(v, b, x) ((x) ? bitSet(v, b) : bitClear(v, b))
#define bit(b) (1UL << (b))
#define lowByte(w) ((uint8_t)((w) & 0xff))
#define highByte(w) ((uint8_t)((w) >> 8))

typedef uint8_t byte;
typedef bool boolean;

/* ---------- pins ---------- */
static inline bool __pin_regs(uint8_t pin, volatile uint8_t **ddr, volatile uint8_t **port, volatile uint8_t **in, uint8_t *bit) {
  if (pin <= 7) { *ddr = &DDRD; *port = &PORTD; *in = &PIND; *bit = pin; return true; }
  if (pin <= 13) { *ddr = &DDRB; *port = &PORTB; *in = &PINB; *bit = pin - 8; return true; }
  if (pin <= 19) { *ddr = &DDRC; *port = &PORTC; *in = &PINC; *bit = pin - 14; return true; }
  return false;
}

/* Disconnect a pin from its PWM output compare unit (as the real core does). */
static inline void __pwm_off(uint8_t pin) {
  switch (pin) {
    case 3: TCCR2A &= ~(1 << COM2B1); break;
    case 5: TCCR0A &= ~(1 << COM0B1); break;
    case 6: TCCR0A &= ~(1 << COM0A1); break;
    case 9: TCCR1A &= ~(1 << COM1A1); break;
    case 10: TCCR1A &= ~(1 << COM1B1); break;
    case 11: TCCR2A &= ~(1 << COM2A1); break;
  }
}

static inline void pinMode(uint8_t pin, uint8_t mode) {
  volatile uint8_t *ddr, *port, *in;
  uint8_t b;
  if (!__pin_regs(pin, &ddr, &port, &in, &b)) return;
  uint8_t s = SREG;
  cli();
  if (mode == OUTPUT) {
    *ddr |= (1 << b);
  } else {
    *ddr &= ~(1 << b);
    if (mode == INPUT_PULLUP) *port |= (1 << b);
    else *port &= ~(1 << b);
  }
  SREG = s;
}

static inline void digitalWrite(uint8_t pin, uint8_t val) {
  volatile uint8_t *ddr, *port, *in;
  uint8_t b;
  if (!__pin_regs(pin, &ddr, &port, &in, &b)) return;
  __pwm_off(pin);
  uint8_t s = SREG;
  cli();
  if (val) *port |= (1 << b);
  else *port &= ~(1 << b);
  SREG = s;
}

static inline int digitalRead(uint8_t pin) {
  volatile uint8_t *ddr, *port, *in;
  uint8_t b;
  if (!__pin_regs(pin, &ddr, &port, &in, &b)) return LOW;
  __pwm_off(pin);
  return (*in & (1 << b)) ? HIGH : LOW;
}

/* ---------- time (Timer0, /64, overflow every 1024 µs) ---------- */
static volatile unsigned long __t0_overflows = 0;
static volatile unsigned long __t0_millis = 0;
static volatile uint8_t __t0_fract = 0;

ISR(TIMER0_OVF_vect) {
  unsigned long m = __t0_millis;
  uint8_t f = __t0_fract;
  m += 1;
  f += 3; /* 1024 µs = 1 ms + 24 µs; fractions counted in 8 µs units (24/8 = 3) */
  if (f >= 125) {
    f -= 125;
    m += 1;
  }
  __t0_fract = f;
  __t0_millis = m;
  __t0_overflows++;
}

static inline unsigned long millis(void) {
  uint8_t s = SREG;
  cli();
  unsigned long m = __t0_millis;
  SREG = s;
  return m;
}

static inline unsigned long micros(void) {
  uint8_t s = SREG;
  cli();
  unsigned long m = __t0_overflows;
  uint8_t t = TCNT0;
  if ((TIFR0 & (1 << TOV0)) && (t < 255)) m++;
  SREG = s;
  return ((m << 8) + t) * 4; /* 4 µs per tick at /64 */
}

static inline void delay(unsigned long ms) {
  uint32_t start = micros();
  while (ms > 0) {
    while (ms > 0 && (micros() - start) >= 1000) {
      ms--;
      start += 1000;
    }
  }
}

static inline void delayMicroseconds(unsigned int us) {
  while (us >= 10) {
    _delay_us(10);
    us -= 10;
  }
  while (us--) _delay_us(1);
}

/* ---------- PWM ---------- */
static inline void analogWrite(uint8_t pin, int val) {
  pinMode(pin, OUTPUT);
  if (val <= 0) { digitalWrite(pin, LOW); return; }
  if (val >= 255) { digitalWrite(pin, HIGH); return; }
  switch (pin) {
    case 3: TCCR2A |= (1 << COM2B1); OCR2B = val; break;
    case 5: TCCR0A |= (1 << COM0B1); OCR0B = val; break;
    case 6: TCCR0A |= (1 << COM0A1); OCR0A = val; break;
    case 9: TCCR1A |= (1 << COM1A1); OCR1A = val; break;
    case 10: TCCR1A |= (1 << COM1B1); OCR1B = val; break;
    case 11: TCCR2A |= (1 << COM2A1); OCR2A = val; break;
    default: digitalWrite(pin, val < 128 ? LOW : HIGH);
  }
}

/* ---------- ADC (AVcc reference, /128) ---------- */
static inline int analogRead(uint8_t pin) {
  uint8_t ch = pin >= 14 ? pin - 14 : pin;
  if (ch > 7) return 0;
  ADMUX = (1 << REFS0) | (ch & 0x07);
  ADCSRA |= (1 << ADSC);
  while (ADCSRA & (1 << ADSC));
  uint8_t lo = ADCL;
  uint8_t hi = ADCH;
  return (hi << 8) | lo;
}

/* ---------- tone() on Timer2 CTC ---------- */
static volatile uint8_t __tone_pin = 255;
static volatile long __tone_toggles = 0;

ISR(TIMER2_COMPA_vect) {
  if (__tone_pin == 255) return;
  volatile uint8_t *ddr, *port, *in;
  uint8_t b;
  if (!__pin_regs(__tone_pin, &ddr, &port, &in, &b)) return;
  if (__tone_toggles != 0) {
    *port ^= (1 << b);
    if (__tone_toggles > 0) __tone_toggles--;
  } else {
    TIMSK2 &= ~(1 << OCIE2A);
    *port &= ~(1 << b);
    __tone_pin = 255;
  }
}

static inline void noTone(uint8_t pin) {
  (void)pin;
  TIMSK2 &= ~(1 << OCIE2A);
  if (__tone_pin != 255) digitalWrite(__tone_pin, LOW);
  __tone_pin = 255;
  /* back to phase-correct PWM /64 for D3/D11 */
  TCCR2A = (1 << WGM20);
  TCCR2B = (1 << CS22);
}

static inline void tone(uint8_t pin, unsigned int frequency, unsigned long duration = 0) {
  if (frequency == 0) { noTone(pin); return; }
  static const uint16_t pres[] = {1, 8, 32, 64, 128, 256, 1024};
  static const uint8_t bits[] = {1, 2, 3, 4, 5, 6, 7};
  uint8_t i = 0;
  uint32_t ocr = F_CPU / frequency / 2 - 1;
  while (ocr > 255 && i < 6) {
    i++;
    ocr = F_CPU / frequency / 2 / pres[i] - 1;
  }
  if (ocr > 255) ocr = 255;
  pinMode(pin, OUTPUT);
  __pwm_off(3);
  __pwm_off(11);
  __tone_pin = pin;
  __tone_toggles = duration ? (long)(2UL * frequency * duration / 1000UL) : -1;
  TCCR2A = (1 << WGM21);
  TCCR2B = bits[i];
  OCR2A = (uint8_t)ocr;
  TIMSK2 |= (1 << OCIE2A);
}

/* ---------- pulseIn ---------- */
static inline unsigned long pulseIn(uint8_t pin, uint8_t state, unsigned long timeout = 1000000UL) {
  unsigned long start = micros();
  while (digitalRead(pin) == state) if (micros() - start > timeout) return 0;
  while (digitalRead(pin) != state) if (micros() - start > timeout) return 0;
  unsigned long t0 = micros();
  while (digitalRead(pin) == state) if (micros() - start > timeout) return 0;
  return micros() - t0;
}

/* ---------- math helpers ---------- */
static inline long map(long x, long in_min, long in_max, long out_min, long out_max) {
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
template <class T> static inline T constrain(T x, T a, T b) { return x < a ? a : (x > b ? b : x); }
template <class T, class U> static inline auto min(T a, U b) -> decltype(a < b ? a : b) { return a < b ? a : b; }
template <class T, class U> static inline auto max(T a, U b) -> decltype(a > b ? a : b) { return a > b ? a : b; }
template <class T> static inline T sq(T x) { return x * x; }
static inline long random(long howbig) { return howbig ? (long)(((unsigned long)rand() << 15 ^ rand()) % (unsigned long)howbig) : 0; }
static inline long random(long lo, long hi) { return hi > lo ? lo + random(hi - lo) : lo; }
static inline void randomSeed(unsigned long seed) { if (seed) srand((unsigned int)seed); }

/* ---------- Serial (USART0) ---------- */
#define __SERIAL_RX 64
static volatile uint8_t __rx_buf[__SERIAL_RX];
static volatile uint8_t __rx_head = 0, __rx_tail = 0;

ISR(USART_RX_vect) {
  uint8_t c = UDR0;
  uint8_t next = (__rx_head + 1) % __SERIAL_RX;
  if (next != __rx_tail) {
    __rx_buf[__rx_head] = c;
    __rx_head = next;
  }
}

struct HardwareSerial {
  void begin(unsigned long baud) {
    uint16_t ubrr = (F_CPU / 16 / baud) - 1;
    UBRR0H = (uint8_t)(ubrr >> 8);
    UBRR0L = (uint8_t)ubrr;
    UCSR0A = 0;
    UCSR0B = (1 << TXEN0) | (1 << RXEN0) | (1 << RXCIE0);
    UCSR0C = (1 << UCSZ01) | (1 << UCSZ00);
  }
  void end() { UCSR0B = 0; }
  int available() { return (__SERIAL_RX + __rx_head - __rx_tail) % __SERIAL_RX; }
  int peek() { return __rx_head == __rx_tail ? -1 : __rx_buf[__rx_tail]; }
  int read() {
    if (__rx_head == __rx_tail) return -1;
    uint8_t c = __rx_buf[__rx_tail];
    __rx_tail = (__rx_tail + 1) % __SERIAL_RX;
    return c;
  }
  void flush() {}
  size_t write(uint8_t c) {
    while (!(UCSR0A & (1 << UDRE0)));
    UDR0 = c;
    return 1;
  }
  size_t print(const char *s) { size_t n = 0; while (*s) n += write(*s++); return n; }
  size_t print(char c) { return write((uint8_t)c); }
  size_t print(unsigned long v, int base = DEC) {
    char buf[34];
    char *p = buf + sizeof(buf) - 1;
    *p = 0;
    if (base < 2) base = 10;
    do {
      uint8_t d = v % base;
      *--p = d < 10 ? '0' + d : 'A' + d - 10;
      v /= base;
    } while (v);
    return print(p);
  }
  size_t print(long v, int base = DEC) {
    if (v < 0 && base == DEC) return write('-') + print((unsigned long)(-v), base);
    return print((unsigned long)v, base);
  }
  size_t print(int v, int base = DEC) { return print((long)v, base); }
  size_t print(unsigned int v, int base = DEC) { return print((unsigned long)v, base); }
  size_t print(unsigned char v, int base = DEC) { return print((unsigned long)v, base); }
  size_t print(double v, int digits = 2) {
    size_t n = 0;
    if (v < 0) { n += write('-'); v = -v; }
    double r = 0.5;
    for (int i = 0; i < digits; i++) r /= 10.0;
    v += r;
    unsigned long whole = (unsigned long)v;
    n += print(whole);
    if (digits > 0) n += write('.');
    double rem = v - (double)whole;
    while (digits-- > 0) {
      rem *= 10.0;
      int d = (int)rem;
      n += write('0' + d);
      rem -= d;
    }
    return n;
  }
  size_t println() { return write('\r') + write('\n'); }
  template <class T> size_t println(T v) { size_t n = print(v); return n + println(); }
  template <class T> size_t println(T v, int fmt) { size_t n = print(v, fmt); return n + println(); }
  long parseInt() {
    unsigned long start = millis();
    int c;
    bool neg = false;
    long v = 0;
    do {
      c = peek();
      if (c == '-' || (c >= '0' && c <= '9')) break;
      if (c >= 0) read();
    } while (millis() - start < 1000);
    if (c < 0) return 0;
    if (c == '-') { neg = true; read(); }
    while (true) {
      c = peek();
      if (c < '0' || c > '9') {
        if (c < 0 && millis() - start < 1000) continue;
        break;
      }
      v = v * 10 + (read() - '0');
    }
    return neg ? -v : v;
  }
  explicit operator bool() { return true; }
};
static HardwareSerial Serial;

/* ---------- startup, mirroring wiring.c init() ---------- */
static inline void __lab_init(void) {
  sei();
  /* Timer0: fast PWM, /64, overflow interrupt for millis() */
  TCCR0A = (1 << WGM01) | (1 << WGM00);
  TCCR0B = (1 << CS01) | (1 << CS00);
  TIMSK0 = (1 << TOIE0);
  /* Timer1: 8-bit phase-correct PWM, /64 */
  TCCR1A = (1 << WGM10);
  TCCR1B = (1 << CS11) | (1 << CS10);
  /* Timer2: phase-correct PWM, /64 */
  TCCR2A = (1 << WGM20);
  TCCR2B = (1 << CS22);
  /* ADC: /128, enabled */
  ADCSRA = (1 << ADPS2) | (1 << ADPS1) | (1 << ADPS0) | (1 << ADEN);
  UCSR0B = 0;
}
