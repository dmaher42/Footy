# Footy Player Manager

This is a simple offline app for managing your players and generating a fair rotation plan.

It is designed for your own use only. There are no accounts, no player logins, and no team sharing built in.

The app is now prepared to work like a home-screen web app on mobile.

## How to use it

1. Open `index.html` in your web browser.
2. Paste your player names into **Quick Add Players**.
3. Set:
   - the period label, such as `Quarter` or `Rotation`
   - the number of periods
   - how many players are on the field
   - which players are allowed to bench by using the `Can Bench` tick box
   - which players should be benched first by using the `Bench First` tick box
   - a player's `Max Bench` number if you want to cap how many periods they can sit out
4. Press **Generate Rotation**.
5. If needed, use the **Manual Swap** controls inside each period to swap one field player with one bench player.
6. Use **Print / Save PDF** if you want a paper copy for game day.

## Player Feedback

- Use the `Player Feedback` section on the main screen during the game.
- Tap a player, then tap quick categories like effort, defence, leadership, or 1%ers.
- Add short notes when something specific happens.
- Use `Copy Feedback` to copy the selected player's summary after the game.
- Use the `Post-Game Report` section to generate comments for all players at once.
- Use `Copy Full Report` if you want to paste the whole team report somewhere else.

## Notes

- The app saves your squad and settings in your browser on this computer.
- On mobile, the app works in the browser with the same layout adapted for smaller screens.
- Because the app uses browser storage only, your data does not automatically sync between your computer and your phone.
- The app now includes install files for a home-screen app, but install mode only works when it is opened from a normal web address, not directly from a local `file`.
- If there are more players than on-field spots, the app only benches players marked `Can Bench`.
- `Bench First` tells the app to prefer benching that player earlier than others.
- `Max Bench` limits how many periods that player can be benched for the whole game.
- If too many players are locked on field, the app will warn you instead of guessing.
- Preferred position is optional and only shown as a note next to a player's name.

## Install On Phone

1. Open the app from a normal web link.
2. On iPhone or iPad:
   - open the page in Safari
   - tap **Share**
   - tap **Add to Home Screen**
3. On Android:
   - open the page in Chrome
   - use the browser menu
   - tap **Install app** or **Add to Home screen**

If you want, the next step can be making this available from a simple private web link so your phone can actually install it.

## GitHub Setup

This folder is ready to go into a GitHub repository named `Footy`.

Recommended repository URL:

- `https://github.com/dmaher42/Footy`

After the repository exists on GitHub, connect this local folder to it with:

```powershell
git remote add origin https://github.com/dmaher42/Footy.git
git branch -M main
git push -u origin main
```

If you want GitHub Pages for mobile install, publish from the `main` branch.
