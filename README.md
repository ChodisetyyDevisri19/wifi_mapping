# AI-Based Wi-Fi Signal Mapping and Intelligent Router Placement Using RSSI Analysis

## 📌 Project Overview

This project presents an AI-based Wi-Fi signal mapping system that analyzes Wi-Fi signal strength using RSSI (Received Signal Strength Indicator) values.

The system collects Wi-Fi signal information and displays it through a web-based dashboard. It helps identify weak-signal areas and provides intelligent recommendations for improving router placement.

## 🎯 Objectives

- Measure Wi-Fi signal strength using RSSI values.
- Visualize Wi-Fi signal conditions through a web dashboard.
- Identify weak-signal and dead-zone areas.
- Monitor Wi-Fi signal variations.
- Provide router placement recommendations.
- Store and analyze Wi-Fi measurement data.

## ✨ Key Features

- 📶 Wi-Fi RSSI monitoring
- 📊 Signal strength visualization
- 🗺️ Wi-Fi signal mapping
- 🔴 Weak-signal area identification
- 🤖 Intelligent router placement recommendation
- 🌐 Flask-based web dashboard
- 📡 Automatic Wi-Fi measurement
- 💾 Local data storage using SQLite

## 🖥️ Dashboard

The project provides a web-based dashboard for monitoring and analyzing Wi-Fi signal strength.

![Wi-Fi Signal Mapping Dashboard](dashboard.png)

## 🧩 System Components

### Hardware

- ESP8266 / NodeMCU
- Wi-Fi-enabled computer/device
- Wi-Fi router

### Software

- Python
- Flask
- HTML
- CSS
- JavaScript
- SQLite
- Chart.js

## ⚙️ System Architecture

```text
Wi-Fi Signal
     ↓
RSSI Data Collection
     ↓
ESP8266 / Computer
     ↓
Python Processing
     ↓
Flask Backend
     ↓
Data Analysis
     ↓
Web Dashboard
     ↓
Signal Mapping
     ↓
Router Placement Recommendation
