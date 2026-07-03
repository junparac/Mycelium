#include <WiFi.h>
#include <HTTPClient.h>
#include <Arduino.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <RTClib.h>
#include "DHT.h"

#define DHTPIN 4
#define DHTTYPE DHT22

const char* ssid = "Maker";
const char* password = "OldOwl23";

const char* server = "http://192.168.254.100:5000/skin";

LiquidCrystal_I2C lcd(0x27, 20, 4);

RTC_DS3231 rtc;
DHT dht(DHTPIN, DHTTYPE);

byte Degree[8] = {
  0b00111,
  0b00101,
  0b00111,
  0b00000,
  0b00000,
  0b00000,
  0b00000,
  0b00000
};

unsigned long lastScreenSwitch = 0;
unsigned long lastScreenUpdate = 0; // Added to prevent LCD flickering
unsigned long lastSend = 0;         // FIXED: Added missing variable
bool showClock = true;

//--------------------------------------------------

void setup() {
  Serial.begin(115200);

  // LCD init FIRST
  lcd.init();
  lcd.backlight();
  lcd.createChar(0, Degree);
  lcd.setCursor(0, 0);
  lcd.print("Booting...");

  // WiFi
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password, 5); // <-- FORCE CHANNEL

  lcd.setCursor(0, 1);
  lcd.print("WiFi connecting");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("WiFi OK");
  lcd.setCursor(0, 1);
  lcd.print(WiFi.localIP());

  rtc.begin();
  dht.begin();
}

//--------------------------------------------------


void updateLCD()
{
  const char dayInWords[7][4] = { "SUN","MON","TUE","WED","THU","FRI","SAT" };
  const char monthInWords[13][4] = { " ", "JAN","FEB","MAR","APR","MAY","JUN", "JUL","AUG","SEP","OCT","NOV","DEC" };

  DateTime now = rtc.now();

  lcd.setCursor(2,0);
  if(now.day()<10) lcd.print("0");
  lcd.print(now.day());
  lcd.print("-");
  lcd.print(monthInWords[now.month()]);
  lcd.print("-");
  lcd.print(now.year());
  lcd.print(" ");
  lcd.print(dayInWords[now.dayOfTheWeek()]);

  lcd.setCursor(5,2);
  int hh = now.twelveHour();
  if(hh<10) lcd.print("0");
  lcd.print(hh);
  lcd.print(":");

  if(now.minute()<10) lcd.print("0");
  lcd.print(now.minute());
  lcd.print(":");

  if(now.second()<10) lcd.print("0");
  lcd.print(now.second());

  lcd.setCursor(8,3);
  if(now.isPM()) lcd.print("PM");
  else lcd.print("AM");
}

//--------------------------------------------------

void HumiAndTemp()
{
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  if (isnan(h) || isnan(t))
  {
    lcd.clear();
    lcd.setCursor(1,1);
    lcd.print("DHT22 Read Error");
    return;
  }

  lcd.setCursor(2,0);
  lcd.print("Environment");

  lcd.setCursor(0,2);
  lcd.print("Humidity : ");
  lcd.print(h,1);
  lcd.print("%   ");

  lcd.setCursor(0,3);
  lcd.print("Temp     : ");
  lcd.print(t,1);
  lcd.write(0);
  lcd.print("C   ");
}

//--------------------------------------------------

void updateRTC()
{
  lcd.clear();
  lcd.setCursor(0,0);
  lcd.print("RTC Edit Mode");

  const char txt[6][15] = { "year", "month", "day", "hour", "minute", "second" };
  String str;
  long newDate[6];

  while (Serial.available()) Serial.read();

  for (int i=0; i<6; i++)
  {
    Serial.print("Enter ");
    Serial.print(txt[i]);
    Serial.print(": ");

    while(!Serial.available());

    str = Serial.readString();
    newDate[i] = str.toInt();
    Serial.println(newDate[i]);
  }

  rtc.adjust(DateTime(newDate[0], newDate[1], newDate[2], newDate[3], newDate[4], newDate[5]));
  Serial.println("RTC Updated.");
  lcd.clear();
}

void sendSkin()
{
    if (WiFi.status() != WL_CONNECTED)
        return;

    float h = dht.readHumidity();
    float t = dht.readTemperature();

    if (isnan(h) || isnan(t))
        return;

    HTTPClient http;

    http.begin(server);
    http.addHeader("Content-Type", "application/json");

    String json = "{";
    json += "\"device\":\"My-Skin\",";
    json += "\"temperature\":";
    json += String(t,1);
    json += ",";
    json += "\"humidity\":";
    json += String(h,1);
    json += "}";

    Serial.println("Sending:");
    Serial.println(json);

    int code = http.POST(json);

    Serial.print("HTTP Code: ");
    Serial.println(code);

    if (code > 0)
    {
        String response = http.getString();
        Serial.print("Response: ");
        Serial.println(response);
    }
    else
    {
        Serial.print("Error: ");
        Serial.println(http.errorToString(code));
    }

    http.end();
}


//--------------------------------------------------

void loop()
{
    // Toggle screen layout every 5 seconds
    if (millis() - lastScreenSwitch >= 5000)
    {
        showClock = !showClock;
        lastScreenSwitch = millis();
        lcd.clear();
    }

    // Refresh screen data every 1 second (prevents flickering)
    if (millis() - lastScreenUpdate >= 1000)
    {
        if (showClock)
            updateLCD();
        else
            // Note: DHT readings take ~250ms, so this may slightly delay execution
            HumiAndTemp(); 
            
        lastScreenUpdate = millis();
    }

    // Listen for RTC adjustment triggers
    if (Serial.available())
    {
        char input = Serial.read();
        if (input == 'u')
            updateRTC();
    }

    // Send data every 2 seconds
    if (millis() - lastSend >= 2000)
    {
        sendSkin();
        lastSend = millis();
    }
}