/**
 * VALENCE RECORDS — INTERACTIVE MOTION & DECK ENGINE
 * 
 * Features:
 * 1. Scroll-bound Portal Engine (split title, split doors, image scale, duotone wash, accent dots)
 * 2. Throwable Vinyl Sleeve Card Deck (Pointer drag physics, throwing roll, arrow keys, touch pan-y)
 * 3. Statement Fold Scroll Drift & Rotating Vinyl
 * 4. Roster Interactive Audio Waveform Details
 * 5. Reduced-Motion & Accessibility Guards
 */

document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ==========================================================================
     1. PORTAL HERO SCROLL ENGINE
     ========================================================================== */
  const heroSection = document.getElementById('hero');
  const panelLeft = document.getElementById('panel-left');
  const panelRight = document.getElementById('panel-right');
  const spanLeft = document.getElementById('span-left');
  const spanRight = document.getElementById('span-right');
  const heroTitle = document.getElementById('hero-title');
  const heroImage = document.getElementById('hero-image');
  const heroDuotone = document.getElementById('hero-duotone');
  const dotAmber = document.getElementById('dot-amber');
  const dotTeal = document.getElementById('dot-teal');

  function updatePortalOnScroll() {
    if (!heroSection) return;

    const heroRect = heroSection.getBoundingClientRect();
    const heroHeight = heroSection.offsetHeight;
    const viewportHeight = window.innerHeight;
    
    // Total scrollable distance within hero section
    const maxScroll = heroHeight - viewportHeight;
    // Current scrolled amount inside hero section
    const currentScroll = Math.max(0, -heroRect.top);
    
    // Normalized scroll progress [0.0 to 1.0]
    const rawProgress = maxScroll > 0 ? currentScroll / maxScroll : 0;
    const progress = Math.min(Math.max(rawProgress, 0), 1);

    if (prefersReducedMotion) {
      // Reduced motion fallback: Keep portal open
      panelLeft.style.transform = 'translateX(-102%)';
      panelRight.style.transform = 'translateX(102%)';
      spanLeft.style.transform = 'translateX(0)';
      spanRight.style.transform = 'translateX(0)';
      heroImage.style.transform = 'scale(1)';
      heroDuotone.style.opacity = '0.2';
      return;
    }

    // 1. Uncover Door Panels (Translate past 100% width)
    const doorTranslate = progress * 102;
    panelLeft.style.transform = `translateX(-${doorTranslate}%)`;
    panelRight.style.transform = `translateX(${doorTranslate}%)`;

    // 2. Title Signature Move: Scale UP, Tighten Tracking, Separate Halves
    const titleScale = 1 + (progress * 0.32); // 1.0 to 1.32
    // Tighten letter spacing from 0.02em down to -0.035em
    const letterSpacing = 0.02 - (progress * 0.055);
    heroTitle.style.letterSpacing = `${letterSpacing}em`;

    // Horizontal travel for split halves (40vw travel distance)
    const spanTravel = progress * 40;
    spanLeft.style.transform = `translate3d(-${spanTravel}vw, 0, 0) scale(${titleScale})`;
    spanRight.style.transform = `translate3d(${spanTravel}vw, 0, 0) scale(${titleScale})`;

    // 3. Hero Image settle from 1.08 down to 1.0
    const imageScale = 1.08 - (progress * 0.08);
    heroImage.style.transform = `scale(${imageScale})`;

    // 4. Duotone Overlay opacity (0 to 0.35)
    heroDuotone.style.opacity = (progress * 0.35).toString();

    // 5. Accent Dots travelling out towards opposite corners
    const dotX = progress * 38; // vw
    const dotY = progress * 32; // vh
    dotAmber.style.transform = `translate3d(-${dotX}vw, -${dotY}vh, 0)`;
    dotTeal.style.transform = `translate3d(${dotX}vw, ${dotY}vh, 0)`;
  }

  // Bind scroll event using requestAnimationFrame for 60fps performance
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updatePortalOnScroll();
        updateStatementVinylOnScroll();
        updateRosterWheelOnScroll();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // Initial call
  updatePortalOnScroll();


  /* ==========================================================================
     2. STATEMENT FOLD SCROLL DRIFT & ROTATION
     ========================================================================== */
  const floatingVinylWrap = document.getElementById('floating-vinyl-wrap');
  const floatingVinyl = document.getElementById('floating-vinyl');
  const statementSection = document.getElementById('statement');

  function updateStatementVinylOnScroll() {
    if (!statementSection || !floatingVinyl) return;
    const rect = statementSection.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // Check if section is visible
    if (rect.top < viewportHeight && rect.bottom > 0) {
      const scrollY = window.scrollY;
      const rotationAngle = (scrollY * 0.15) % 360;
      const translateY = (rect.top * 0.12);

      floatingVinyl.style.transform = `rotate(${rotationAngle}deg)`;
      floatingVinylWrap.style.transform = `translateY(${translateY}px)`;
    }
  }

  const rosterWheelWrap = document.getElementById('roster-wheel-wrap');
  const rosterWheel = document.getElementById('roster-wheel');
  const rosterSection = document.getElementById('roster');

  function updateRosterWheelOnScroll() {
    if (!rosterSection || !rosterWheel) return;
    const rect = rosterSection.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    if (rect.top < viewportHeight && rect.bottom > 0) {
      const scrollY = window.scrollY;
      const rotationAngle = (scrollY * 0.15) % 360;
      const translateY = (rect.top * 0.12);

      rosterWheel.style.transform = `rotate(${rotationAngle}deg)`;
      rosterWheelWrap.style.transform = `translateY(${translateY}px)`;
    }
  }


  /* ==========================================================================
     3. THROWABLE CARD DECK PHYSICS ENGINE
     ========================================================================== */
  const deckContainer = document.getElementById('card-deck');
  const deckCards = Array.from(document.querySelectorAll('.deck-card'));
  const progressDots = Array.from(document.querySelectorAll('.dot-btn'));
  const metaCode = document.getElementById('meta-code');
  const metaTitle = document.getElementById('meta-title');

  let stackOrder = [0, 1, 2, 3]; // Stores indices of cards from top to bottom
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let currentDeltaX = 0;
  let currentDeltaY = 0;
  let activeCardIndex = stackOrder[0];

  const stackTransforms = [
    { x: 0, y: 0, rot: -3, scale: 1.0, z: 4 },
    { x: 8, y: -6, rot: 2, scale: 0.96, z: 3 },
    { x: -6, y: -12, rot: -1.5, scale: 0.92, z: 2 },
    { x: 12, y: -18, rot: 3, scale: 0.92, z: 1 }
  ];

  function applyStackTransforms() {
    stackOrder.forEach((cardIndex, positionIndex) => {
      const card = deckCards[cardIndex];
      const tf = stackTransforms[positionIndex];
      
      card.classList.remove('is-dragging', 'is-throwing');
      card.style.zIndex = tf.z;
      card.style.transform = `translate3d(${tf.x}px, ${tf.y}px, 0) rotate(${tf.rot}deg) scale(${tf.scale})`;
    });

    // Update Pagination & Active Meta Info
    const topCardIndex = stackOrder[0];
    const topCard = deckCards[topCardIndex];
    
    if (metaCode && metaTitle && topCard) {
      metaCode.textContent = topCard.getAttribute('data-code');
      metaTitle.textContent = topCard.getAttribute('data-title');
    }

    progressDots.forEach((dot, i) => {
      if (i === topCardIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  function getTopCard() {
    return deckCards[stackOrder[0]];
  }

  // Pointer Drag Handlers
  function onPointerDown(e) {
    if (isDragging) return;
    const topCard = getTopCard();
    if (!topCard.contains(e.target)) return;

    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    currentDeltaX = 0;
    currentDeltaY = 0;

    topCard.classList.add('is-dragging');
    topCard.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    currentDeltaX = e.clientX - startX;
    currentDeltaY = e.clientY - startY;

    const topCard = getTopCard();
    const rotation = currentDeltaX * 0.07; // Proportional rotation
    const liftScale = 1.03;

    topCard.style.transform = `translate3d(${currentDeltaX}px, ${currentDeltaY}px, 0) rotate(${rotation}deg) scale(${liftScale})`;
  }

  function onPointerUp(e) {
    if (!isDragging) return;
    isDragging = false;

    const topCard = getTopCard();
    topCard.releasePointerCapture(e.pointerId);
    topCard.classList.remove('is-dragging');

    const threshold = deckContainer.offsetWidth * 0.12; // ~50px drag threshold

    if (Math.abs(currentDeltaX) > threshold) {
      // Throw Card Away!
      throwTopCard(currentDeltaX > 0 ? 1 : -1);
    } else {
      // Snap Back
      applyStackTransforms();
    }
  }

  function throwTopCard(direction = 1) {
    const topCard = getTopCard();
    topCard.classList.add('is-throwing');
    
    const throwDistance = deckContainer.offsetWidth * 1.3 * direction;
    const throwRotation = direction * 24;

    topCard.style.transform = `translate3d(${throwDistance}px, ${currentDeltaY - 40}px, 0) rotate(${throwRotation}deg) scale(0.9)`;

    setTimeout(() => {
      // Rotate stack array: move front element to back
      const thrownCard = stackOrder.shift();
      stackOrder.push(thrownCard);
      applyStackTransforms();
    }, 320);
  }

  // Keyboard Navigation (Left / Right Arrow Keys)
  if (deckContainer) {
    deckContainer.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        throwTopCard(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        throwTopCard(-1);
      }
    });

    // Attach Pointer Events
    deckContainer.addEventListener('pointerdown', onPointerDown);
    deckContainer.addEventListener('pointermove', onPointerMove);
    deckContainer.addEventListener('pointerup', onPointerUp);
    deckContainer.addEventListener('pointercancel', onPointerUp);
  }

  // Pagination Dots Click Handler
  progressDots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      const targetIdx = parseInt(dot.getAttribute('data-target'), 10);
      if (isNaN(targetIdx)) return;

      // Cycle stack until targetIdx is at top
      let attempts = 0;
      while (stackOrder[0] !== targetIdx && attempts < 4) {
        const item = stackOrder.shift();
        stackOrder.push(item);
        attempts++;
      }
      applyStackTransforms();
    });
  });

  // Flip Front/Back Artwork on Slide 3
  const flipArtwork = document.getElementById('artwork-2');
  if (flipArtwork) {
    flipArtwork.addEventListener('click', () => {
      flipArtwork.classList.toggle('is-flipped');
    });
  }

  // Initialize Deck Stack Layout
  applyStackTransforms();


  /* ==========================================================================
     4. ROSTER INTERACTIVE WAVEFORM & SOUND SIMULATOR
     ========================================================================== */
  const rosterRows = document.querySelectorAll('.roster-row');
  const WAVE_BARS = 40;

  // Deterministic pseudo-random height, unique per row + bar index
  function waveHeight(rowIndex, barIndex) {
    const seed = (rowIndex * 57 + barIndex * 29) % 100;
    return 25 + Math.round(Math.abs(Math.sin(seed)) * 75);
  }

  rosterRows.forEach((row, rowIndex) => {
    const track = row.querySelector('.roster-wave-track');
    if (!track) return;

    let barsMarkup = '';
    for (let i = 0; i < WAVE_BARS; i++) {
      const h = waveHeight(rowIndex, i);
      const duration = (0.8 + ((i * 13) % 50) / 100).toFixed(2);
      const delay = -(((i * 7) % 25) / 100).toFixed(2);
      barsMarkup += `<span class="wave-bar" style="height:${h}%; animation-duration:${duration}s; animation-delay:${delay}s"></span>`;
    }
    track.innerHTML = barsMarkup;

    row.addEventListener('click', () => {
      const isActive = row.classList.contains('is-active');
      // Close all rows, reset borders
      rosterRows.forEach(r => {
        r.classList.remove('is-active');
        r.style.borderColor = 'var(--hairline)';
      });
      // Re-open the clicked row if it wasn't already active
      if (!isActive) {
        row.classList.add('is-active');
        row.style.borderColor = 'var(--amber)';
      }
    });
  });


  /* ==========================================================================
     5. BUTTON ACTION FEEDBACK
     ========================================================================== */
  const btnPlayAll = document.getElementById('btn-play-all');
  if (btnPlayAll) {
    btnPlayAll.addEventListener('click', () => {
      const originalText = btnPlayAll.textContent;
      btnPlayAll.textContent = 'PLAYING SAMPLER...';
      btnPlayAll.style.backgroundColor = 'var(--amber)';
      btnPlayAll.style.borderColor = 'var(--amber)';
      btnPlayAll.style.color = 'var(--ground)';
      
      setTimeout(() => {
        btnPlayAll.textContent = originalText;
        btnPlayAll.style.backgroundColor = '';
        btnPlayAll.style.borderColor = '';
        btnPlayAll.style.color = '';
      }, 3000);
    });
  }

});
