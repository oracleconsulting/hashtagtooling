# Materials Setup Guide

## Database Setup

Run these SQL files in order in your Supabase SQL Editor:

### 1. First Time Setup
```sql
-- Run this first (creates tables and schema)
-- Copy contents from: supabase-schema.sql
```

### 2. Load All Materials
```sql
-- Run this second (loads all 93 woods + pricing)
-- Copy contents from: supabase-materials-complete.sql
```

## What Gets Created

### Base Prices
- **6 Mallet Styles**: £190-300
- **5 Awl Styles**: £80-100

### Materials
- **13 Base Price Woods**: £0 premium (Aforomosia, Azobe, Bubinga, etc.)
- **80 Premium Woods**: £5-250 premiums with different rates for:
  - Mallet heads
  - Mallet handles  
  - Awl handles (handle only, no head)

### Transition Materials
- **6 Options**: Aluminium, Brass, Steel, Bronze, Copper, Mokume Gane
- **Premiums**: £0-80 for mallets, £0-75 for awls

## Pricing Logic

### Mallets
```
Final Price = Base Price + Head Material Premium + Handle Material Premium + Transition Premium
```

**Example:**
- Square Joiners Mallet: £300
- Snakewood Head: +£150
- Ebony Handle: +£25 (not in head list, would need to be added)
- Mokume Gane Transition: +£80
- **Total: £555**

### Awls
```
Final Price = Base Price + Handle Material Premium + Ferrule/Transition Premium
```

**Example:**
- Large Birdcage Awl: £95
- Snakewood Handle: +£50
- Mokume Gane Ferrule: +£75
- **Total: £220**

## Admin Panel Access

Go to: `https://hashtagwoodworking.co.uk/admin/materials`

You can:
- ✅ Edit any material premium (head/handle/awl)
- ✅ Add new wood types
- ✅ Delete materials
- ✅ Edit base prices for each style
- ✅ Add new mallet/awl styles
- ✅ Enable/disable materials

## Material Categories

### Base Price Woods (13)
No additional charge above base price:
- Aforomosia, Azobe, Bubinga, Chakte Kok, Goncalo Alves, Knobthorn, Olivewood, Padauk, Ropalo Lacewood, Spalted Beech, Spalted Birch, Spalted Pippy Oak, Wenge

### Premium Woods (80)
Range from £5 to £250 premium depending on material and use (head vs handle).

**Most Expensive:**
- Ancient Redgum (7000 years old): £250 head, £125 handle
- Snakewood: £150 head, £100 handle, £50 awl
- African Blackwood (Birdseye): £110 handle only
- Elm Burl (1200 Year Old): £100 head, £50 handle
- Massur Birch U: £100 handle only

### Transition/Ferrule Materials
- **Aluminium**: £0
- **Brass**: £0  
- **Steel**: £5 (awls only)
- **Bronze**: £5 mallets, £10 awls
- **Copper**: £10 mallets, £20 awls
- **Mokume Gane**: £80 mallets, £75 awls

## Notes

- Some woods are only available for heads (marked with 'x' in Head column)
- Some woods are only available for handles (marked with 'x' in Handles column)
- Awls only use handle materials (no head material selection)
- The admin panel handles all the premium calculations automatically
- Custom mallet builder will pull from this database for real-time pricing

