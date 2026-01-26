# Product Development Roadmap

**Last Updated**: [Update this]

## Roadmap Overview

Development is organized into four phases, building on the existing kiosk game template infrastructure. Phase 1 delivers a playable MVP with your branding, followed by phases adding polish, advanced features, and deployment readiness.

---

## Phase 1: MVP (Minimum Viable Product)

**Goal**: Functional game flow with simple graphics and core prize distribution

**Status**: [ ] Not Started

### Features

- [ ] **Game scene**: [Your game mechanic - wheel spin, scratch card, slot machine, etc.]
- [ ] **Result scene**: Combined win celebration and lose consolation display
- [ ] **Idle state**: Logo, instruction text, buzzer icon with server prize request
- [ ] **Keyboard shortcuts**: Space (server), 1 (force win), 2 (force lose) for testing
- [ ] **Prize configuration**: Two-tier system (inventory prizes, consolation)

### Success Criteria

- [ ] Complete game flow: Idle -> Game -> Result -> Idle
- [ ] All scenes functional with placeholder graphics
- [ ] Prizes distributed via RequestPrize callback with timeout handling

### Technical Dependencies

- [ ] Bootstrap -> Preload scene architecture (extended with game scenes)
- [ ] PrizeEngine with adaptive distribution algorithm
- [ ] Socket.io event system with callback-based RequestPrize

---

## Phase 2: Visual Polish

**Goal**: Production-quality animations and polished visual experience

**Status**: [ ] Not Started

### Features

- [ ] **Visual theme**: Branded background, colors, and typography throughout all scenes
- [ ] **Receipt printer integration**: Print QR codes for win (voucher code) and lose (promo URL) outcomes
- [ ] **Voucher code system**: Pre-load QR code strings into database, mark as used when printed
- [ ] **Enhanced game animations**: Add particle effects and celebratory visuals
- [ ] **Prize-specific win visuals**: Different celebrations for each prize tier
- [ ] **Transition effects**: Smooth fades and transitions between all scenes
- [ ] **Idle/attract mode**: Animated visuals to draw attention when waiting for players

### Success Criteria

- Branding visible and consistent across all scenes
- Animations run at 60 FPS without stuttering
- Idle mode attracts visitor attention

### Technical Dependencies

- Phase 1 functional game flow
- Single 1920x1080 HD display output

---

## Phase 3: Event Operations

**Goal**: Ready for event deployment with operational tooling

**Status**: [ ] Not Started

### Features

- [ ] **Admin-based configuration**: Move all settings from JSON files to admin interface (operating hours, prize inventory, etc.)
- [ ] **Promoter quick-start guide**: Documentation for event staff setup
- [ ] **Pre-event checklist**: Admin panel checklist to verify system readiness
- [ ] **Statistics dashboard**: Real-time view of plays, prizes distributed, and inventory remaining
- [ ] **End-of-day report**: Summary of event performance for each event stop

### Success Criteria

- Non-technical staff can set up and operate the kiosk
- Event managers can monitor performance remotely
- Clear reporting for post-event analysis

### Technical Dependencies

- Phase 2 polished game experience
- Existing admin panel infrastructure

---

## Phase 4+: Future Enhancements

**Goal**: Advanced features for future event seasons

### Potential Features

- **Multi-language support**: Support multiple languages for different regions
- **Analytics integration**: Send event data to central analytics platform
- **Remote configuration**: Update settings without physical access to device
- **A/B testing**: Test different animations or prize distributions across events
- **Photo mode**: Allow visitors to take branded photos with their prize
- **Social sharing**: QR code to share win on social media

---

## Notes

- The existing template provides a solid foundation with prize distribution, admin panel, and hardware integration already implemented
- Focus Phase 1 on branding and game feel rather than infrastructure
- Operating hours will vary by venue - ensure easy configuration
- Prize types are configured in `content/prizes.json` - update with your prize definitions
