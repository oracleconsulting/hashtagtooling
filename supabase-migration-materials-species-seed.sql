-- ============================================
-- MATERIALS: Bulk species data (run after materials-species-grain.sql)
-- Safe to re-run; only updates matching existing rows.
-- ============================================

UPDATE materials SET janka_hardness = 1010, specific_gravity = 0.55, origin = 'North America', grain_description = 'Rich, chocolatey brown with straight to slightly wavy grain and occasional darker streaks.', grain_type = 'straight', texture = 'medium', durability = 'moderate', color_description = 'Dark chocolate brown with purplish undertones' WHERE name ILIKE '%Black Walnut%' AND category = 'wood';

UPDATE materials SET janka_hardness = 1450, specific_gravity = 0.63, origin = 'North America', grain_description = 'Pale, creamy white with subtle grain patterns. Exceptionally clean and uniform.', grain_type = 'straight', texture = 'fine', durability = 'moderate', color_description = 'Creamy white to pale golden' WHERE name ILIKE '%Hard Maple%' AND category = 'wood';

UPDATE materials SET janka_hardness = 995, specific_gravity = 0.50, origin = 'North America', grain_description = 'Warm reddish-brown that deepens beautifully with age. Fine, straight grain with occasional ripple.', grain_type = 'straight', texture = 'fine', durability = 'moderate', color_description = 'Pinkish brown darkening to rich reddish-brown' WHERE name ILIKE '%Cherry%' AND name NOT ILIKE '%Brazilian%' AND category = 'wood';

UPDATE materials SET janka_hardness = 1360, specific_gravity = 0.68, origin = 'North America / Europe', grain_description = 'Open-pored with prominent ray flecks when quartersawn. Strong, characterful figure.', grain_type = 'straight', texture = 'coarse', durability = 'high', color_description = 'Light tan to medium brown with olive undertones' WHERE name ILIKE '%White Oak%' AND category = 'wood';

UPDATE materials SET janka_hardness = 1320, specific_gravity = 0.60, origin = 'North America / Europe', grain_description = 'Light-coloured, straight-grained with excellent shock resistance. Classic tool handle material.', grain_type = 'straight', texture = 'coarse', durability = 'low', color_description = 'Light brown to pale blonde' WHERE name ILIKE '%Ash%' AND name NOT ILIKE '%Olive%' AND category = 'wood';

UPDATE materials SET janka_hardness = 1300, specific_gravity = 0.64, origin = 'Europe', grain_description = 'Pale, uniform wood with a subtle figure. Very fine, even texture — traditionally used for plane bodies.', grain_type = 'straight', texture = 'fine', durability = 'low', color_description = 'Pale cream to light tan' WHERE name ILIKE '%Beech%' AND category = 'wood';

UPDATE materials SET janka_hardness = 1260, specific_gravity = 0.62, origin = 'North America', grain_description = 'Pale wood with a slight golden tone. Fine, even grain with occasional curly figure.', grain_type = 'straight', texture = 'fine', durability = 'low', color_description = 'Light yellowish-brown' WHERE name ILIKE '%Birch%' AND category = 'wood';

UPDATE materials SET janka_hardness = 800, specific_gravity = 0.52, origin = 'Central & South America / Africa', grain_description = 'Deep, lustrous reddish-brown with interlocking grain. Darkens beautifully over time.', grain_type = 'interlocked', texture = 'medium', durability = 'high', color_description = 'Rich reddish-brown to deep red' WHERE name ILIKE '%Mahogany%' AND name NOT ILIKE '%Santos%' AND category = 'wood';

UPDATE materials SET janka_hardness = 3220, specific_gravity = 1.03, origin = 'Central & West Africa', grain_description = 'Jet black, incredibly dense. One of the hardest and most prized woods in the world. Mirror-like polish.', grain_type = 'straight', texture = 'fine', durability = 'very_high', color_description = 'Jet black, occasionally with dark brown streaks' WHERE name ILIKE '%Ebony%' AND name NOT ILIKE '%Macassar%' AND category = 'wood';

UPDATE materials SET janka_hardness = 2900, specific_gravity = 0.96, origin = 'Southeast Asia', grain_description = 'Dramatic black and brown streaking. Highly decorative with a bold, striking figure.', grain_type = 'straight', texture = 'fine', durability = 'very_high', color_description = 'Dark brown to black with dramatic lighter brown streaks' WHERE name ILIKE '%Macassar%' AND category = 'wood';

UPDATE materials SET janka_hardness = 1780, specific_gravity = 0.75, origin = 'East India / Southeast Asia', grain_description = 'Deep, dark reddish-purple with stunning interlocking grain. Sweet rose-like scent when cut.', grain_type = 'interlocked', texture = 'medium', durability = 'very_high', color_description = 'Deep purplish-brown to dark reddish-brown' WHERE name ILIKE '%Rosewood%' AND name NOT ILIKE '%Santos%' AND name NOT ILIKE '%Bolivian%' AND category = 'wood';

