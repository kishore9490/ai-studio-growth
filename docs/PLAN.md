# Build plan (Gate 1)

**Concept:** FIRETECH / next-generation protection — a night-time commercial bay, one hero extinguisher, product-cinematography lighting. Red is used for the CTA, the product, the rim light and active states; lime only for small status details.

**Scene composition:** reflective polished-concrete floor; receding steel columns with vertical LED practicals; ribbed steel cladding with girts; ceiling trusses and light strips; a sprinkler main with drops; a riser with an alarm valve; a hose-reel cabinet; a wall-mounted "fire point" (sign + extinguisher) that echoes the hero object; low-opacity haze; fog for depth.

**Lighting:** soft warm key (camera-left high), red rim and cool kicker (behind, distance-limited so they never flood the floor), a neutral specular point for the chrome, an overhead practical with a volumetric cone (high tier), and ceiling fill and wall wash for the room. Reflections come from a private Lightformer environment bound only to the product's materials.

**Camera storyboard:** A establishing (wide/high) → B three-quarter hero (load, 2.6 s dolly) → C valve-head detail with anchored annotations (scroll) → D pull-back reveal (scroll) → release. Separate wide and narrow pose sets; mobile is recomposed, not shrunk.

**Timeline:** headline lines rise 0.25 s→1.3 s; supporting copy/CTAs from 0.5 s; the scene fades in when its first frames are ready, then dollies A→B; scroll chrome at 1.4 s. Nothing blocks interaction.

**Page structure:** Home (hero, intro, services, showcase, systems, industries, AMC, trust, FAQ, CTA, footer) · About · Services index · 6 service pages · Contact/booking · Privacy · 404.

**Performance:** HTML-first prerendered hero; the 3D chunk is lazy-loaded on idle; device tiers; DPR caps; rendering pauses off-screen; runtime textures; pre-rendered stills as poster and fallback.

**Acceptance:** see the README "Test report" — each Phase 11 criterion is verified there or listed as a limitation.
