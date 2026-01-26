# Product Mission

## Overview

[Your Game Name] is an interactive kiosk game that engages visitors at events. It combines physical buzzer gameplay with branded animations to distribute prizes while creating memorable brand experiences.

## Problem Statement

[Describe the problem your game solves. Example: Traditional promotional activations lack engagement and fail to create lasting brand impressions.]

## Solution

An arcade-style kiosk game where visitors press a physical buzzer to trigger an animated prize reveal on a single HD horizontal display. The tactile interaction combined with visual spectacle creates excitement and engagement, while the adaptive prize distribution algorithm ensures fair distribution throughout each event day.

## Target Audience

### Primary Users

- **Event Visitors**: General public attending events who want entertainment and the chance to win prizes
- **Event Promoters**: Staff operating the kiosk who need easy controls and monitoring

### User Needs

- Quick, intuitive gameplay (no instructions needed)
- Exciting visual feedback when playing
- Fair chance at winning prizes throughout the event
- Reliable operation without technical issues

## Value Proposition

An engaging, branded experience that turns passive prize distribution into active entertainment.

- **Physical interaction**: Arcade-style buzzer creates excitement vs. touchscreens
- **Visual spectacle**: HD display with animated prize reveals draws crowds
- **Fair distribution**: Adaptive algorithm spreads prizes throughout the day
- **Brand reinforcement**: Consistent theming creates lasting associations

## Core Principles

- **Simplicity**: One button, one action - anyone can play without instructions
- **Reliability**: Must work flawlessly during event hours with no crashes
- **Fairness**: Prize distribution algorithm ensures all visitors have a fair chance
- **Brand consistency**: Every visual and interaction reinforces brand identity

## Success Criteria

- **Engagement**: High total plays per event
- **Distribution**: 95%+ of daily prize inventory distributed by event close
- **Uptime**: 99%+ availability during operating hours
- **Crowd attraction**: Visible queues forming at the kiosk

## Technical Foundation

**Tech Stack**: Phaser.js 3 game engine, TypeScript, Node.js/Express backend, Socket.io for real-time communication, SQLite database, Docker containers on balenaOS

**Architecture**: Event-driven client-server architecture where clients control game flow and server determines prize outcomes. Multi-scene Phaser game with Bootstrap → Preload → Idle → Game → Result flow. Idle scene requests prize via callback before starting game. GamePlugin provides Socket.io integration. Adaptive time-based prize distribution algorithm ensures fair distribution.
