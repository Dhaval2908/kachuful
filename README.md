# 🎴 Kachuful – Live Bidding & Score Tracker

Kachuful is a **single‑page web application** designed to manage bidding, trick tracking, and live scoring for the popular card game *Kachuful* (also known as *Judgement* / *Oh Hell* variants).

The app focuses on **clarity, speed, and zero confusion during live play**, making it ideal for in‑person card games where one device manages the score for everyone.

---

## ✨ Features

### 🧩 Game Setup

* Supports **3 to 7 players**
* Customizable **maximum cards per round**
* Player order determines bidding order

### 🔄 Round Management

* Automatic **round progression**
* Card count increases up to max, then decreases
* Dealer and first bidder rotate correctly
* Visual display of:

  * Current round
  * Number of cards
  * Joker / trump suit

### ✋ Bidding System

* Guided bidding order with **active bidder highlight**
* Prevents invalid bids
* Enforces **last‑bidder restriction** (total bids ≠ cards)
* Auto‑focuses next bidder input
* Clear bids option

### 🎯 Results (Tricks Won)

* Enter tricks won using:

  * `+ / −` buttons
  * Direct numeric input
* Auto‑prefills results from bids (after confirmation)
* Live validation:

  * Each value between 0 and cards
  * Total tricks must equal number of cards

### 🧮 Scoring Logic

* Exact bid → **Bid + 10 points**
* Missed bid → **−Bid**
* Special case:

  * Bid = 0 and wins tricks → **−tricks won**
* Live cumulative totals

### 📊 Live Scoreboard

* Per‑round score table
* Positive / negative color indicators
* Total scores always visible
* End‑game winner announcement

### ⚙️ Gameplay Controls

* Auto‑next round toggle
* Manual confirmation between rounds
* Reset & End Game options

---

## 🛠️ Tech Stack

* **HTML5** – Structure
* **CSS3** – Styling & responsive layout
* **Vanilla JavaScript (ES6)** – Game logic & DOM manipulation

> No frameworks, no libraries, no backend — lightweight and fast.

---

## 📁 Project Structure

```
kachuful/
├── index.html        # Complete single‑page application
├── images/
│   └── logo.png      # App logo
└── README.md         # Project documentation
```

---

## 🚀 How to Run

1. Clone or download the repository
2. Open `index.html` in any modern browser
3. That’s it — no build step, no server required

```bash
open index.html
```

Works offline once loaded.

---

## 🧠 UX & Design Philosophy

* **Zero interruptions** during gameplay
* Minimal cognitive load for players
* Clear visual phases (Bidding vs Results)
* Strong validation to prevent mistakes
* Designed for **one‑device group play**

---

## 🎮 Game Flow

1. Enter player names
2. Start game
3. Each round:

   * Players bid in order
   * Confirm bids
   * Enter tricks won
   * Save results
4. Scores update automatically
5. Game ends manually or after final round

---

## 🔒 Validation Rules

* Bids must be between `0` and `cards`
* All bids required before confirmation
* Total bids cannot equal card count
* Total tricks must equal card count
* Results must be entered for all players

---

## 🌟 Future Enhancements (Ideas)

* Undo last round
* Highlight round winner
* Mobile‑first gesture controls
* Keyboard shortcuts
* Persistent game state (LocalStorage)
* Dark mode
* Multiplayer sync (future backend)

---

## 📷 Screenshots


<img width="545" height="360" alt="image" src="https://github.com/user-attachments/assets/874faca7-829d-4ca9-ab85-b917c4c4015c" />
<img width="1519" height="723" alt="image" src="https://github.com/user-attachments/assets/f055be54-bdc9-48f4-8afc-f49357ee21c9" />
<img width="1869" height="881" alt="image" src="https://github.com/user-attachments/assets/9edb7f3d-5062-41a9-978b-820a46a50ac8" />


---

## 📄 License

This project is open‑source and free to use for personal or educational purposes.

---

## 🙌 Credits

Built with ❤️ for real‑world card games.

If you enjoy this project or use it in your games, feel free to extend or share it!