UPDATE materials SET janka_hardness = 3540, specific_gravity = 1.05, origin = 'Central America / Caribbean', grain_description = 'One of the world''s hardest woods. Olive to dark brown with black striping. Extremely dense and oily.', grain_type = 'interlocked', texture = 'fine', durability = 'very_high', color_description = 'Olive-brown to blackish with dark striping' WHERE name ILIKE '%Lignum Vitae%' AND category = 'wood';

UPDATE materials SET janka_hardness = 2350, specific_gravity = 0.88, origin = 'Southern Africa', grain_description = 'Brilliant purplish-red when freshly cut, deepening to dark brown over time. Extremely hard.', grain_type = 'interlocked', texture = 'fine', durability = 'very_high', color_description = 'Purplish-red darkening to deep brown' WHERE name ILIKE '%Purpleheart%' AND category = 'wood';

UPDATE materials SET janka_hardness = 2345, specific_gravity = 0.88, origin = 'Central America', grain_description = 'Bright orange to reddish-brown with distinctive dark striping. Oily, heavy, and very durable.', grain_type = 'interlocked', texture = 'medium', durability = 'very_high', color_description = 'Orange-brown with dramatic dark striping' WHERE name ILIKE '%Cocobolo%' AND category = 'wood';

UPDATE materials SET janka_hardness = 1925, specific_gravity = 0.80, origin = 'West Africa', grain_description = 'Golden to dark brown with distinctive ribboning on quartersawn faces. Shimmer effect.', grain_type = 'interlocked', texture = 'medium', durability = 'very_high', color_description = 'Golden brown to dark brown with golden shimmer' WHERE name ILIKE '%Iroko%' AND category = 'wood';

UPDATE materials SET janka_hardness = 1850, specific_gravity = 0.73, origin = 'Southeast Asia', grain_description = 'Golden to dark brown, oily and weather-resistant. Classic boatbuilding timber.', grain_type = 'straight', texture = 'coarse', durability = 'very_high', color_description = 'Golden to medium brown with oily surface' WHERE name ILIKE '%Teak%' AND category = 'wood';

UPDATE materials SET janka_hardness = 3310, specific_gravity = 1.04, origin = 'Southern Africa', grain_description = 'Extremely dense and fine-grained. Dark brown heartwood. Used for musical instruments.', grain_type = 'straight', texture = 'fine', durability = 'very_high', color_description = 'Dark brown to blackish-brown' WHERE name ILIKE '%African Blackwood%' AND category = 'wood';

UPDATE materials SET janka_hardness = 1620, specific_gravity = 0.72, origin = 'Africa', grain_description = 'Warm reddish-brown with a distinctive ribbon stripe on quartersawn surfaces.', grain_type = 'interlocked', texture = 'fine', durability = 'high', color_description = 'Pale pinkish-brown to reddish-brown' WHERE name ILIKE '%Sapele%' AND category = 'wood';

UPDATE materials SET janka_hardness = 1710, specific_gravity = 0.77, origin = 'West Africa', grain_description = 'Deep brown to purplish with interlocked grain producing a stunning ribbon figure.', grain_type = 'interlocked', texture = 'coarse', durability = 'very_high', color_description = 'Rich dark brown with purple undertones' WHERE name ILIKE '%Wenge%' AND category = 'wood';

UPDATE materials SET janka_hardness = 1680, specific_gravity = 0.72, origin = 'West Africa', grain_description = 'Bright pinkish-red that darkens to a rich reddish-brown. Strong grain with natural lustre.', grain_type = 'interlocked', texture = 'medium', durability = 'high', color_description = 'Bright pinkish-red to deep reddish-brown' WHERE name ILIKE '%Padauk%' AND name NOT ILIKE '%Burma%' AND name NOT ILIKE '%Burmese%' AND category = 'wood';

UPDATE materials SET janka_hardness = 1860, specific_gravity = 0.80, origin = 'Central & South America', grain_description = 'Rich dark brown with prominent yellow-green veining. Heavy and distinctively patterned.', grain_type = 'interlocked', texture = 'coarse', durability = 'very_high', color_description = 'Dark brown with olive-yellow veining' WHERE name ILIKE '%Bocote%' AND category = 'wood';

UPDATE materials SET janka_hardness = 1850, specific_gravity = 0.73, origin = 'South America', grain_description = 'Dark brown to blackish with dramatic lighter streaking and wild grain patterns.', grain_type = 'irregular', texture = 'medium', durability = 'very_high', color_description = 'Dark brown to black with lighter brown streaks' WHERE name ILIKE '%Ziricote%' AND category = 'wood';

UPDATE materials SET janka_hardness = 3800, specific_gravity = 1.12, origin = 'South America', grain_description = 'Medium brown with dark striping. Incredibly hard — one of the densest woods commercially available.', grain_type = 'interlocked', texture = 'fine', durability = 'very_high', color_description = 'Medium brown with dark striping' WHERE name ILIKE '%Snakewood%' AND category = 'wood';

