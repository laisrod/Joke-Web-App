# Multi-API Joke System Testing Guide

## Quick Test

### 1. Basic test - Does it work?
- Open the website
- Click "Next joke" 5 times
- **What to expect:** Different jokes appear
- **If it doesn't work:** Site is broken, needs fixing

### 2. Test API switching
- Click "Next joke" 10 times
- **Chuck Norris:** Talks about him being strong, invincible, etc.
- **Dad Jokes:** Silly jokes, puns, dad stuff
- **If only one type appears:** Switching is not working

### 3. Speed test
- Click "Next joke" and count: "1, 2, 3..."
- **If it appears before 3:** Great!
- **If it takes longer:** Slow internet or slow API

## Advanced Test (5 minutes)

### 4. Test with console (F12)
- Press F12 → "Console" tab
- Click "Next joke" a few times
- **Should appear:**
  ```
  API Selection: Chuck Norris
  API Selection: Dad Jokes
  ```
- **If only one appears:** Switching is broken

### 5. Error test
- Turn off WiFi for 3 seconds
- Click "Next joke"
- **Should appear:** "Error loading joke"
- Turn WiFi back on
- Click "Next joke"
- **Should work normally**

### 6. Rating test
- Click one of the buttons (😒, 😐, 😂)
- Click "Next joke"
- Open console (F12) and type: `reportAcudits`
- **Should appear:** Array with your rating

## Stress Test (optional)

### 7. Many jokes test
- Click "Next joke" 20 times in a row
- **What to expect:** All work, no freezing
- **If it freezes:** Performance problem

### 8. Fallback test
- Block one API (too technical, skip if you don't know)
- **Or simply:** Test when one API might be slow
- **What to expect:** Site continues working

## Signs it's working well

**Jokes appear in 1-2 seconds**
**Joke types vary (Chuck Norris vs normal)**
**Console shows API switching**
**Rating buttons work**
**Weather appears at the top**
**Site doesn't freeze with many clicks**

## Signs of problems

**Only Chuck Norris jokes appear**
**Only Dad Jokes appear**
**Takes more than 5 seconds to load**
**"Error loading joke" appears always**
**Site freezes after many clicks**
**Rating buttons don't work**

## Important tips

- **Chuck Norris is easy to identify:** Always talks about him being the best
- **Dad Jokes are sillier:** Puns, dad jokes
- **If you don't know how to use console:** Just test by clicking
- **Best time:** During the day (APIs might be slow at night)
- **If there's an error:** Reload the page and try again

## Quick test to show someone

1. "Look, I'll click here several times"
2. Click "Next joke" 8-10 times
3. "See how different jokes appear?"
4. "Some are Chuck Norris jokes, others are normal jokes"
5. "And I can rate each one" (click a rating button)

**If this works, the system is perfect!**