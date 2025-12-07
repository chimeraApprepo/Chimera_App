# 🔌 Wallet Connection Guide

## What Are These Buttons?

When you see "Connect Wallet" on the frontend, you'll see these options:

### 1. **Injected** 
**This is what you want to use!**

- **What it means:** Browser extension wallets (MetaMask, Coinbase Wallet, Brave Wallet)
- **What it does:** Opens MetaMask popup asking you to connect
- **Which wallet:** Your **Hack-Terminal** wallet (0x3710...Ffc9) with $2.16 BNB

**How to use:**
1. Make sure MetaMask extension is installed
2. Make sure you're logged into MetaMask
3. Make sure Hack-Terminal account is selected in MetaMask
4. Click "Injected" button
5. MetaMask popup should appear
6. Click "Connect" in MetaMask
7. You're connected! ✅

### 2. **WalletConnect**
**For mobile wallets (optional)**

- **What it means:** Connect mobile wallet apps via QR code
- **What it does:** Shows QR code to scan with Trust Wallet, Rainbow, etc.
- **Status:** Works but requires WalletConnect Project ID (currently using demo)

**How to use:**
1. Click "WalletConnect" button
2. QR code appears
3. Open wallet app on phone
4. Scan QR code
5. Approve connection on phone

---

## 🔍 Troubleshooting: "Nothing Happens When I Click"

### Check #1: Is MetaMask Installed?
```
1. Look for MetaMask fox icon in browser toolbar
2. If not there, install from https://metamask.io
3. Import your Hack-Terminal wallet using private key
```

### Check #2: Is MetaMask Unlocked?
```
1. Click MetaMask icon
2. If it asks for password, enter it
3. Make sure you see your accounts
```

### Check #3: Is Hack-Terminal Selected?
```
1. Click MetaMask icon
2. Look at top - should show "Hack-Terminal"
3. If not, click account selector and choose "Hack-Terminal"
```

### Check #4: Is Frontend Running?
```
1. URL should be http://localhost:5173
2. Page should load without errors
3. Open browser console (F12) and check for errors
```

### Check #5: Browser Console Errors
```
1. Press F12 to open DevTools
2. Click "Console" tab
3. Look for red error messages
4. Common issues:
   - "ethereum is not defined" → MetaMask not installed
   - "User rejected request" → You clicked "Cancel" in MetaMask
   - "Chain not supported" → Need to add BSC to MetaMask
```

---

## 🎯 What Should Happen (Step by Step)

### When You Click "Injected":

1. **Button Click** → Wagmi sends connection request
2. **MetaMask Popup** → MetaMask extension opens
3. **Permission Request** → "Connect with MetaMask" dialog
4. **Account Selection** → Choose Hack-Terminal
5. **Network Check** → May ask to switch to BSC Testnet
6. **Connected!** → Button changes to show your address

### After Connection:

You should see:
```
Connected Wallet
0x3710...Ffc9
0.3000 tBNB

Network: BNB Smart Chain Testnet (Testnet)
[Switch to Mainnet] [Disconnect]
```

---

## 🧪 Quick Test

### Test if MetaMask is Available:

Open browser console (F12) and type:
```javascript
window.ethereum
```

**If you see an object:** ✅ MetaMask is installed  
**If you see undefined:** ❌ MetaMask is not installed or not enabled

### Test if Wagmi Can See Connectors:

In console:
```javascript
// This should show available connectors
console.log('Connectors:', window.wagmi?.connectors)
```

---

## 🔧 Manual Connection Test

If buttons still don't work, try this in browser console:

```javascript
// Request account access
await window.ethereum.request({ method: 'eth_requestAccounts' })

// Should show your address
console.log('Connected:', await window.ethereum.request({ method: 'eth_accounts' }))
```

If this works but buttons don't, there's an issue with the React component.

---

## 🎨 What Each Button Actually Does (Technical)

### Injected Button:
```javascript
// When you click "Injected"
onClick={() => connect({ connector: injectedConnector })}

// This calls:
window.ethereum.request({ 
  method: 'eth_requestAccounts' 
})

// MetaMask responds with:
['0x3710FEbef97cC9705b273C93f2BEB9aDf091Ffc9']

// Wagmi updates state:
isConnected = true
address = '0x3710FEbef97cC9705b273C93f2BEB9aDf091Ffc9'
```

### WalletConnect Button:
```javascript
// When you click "WalletConnect"
onClick={() => connect({ connector: walletConnectConnector })}

// This generates:
- QR code with connection URI
- Modal popup showing QR
- Waits for mobile wallet to scan

// Mobile wallet responds:
- Sends wallet address
- Establishes encrypted connection
- Signs connection request
```

---

## 🚨 Common Issues & Fixes

### Issue: "Buttons are greyed out"
**Fixed!** We removed `disabled={!connector.ready}` from the code.

### Issue: "Nothing happens when I click"
**Causes:**
1. MetaMask not installed → Install MetaMask
2. MetaMask locked → Unlock MetaMask
3. JavaScript error → Check console (F12)
4. Wrong network → MetaMask will prompt to switch

### Issue: "MetaMask opens but shows wrong account"
**Fix:**
1. In MetaMask popup, click account selector
2. Choose "Hack-Terminal"
3. Click "Next" → "Connect"

### Issue: "Connection works but shows 0 balance"
**Causes:**
1. Wrong network selected → Switch to BSC Testnet
2. RPC not responding → Wait a moment and refresh
3. Balance not loaded yet → Give it a few seconds

### Issue: "MetaMask asks to add BSC network"
**Fix:**
1. Click "Approve" when MetaMask asks
2. Or manually add BSC Testnet:
   - Network Name: BSC Testnet
   - RPC URL: https://data-seed-prebsc-1-s1.binance.org:8545
   - Chain ID: 97
   - Symbol: tBNB
   - Explorer: https://testnet.bscscan.com

---

## ✅ Success Checklist

After clicking "Injected", you should have:
- ✅ MetaMask popup appeared
- ✅ Selected Hack-Terminal account
- ✅ Clicked "Connect" in MetaMask
- ✅ Popup closed
- ✅ Button changed to show address
- ✅ Balance displays (0.3000 tBNB)
- ✅ Network shows "BSC Testnet"
- ✅ Can now use chat interface

---

## 🎯 Next Steps After Connection

Once connected:
1. **Try the chat:** Type "What can you do?"
2. **Generate contract:** "Create an ERC-20 token"
3. **Check balance:** Should show your 0.3 tBNB
4. **Switch networks:** Try switching between Testnet/Mainnet

---

## 📞 Still Not Working?

1. **Check browser console** (F12) for errors
2. **Try refreshing** the page (Ctrl+R / Cmd+R)
3. **Try different browser** (Chrome works best with MetaMask)
4. **Restart MetaMask** (Lock and unlock)
5. **Check if MetaMask is on correct network** (BSC Testnet)

---

## 🎓 Understanding the Flow

```
User Clicks "Injected"
        ↓
Wagmi sends connection request
        ↓
Browser detects window.ethereum (MetaMask)
        ↓
MetaMask popup opens
        ↓
User selects account & clicks Connect
        ↓
MetaMask sends account address to dApp
        ↓
Wagmi updates React state
        ↓
Component re-renders with connected state
        ↓
Shows: "Connected Wallet" with address & balance
```

---

**TL;DR:**
- **"Injected"** = MetaMask (use this one!)
- **"WalletConnect"** = Mobile wallets (optional)
- **Click "Injected"** → MetaMask popup → Connect → Done! ✅