UPDATE materials SET janka_hardness = 1500, specific_gravity = 0.70, origin = 'Europe / Western Asia', grain_description = 'Wild, swirling grain with contrasting dark heartwood and blonde sapwood. Aromatic.', grain_type = 'irregular', texture = 'medium', durability = 'high', color_description = 'Dark olive-brown heartwood with blonde sapwood' WHERE (name ILIKE '%Olive%' OR name ILIKE '%Olivewood%') AND category = 'wood';

UPDATE materials SET janka_hardness = 1290, specific_gravity = 0.62, origin = 'North America', grain_description = 'Pale wood with distinctive spalting — black zone lines through pale wood. No two pieces alike.', grain_type = 'irregular', texture = 'fine', durability = 'low', color_description = 'Pale cream with dramatic black spalting lines' WHERE name ILIKE '%Spalted%' AND category = 'wood';

UPDATE materials SET janka_hardness = 2150, specific_gravity = 0.83, origin = 'South America', grain_description = 'Dark chocolate brown to reddish-brown. Extremely dense with fine, even grain.', grain_type = 'straight', texture = 'fine', durability = 'very_high', color_description = 'Dark chocolate to reddish-brown' WHERE (name ILIKE '%Jatoba%' OR name ILIKE '%Brazilian Cherry%') AND category = 'wood';

UPDATE materials SET janka_hardness = 2140, specific_gravity = 0.85, origin = 'East Africa', grain_description = 'Pinkish-brown with a distinctive purple tinge. Very hard and heavy.', grain_type = 'interlocked', texture = 'fine', durability = 'very_high', color_description = 'Pinkish-brown with purple tinge' WHERE name ILIKE '%Bubinga%' AND category = 'wood';

UPDATE materials SET janka_hardness = 1750, specific_gravity = 0.76, origin = 'South America', grain_description = 'Rich brown with distinctive darker veining and occasional wavy figure. Dense and lustrous.', grain_type = 'wavy', texture = 'medium', durability = 'high', color_description = 'Golden brown to dark brown with darker veining' WHERE (name ILIKE '%Goncalo Alves%' OR name ILIKE '%Tigerwood%') AND category = 'wood';

UPDATE materials SET janka_hardness = 1580, specific_gravity = 0.71, origin = 'West Africa', grain_description = 'Deep purple-brown to black. Extremely straight-grained and dense.', grain_type = 'straight', texture = 'fine', durability = 'very_high', color_description = 'Dark purple-brown to black' WHERE name ILIKE '%Kingwood%' AND category = 'wood';

UPDATE materials SET janka_hardness = 1520, specific_gravity = 0.68, origin = 'Europe / North America', grain_description = 'Dark brown heartwood with lighter sapwood. Famously used for yew longbows.', grain_type = 'irregular', texture = 'fine', durability = 'high', color_description = 'Orange-brown heartwood with pale cream sapwood' WHERE name ILIKE '%Yew%' AND category = 'wood';

UPDATE materials SET janka_hardness = 1470, specific_gravity = 0.67, origin = 'Europe', grain_description = 'Fine, uniform texture with a distinctive pinkish-brown tone. Turns exceptionally well.', grain_type = 'straight', texture = 'fine', durability = 'moderate', color_description = 'Pinkish-brown to warm brown' WHERE (name ILIKE '%Pear%' OR name ILIKE '%Pearwood%') AND category = 'wood';

UPDATE materials SET janka_hardness = 1860, specific_gravity = 0.78, origin = 'South America', grain_description = 'Light olive to yellowish-brown with fine dark streaking. Extremely durable.', grain_type = 'interlocked', texture = 'fine', durability = 'very_high', color_description = 'Olive to yellowish-brown with dark veining' WHERE (name ILIKE '%Ipe%' OR name ILIKE '%Ipê%') AND category = 'wood';

UPDATE materials SET janka_hardness = 1820, specific_gravity = 0.74, origin = 'North America', grain_description = 'Extremely hard and dense. Distinctive reddish-brown heartwood with cream sapwood.', grain_type = 'interlocked', texture = 'fine', durability = 'high', color_description = 'Rich reddish-brown heartwood, cream sapwood' WHERE name ILIKE '%Hickory%' AND category = 'wood';

UPDATE materials SET janka_hardness = 1290, specific_gravity = 0.63, origin = 'North America', grain_description = 'Similar to white oak but warmer and redder. Open grain with prominent pores.', grain_type = 'straight', texture = 'coarse', durability = 'moderate', color_description = 'Light to medium reddish-brown' WHERE name ILIKE '%Red Oak%' AND category = 'wood';

-- Catch-all defaults for any remaining woods
UPDATE materials SET grain_type = COALESCE(grain_type, 'straight'), texture = COALESCE(texture, 'medium'), durability = COALESCE(durability, 'moderate') WHERE category = 'wood' AND grain_type IS NULL;
