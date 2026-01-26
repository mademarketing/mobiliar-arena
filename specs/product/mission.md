# Product Mission

## Overview

**Mobiliar Arena** is a cooperative multiplayer circular Pong game for 2-6 players, created for Mobiliar's 200th anniversary campaign "Besser zusammen" (Better together). Players stand around a circular LED table, each controlling a paddle with left/right arcade buttons, working together to keep balls in play as long as possible.

## Problem Statement

Traditional promotional activations are either single-player experiences that don't foster social interaction, or competitive games that work against Mobiliar's cooperative brand message. The "Besser zusammen" campaign needs an engaging multiplayer experience that reinforces the value of working together.

## Solution

A circular Pong arena where 2-6 players cooperate to defend against balls spawning from the center. Each player controls a paddle on the edge of the circle, moving it left/right to deflect balls back into play. Success requires coordination and teamwork - if one player misses, the whole team loses that ball.

The game is displayed on a 1920x1080 HD output connected to an LED controller that maps it onto a circular screen. Players stand around the physical table and use arcade buttons to control their paddles.

## Campaign Integration

**Campaign**: Mobiliar 200-year anniversary "Besser zusammen" (Better together)

The cooperative gameplay directly supports the campaign message:
- Players must work together - no individual winners or losers
- Success is measured as a team score
- Communication and coordination improve outcomes
- The shared experience creates positive brand associations

## Target Audience

### Primary Users

- **Event Visitors**: Sports fans and general public at Mobiliar-sponsored events
- **Corporate Guests**: Attendees at Mobiliar corporate events and celebrations

### User Needs

- Quick, intuitive gameplay (minimal instructions needed)
- Engaging multiplayer experience that encourages interaction
- Flexible player count (works with 2-6 people)
- Visually appealing presentation appropriate for the event theme

## Value Proposition

A unique, cooperative gaming experience that turns brand activation into memorable teamwork.

- **Cooperative play**: Reinforces "Besser zusammen" message through gameplay
- **Scalable players**: Works with 2-6 players for varying group sizes
- **Event theming**: Sport-specific visuals (basketball, handball, volleyball, floorball) or corporate branding
- **Spectacular display**: Circular LED table creates visual impact and draws crowds
- **Simple controls**: Two buttons per player - anyone can participate

## Core Principles

- **Cooperation over competition**: Success is shared, reinforcing the campaign message
- **Accessibility**: Simple left/right controls mean anyone can play immediately
- **Flexibility**: Works across player counts and event themes
- **Reliability**: Must work flawlessly during high-profile anniversary events
- **Visual impact**: The circular display and coordinated gameplay draws attention

## Success Criteria

- **Engagement**: High replay rate and queue formation at events
- **Teamwork**: Players naturally communicate and coordinate
- **Accessibility**: No instructions needed for basic play
- **Uptime**: 99%+ availability during operating hours
- **Brand association**: Visitors connect the fun experience with Mobiliar's cooperative message

## Technical Foundation

**Tech Stack**: Phaser.js 3 game engine, TypeScript, Node.js/Express backend, Socket.io for real-time communication, Phidgets for arcade button input, Docker containers

**Display**: 1920x1080 HD output → LED controller → circular LED screen

**Architecture**: Multiplayer game with lobby → game → results flow. Phidgets digital inputs capture arcade button presses (left/right per player). Circular physics for ball bouncing and paddle positioning.
