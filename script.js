// script.js

// ---------------------
// 1) REMOVE ES imports:
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// ---------------------

// 2) DOMContentLoaded for global modals & card clicks
document.addEventListener("DOMContentLoaded", () => {
  const kontaktBtn           = document.getElementById("kontaktBtn");
  const pokreniBtn           = document.getElementById("pokreniBtn");
  const contactModal         = document.getElementById("contactModal");
  const thankYouModal        = document.getElementById("thankYouModal");
  const closeContactModalBtn = document.getElementById("closeContactModal");
  const closeThankYouModalBtn= document.getElementById("closeThankYouModal");
  const contactForm          = document.getElementById("contactForm");

  if (kontaktBtn)  kontaktBtn.addEventListener("click", () => showModal(contactModal));
  if (pokreniBtn)  pokreniBtn.addEventListener("click", () => showModal(contactModal));
  if (closeContactModalBtn) closeContactModalBtn.addEventListener("click", () => hideModal(contactModal));
  if (closeThankYouModalBtn) closeThankYouModalBtn.addEventListener("click", () => hideModal(thankYouModal));

  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      hideModal(contactModal);
      showModal(thankYouModal);
      contactForm.reset();
    });
  }

  // 3) CARD CLICK => Detailed View (.card)
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => {
      const { solddate, price, beds, baths, sqft, address, img } = card.dataset;
      const query = new URLSearchParams({ soldDate: solddate, price, beds, baths, sqft, address, img }).toString();
      window.location.href = 'detailedView.html?' + query;
    });
  });

  // 4) .property-card => Detailed View
  document.querySelectorAll('.property-card').forEach(card => {
    if (card.classList.contains('card')) return;
    card.addEventListener('click', (e) => {
      if (e.target.closest('.dots-button') || e.target.closest('.dots-menu')) return;
      const { solddate, price, beds, baths, sqft, address, img } = card.dataset;
      const query = new URLSearchParams({ soldDate: solddate, price, beds, baths, sqft, address, img }).toString();
      window.location.href = 'detailedView.html?' + query;
    });
  });
});

function toHttps(url){
  if (!url || url.startsWith("http")) return url;
  const m = url.match(/^gs:\/\/([^/]+)\/(.+)$/);
  if (!m) return url;                                    // malformed
  const [, bucket, object] = m;
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/` +
         encodeURIComponent(object) + '?alt=media';
}
const PLACEHOLDER = "https://via.placeholder.com/400x200?text=No+Image";

/**
 * Format a numeric price into a human‑readable European format with spaces
 * between groups of three digits and append a euro symbol.
 * Examples: 300000 → "300 000€", 1250000 → "1 250 000€".
 * If the input cannot be parsed as a number, it returns the original value unchanged.
 * @param {number|string} value
 * @returns {string}
 */
function formatPriceEUR(value) {
  const num = Number(value);
  if (!isFinite(num)) return String(value || '');
  // Insert a space every 3 digits from the right, then append the euro sign
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + '€';
}

// Make the helper available globally so inline scripts (like detailedView.html)
// can call it directly.
if (typeof window !== 'undefined') {
  window.formatPriceEUR = formatPriceEUR;
}


// Helper modal functions
function showModal(modal) { if (modal) modal.style.display = "flex"; }
function hideModal(modal) { if (modal) modal.style.display = "none"; }

// 5) Translations & language toggle
const translations = {
  hr: { navHome:"Početna", navBuy:"Kupnja", navSell:"Prodaja", navLang:"Jezik", navLogin:"Log in", navSignup:"Sign Up",
        heroHeading:"Pronađite nekretninu svojih snova.", contactUsTitle:"Kontaktirajte nas", submitBtnText:"Pošalji", labelName:"Ime:" },
  en: { navHome:"Home", navBuy:"Buy", navSell:"Sell", navLang:"Language", navLogin:"Log in", navSignup:"Sign Up",
        heroHeading:"Find your dream property.", contactUsTitle:"Contact Us", submitBtnText:"Send", labelName:"Name:" }
};

function toggleLangMenu(e){e.preventDefault();const m=document.getElementById("langMenu");if(!m)return;m.style.display=m.style.display==="block"?"none":"block";}
function setLanguage(lang){
  localStorage.setItem("siteLang",lang);
  document.querySelectorAll("[data-i18n]").forEach(el=>{
    const k=el.getAttribute("data-i18n");
    if(translations[lang][k]) el.textContent=translations[lang][k];
  });
  const m=document.getElementById("langMenu"); if(m) m.style.display="none";
}
document.addEventListener("DOMContentLoaded",()=>setLanguage(localStorage.getItem("siteLang")||"hr"));

// 6) Highlight active nav link
document.addEventListener("DOMContentLoaded",()=>{
  const cur=window.location.pathname;
  document.querySelectorAll('nav a').forEach(a=>{
    if(cur.endsWith(a.getAttribute('href'))) a.classList.add('active');
  });
});

// 7) Firebase config & init
const firebaseConfig = {
  apiKey:"AIzaSyCyhExn2DyFY5_PDx5sqtkB_jpwGbgnHqs",
  authDomain:"sotomonte-a57be.firebaseapp.com",
  projectId:"sotomonte-a57be",
  storageBucket:"sotomonte-a57be.appspot.com",
  messagingSenderId:"693301329308",
  appId:"1:693301329308:web:97f80e2e2347d7df561c59",
  measurementId:"G-2R1GVLX8NB"
};

firebase.initializeApp(firebaseConfig);
if (typeof firebase.analytics === "function") {
  firebase.analytics();
}

const db   = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

/* ---------- NAVBAR GREETING BLOCK ---------- */
(function initNavbarGreeting(){
  const hideCSS = document.createElement("style");
  hideCSS.textContent = ".header-buttons{visibility:hidden}";
  document.head.appendChild(hideCSS);

  function whenHeaderButtons(cb){
    const btns = document.querySelector(".header-buttons");
    if (btns) { cb(btns); return; }
    new MutationObserver((m,o)=>{
      const b = document.querySelector(".header-buttons");
      if (b){ o.disconnect(); cb(b); }
    }).observe(document.body,{childList:true,subtree:true});
  }

  auth.onAuthStateChanged(user=>{
    whenHeaderButtons(async (container)=>{
      let html;
      if (user){
        let name="";
        try{
          const snap = await db.doc(`users/${user.uid}`).get();
          name = snap.exists && snap.data().name ? snap.data().name : "";
        }catch(e){ console.error(e); }
        if(!name && user.email) name = user.email.split("@")[0];

        html = `
          <span class="welcome">Dobrodošli, ${name}</span>
          <button id="logoutBtn" class="signup-btn">Odjava</button>`;
      }else{
        html = `
          <a href="login.html"    class="login-btn">Prijava</a>
          <a href="register.html" class="signup-btn">Registracija</a>`;
      }
      container.innerHTML = html;
      container.style.visibility = "visible";

      document.getElementById("logoutBtn")?.addEventListener("click",async()=>{
        await auth.signOut();
        location.reload();
      });
    });
  });
})();

/* -------- kupnja.html: fetch & render properties -------- */
document.addEventListener("DOMContentLoaded", () => {
  const propertyListings = document.getElementById("property-listings");
  if (!propertyListings) return;

  fetchProperties().then(list => {
    propertyListings.innerHTML = "";
    list.forEach(p => {
      const firstImg = toHttps(p.images?.[0]) || PLACEHOLDER;

      const el = document.createElement("div");
      el.classList.add("property-item");
      el.innerHTML = `
        <img src="${firstImg}" alt="Property">
        <h2>${p.title || p.address || "Nekretnina"}</h2>
        <p>Price: ${p.price}</p>
        <p>${p.isSold ? "Sold" : "Available"}</p>
        <a href="detailedView.html?id=${p.id}">View Details</a>`;
      propertyListings.appendChild(el);
    });
  }).catch(err => console.error("Error loading properties:", err));
});

async function fetchProperties(){
  const snap = await db.collection("properties").get();
  return snap.docs.map(d=>({ id:d.id, title:d.data().title||"", ...d.data() }));
}

function formatPriceEUR(value) {
  const num = Number(value);
  if (!isFinite(num)) return String(value || '');
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + '€';
}


/* === SCROLL-REVEAL (unchanged) =========================================== */
document.addEventListener('DOMContentLoaded', () => {
  const revealEls=document.querySelectorAll('.hidden-left, .hidden-right, .hidden-bottom');
  const obs=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      const el=entry.target;
      if(entry.isIntersecting){
        el.classList.add('show');
        if(el.classList.contains('column-text')){
          [...el.children].forEach((c,i)=>{
            c.style.opacity='0';c.style.transform='translateY(20px)';
            setTimeout(()=>{c.style.transition='opacity .4s ease-out,transform .4s ease-out';
              c.style.opacity='1';c.style.transform='translateY(0)';},i*200);
          });
        }
        if(el.classList.contains('hidden-bottom')){
          el.querySelectorAll('.reveal-child').forEach((k,i)=>{
            k.style.opacity='0';k.style.transform='translateY(20px)';
            setTimeout(()=>{k.style.transition='opacity .4s ease-out,transform .4s ease-out';
              k.style.opacity='1';k.style.transform='translateY(0)';},i*100);
          });
        }
      }else{
        el.classList.remove('show');
        if(el.classList.contains('column-text')){
          [...el.children].forEach(c=>{c.style.opacity='0';c.style.transform='translateY(20px)';});
        }
        if(el.classList.contains('hidden-bottom')){
          el.querySelectorAll('.reveal-child')
            .forEach(k=>{k.style.opacity='0';k.style.transform='translateY(20px)';});
        }
      }
    });
  },{threshold:.15});
  revealEls.forEach(el=>obs.observe(el));
});

/*
 * Prodaja page hero slideshow
 * Fetches an array of image URLs from the Firestore collection "prodaja-hero"
 * (document ID "s5hfruiAj48xVr7btgY6"), then cycles through them as a
 * background for the hero section on prodaja.html. Each image is shown for
 * 2 seconds, then fades out over 1 second. The next image fades in
 * simultaneously, creating a smooth cross‑fade effect. A semi‑transparent
 * dark overlay is applied over each image to match the original colour.
 */
document.addEventListener('DOMContentLoaded', () => {
  // The original cross‑fade hero slideshow is disabled. We wrap
  // the implementation in a conditional that never runs so the
  // new zooming carousel can take effect instead.
  if (false) {
    const hero = document.getElementById('prodaja-hero');
    if (!hero) return;

  // Create two slides for cross‑fading backgrounds
  const slideA = document.createElement('div');
  const slideB = document.createElement('div');
  [slideA, slideB].forEach(slide => {
    slide.className = 'hero-slide';
    // initially invisible
    slide.style.opacity = '0';
    hero.insertBefore(slide, hero.firstChild);
  });

  // Helper to set the background image with an overlay
  function setSlideImage(slide, url) {
    // Apply a dark semi‑transparent overlay on top of the image
    slide.style.backgroundImage =
      `linear-gradient(rgba(38,35,65,0.5), rgba(38,35,65,0.5)), url('${url}')`;
  }

  // Fetch the list of images from Firestore
  db.collection('prodaja-hero').doc('s5hfruiAj48xVr7btgY6').get().then(doc => {
    const data = doc && doc.exists ? doc.data() : null;
    const images = data && Array.isArray(data.images) ? data.images.filter(Boolean) : [];
    if (!images.length) return;
    // Preload images by creating Image objects
    images.forEach(src => { const img = new Image(); img.src = src; });

    // State trackers
    let visible = slideA;      // currently visible slide
    let hidden  = slideB;      // slide that will be faded in next
    let index   = 0;           // index of the next image to show

    // Initialise the first image
    setSlideImage(visible, images[index % images.length]);
    visible.style.opacity = '1';
    index++;

    const displayTime   = 2000; // milliseconds each image stays fully visible
    const fadeDuration  = 1000; // duration of fade transitions

    function cycle() {
      // Set the next image on the hidden slide
      setSlideImage(hidden, images[index % images.length]);
      // Bring the hidden slide to the front and fade it in
      hidden.style.opacity = '1';
      // Fade out the currently visible slide
      visible.style.opacity = '0';
      // After the fade duration, swap the slide references and update index
      setTimeout(() => {
        const temp = visible;
        visible = hidden;
        hidden  = temp;
        index   = (index + 1) % images.length;
      }, fadeDuration);
    }

    // Start cycling after the initial display period. The first change occurs
    // after `displayTime` milliseconds, then repeats every displayTime + fadeDuration.
    setTimeout(cycle, displayTime);
    setInterval(cycle, displayTime + fadeDuration);
    }).catch(err => {
      console.error('Error loading prodaja-hero images:', err);
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  /*
   * Set a single background image on the prodaja hero section.
   * The second image from Firestore (or the first if there is only one)
   * will be used. A semi-transparent overlay is applied over the image
   * to match the site's dark colour (#262341). There is no carousel;
   * the background remains static.
   */
  const hero = document.getElementById('prodaja-hero');
  if (!hero) return;
  db.collection('prodaja-hero').doc('s5hfruiAj48xVr7btgY6').get().then(doc => {
    const data = doc && doc.exists ? doc.data() : null;
    const images = data && Array.isArray(data.images) ? data.images.filter(Boolean) : [];
    if (!images.length) return;
    // Choose the second image if available; otherwise fall back to the first
    const selected = toHttps(images[1] || images[0]);
    // Apply the background with a 50% transparent dark overlay (#262341)
    hero.style.backgroundImage = `linear-gradient(rgba(38,35,65,0.5), rgba(38,35,65,0.5)), url('${selected}')`;
    hero.style.backgroundSize = 'cover';
    hero.style.backgroundPosition = 'center';
    hero.style.backgroundRepeat = 'no-repeat';
  }).catch(err => {
    console.error('Error loading prodaja-hero image:', err);
  });
});

/*
 * Benefit cards tilt effect
 * Applies a subtle 3D rotation to each benefit card based on the
 * cursor position. Moving the mouse over a card tilts it toward
 * the cursor; leaving the card resets it.
 */
document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.benefit-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const dx = (x - centerX) / centerX;
      const dy = (y - centerY) / centerY;
      const tiltX = dy * 5;
      const tiltY = -dx * 5;
      card.style.transform = `perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg)';
    });
  });
});

/* --------------------------------------------------------
   INDEX – homepage: show cards, but SEARCH redirects
--------------------------------------------------------- */
document.addEventListener("DOMContentLoaded",()=>{
  const cardWrap   = document.getElementById("indexProperties");
  const searchInp  = document.getElementById("searchInput");
  const searchBtn  = document.getElementById("searchBtn");
  if(!cardWrap) return;                     // run only on index.html

  // Show a few cards on the homepage (unchanged)
  db.collection("properties").limit(10).onSnapshot(snap=>{
    cardWrap.innerHTML="";
    snap.forEach(d=>{
      const data=d.data();
      const img = toHttps(data.images?.[0]) || placeholder;

      const div = document.createElement("div");
      div.className="card";
      div.dataset.solddate = data.isSold?"PRODANO":"Dostupno";
      div.dataset.price    = `$${data.price||"-"}`;
      div.dataset.beds     = data.bedAmount||"-";
      div.dataset.baths    = data.bathAmount||"-";
      div.dataset.address  = data.address||"";
      div.dataset.img      = (data.images||[]).join("|");
      div.innerHTML=`
        <img src="${img}" alt="preview">
        <div class="card-content">
          <div class="sold-date"><span class="red-dot">•</span> ${data.isSold?"PRODANO":"Dostupno"}</div>
          <h3>$${data.price||"-"}</h3>
          <div class="details">${data.bedAmount||"-"} bed&nbsp;${data.bathAmount||"-"} bath</div>
          <div class="address">${data.address||"N/A"}<br>${data.cityName||""}</div>
        </div>`;
      div.onclick=()=>location.href=
        "detailedView.html?"+new URLSearchParams({
          soldDate:div.dataset.solddate,
          price:div.dataset.price,
          beds:div.dataset.beds,
          baths:div.dataset.baths,
          address:div.dataset.address,
          img:div.dataset.img
        });
      cardWrap.appendChild(div);
    });
  });

  // Redirect search → kupnja.html?search=QUERY
  function goToKupnja(){
    const q = (searchInp?.value || "").trim();
    const url = q ? `kupnja.html?search=${encodeURIComponent(q)}` : "kupnja.html";
    window.location.href = url;
  }
  searchBtn?.addEventListener("click", e => { e.preventDefault(); goToKupnja(); });
  searchInp?.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); goToKupnja(); }
  });
});


// Mobile Navbar & Sidebar functionality
// Because navbar.html is injected asynchronously into each page, we wait for the
// relevant elements to exist before attaching event listeners. We also listen
// to the Firebase auth state and toggle the profile/logout icons accordingly.
(function () {
  let currentUser = null;

  /**
   * Wait until the mobile navbar elements (e.g., the hamburger button) exist in
   * the DOM. Once found, the provided callback is invoked. If the elements
   * already exist, the callback is executed immediately.
   * @param {Function} cb
   */
  function whenNavbarLoaded(cb) {
    // If hamburger exists now, nav is ready
    if (document.getElementById('hamburger')) {
      cb();
      return;
    }
    // Otherwise observe DOM for insertion
    const observer = new MutationObserver((mutations, obs) => {
      if (document.getElementById('hamburger')) {
        obs.disconnect();
        cb();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Updates the visibility of the mobile profile and logout icons and the
   * sidebar logout link depending on whether there is a logged in user.
   */
  function updateIcons() {
    const profileIcon   = document.getElementById('mobileProfileIcon');
    const logoutIcon    = document.getElementById('mobileLogoutIcon');
    const sidebarLogout = document.getElementById('sidebarLogout');
    if (!profileIcon && !logoutIcon) return;
    if (currentUser) {
      if (profileIcon) profileIcon.style.display = 'none';
      if (logoutIcon)  logoutIcon.style.display  = 'inline-flex';
      if (sidebarLogout) sidebarLogout.style.display = 'list-item';
    } else {
      if (profileIcon) profileIcon.style.display = 'inline-flex';
      if (logoutIcon)  logoutIcon.style.display  = 'none';
      if (sidebarLogout) sidebarLogout.style.display = 'none';
    }
  }

  // Track auth state; update currentUser variable and refresh icons when ready
  if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().onAuthStateChanged(user => {
      currentUser = user;
      updateIcons();
    });
  }

  // Once the navbar is loaded, attach event handlers and refresh icons
  whenNavbarLoaded(() => {
    const hamburger       = document.getElementById('hamburger');
    const sidebar         = document.getElementById('sidebarNav');
    const overlay         = document.getElementById('sidebarOverlay');
    const mobileLogout    = document.getElementById('mobileLogoutIcon');
    const sidebarLogout   = document.getElementById('sidebarLogout');

    // Update icons after nav insertion
    updateIcons();

    // We no longer attach click handlers directly here; see global event delegation below.

    // Attach logout handlers to the mobile logout icon and sidebar logout link
    const fireMainLogout = (e) => {
      e?.preventDefault();
      const mainLogoutBtn = document.getElementById('logoutBtn');  // the main navbar logout button (added in greeting logic)
      if (mainLogoutBtn) mainLogoutBtn.click();
    };
    mobileLogout?.addEventListener('click', fireMainLogout);
    sidebarLogout?.addEventListener('click', fireMainLogout);
  });

  /**
   * Global click event delegation for toggling the sidebar. This attaches a single
   * listener on the document and checks whether the clicked element (or its
   * ancestors) is the hamburger, overlay, or a sidebar link. This works even if
   * the navbar is injected into the page after the script has run.
   */
  document.addEventListener('click', (event) => {
    const burgerClick  = event.target.closest('#hamburger');
    const overlayClick = event.target.closest('#sidebarOverlay');
    const linkClick    = event.target.closest('#sidebarNav a');
    if (!burgerClick && !overlayClick && !linkClick) return;
    // Toggle the sidebar using current DOM elements
    const sidebar   = document.getElementById('sidebarNav');
    const overlay   = document.getElementById('sidebarOverlay');
    const hamburger = document.getElementById('hamburger');
    if (!sidebar || !overlay || !hamburger) return;
    const open = sidebar.classList.toggle('open');
    overlay.classList.toggle('open', open);
    hamburger.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
})();

/* ------------------------------------------------------------------
   Lightbox for carousel images (detailedView.html)
-------------------------------------------------------------------*/
document.addEventListener('DOMContentLoaded', () => {
  const track   = document.querySelector('.carousel-track');
  const overlay = document.getElementById('imageLightbox');
  const bigImg  = overlay.querySelector('img');
  const closeX  = document.getElementById('lightboxClose');

  if (!track || !overlay) return;

  // open on click
  track.addEventListener('click', e => {
    const target = e.target.closest('img');
    if (!target) return;
    bigImg.src = target.src;
    overlay.style.display = 'flex';
  });

  // close on overlay click or X click
  const close = () => { overlay.style.display = 'none'; bigImg.src = ''; };
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  closeX.addEventListener('click', close);
});


document.addEventListener('DOMContentLoaded', () => {
  const overlay     = document.getElementById('imageOverlay');
  const overlayImg  = document.getElementById('overlayImg');
  const overlayClose = document.getElementById('overlayClose');
  if (overlay && overlayImg && overlayClose) {
    // Open overlay when any carousel image is clicked
    const carouselTrack = document.getElementById('carouselTrack');
    carouselTrack.addEventListener('click', (e) => {
      if (e.target.tagName === 'IMG') {
        overlay.style.display = 'flex';
        overlayImg.src = e.target.src;
      }
    });
    // Close overlay when 'X' button is clicked
    overlayClose.addEventListener('click', () => {
      overlay.style.display = 'none';
    });
    // Also close overlay when clicking outside the image
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.style.display = 'none';
      }
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const form   = document.getElementById('passwordRecoveryForm');
  if (!form) return;                     // run only on passwordRecovery.html

  const msgBox = document.getElementById('recoveryMsg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msgBox.style.display = 'block';      // make sure it’s visible
    msgBox.textContent   = '';           // clear previous text
    msgBox.style.color   = '';           // default red from .auth-error

    const email = document.getElementById('recoveryEmail').value.trim();

    try {
      /*  localisation + where the email-link should land  */
      auth.languageCode = 'hr';
      const settings = {
        url: window.location.origin + '/newPassword.html',
        handleCodeInApp: false
      };
      await auth.sendPasswordResetEmail(email, settings);

      msgBox.style.color = 'green';
      msgBox.textContent = 'Poslan je email s uputama za resetiranje lozinke.';
    } catch (err) {
      let m = 'Došlo je do pogreške. Pokušajte ponovo.';
      if (err.code === 'auth/user-not-found')    m = 'Račun s tom email adresom ne postoji.';
      if (err.code === 'auth/invalid-email')     m = 'Neispravna email adresa.';
      if (err.code === 'auth/too-many-requests') m = 'Previše pokušaja. Pokušajte kasnije.';
      msgBox.textContent = m;
    }
  });
});


// ========== HERO: fade-in title & typewriter paragraph ==========
document.addEventListener('DOMContentLoaded', () => {
  const heroTitle = document.getElementById('prodajaHeroTitle');
  const heroText  = document.getElementById('prodajaHeroText');

  // Fade-in H1 (only on pages that have it)
  if (heroTitle) {
    heroTitle.classList.add('hero-fade-in');   // start hidden
    // next frame -> show
    requestAnimationFrame(() => heroTitle.classList.add('show'));
  }

  // Typewriter for paragraph
  if (heroText) {
    const full = heroText.textContent.trim();
    heroText.textContent = ''; // clear before typing
    typeWriter(heroText, full, 20); // speed (ms per char)
  }

  // Reveal on scroll for benefit cards
  const cards = document.querySelectorAll('.benefit-card');
  if (cards.length) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in-view');
          obs.unobserve(e.target); // animate once
        }
      });
    }, { threshold: 0.2 });

    cards.forEach(c => io.observe(c));
  }
});

/**
 * Typewriter effect: types `text` into `el`
 * @param {HTMLElement} el
 * @param {string} text
 * @param {number} speed  ms per character (lower = faster)
 */
function typeWriter(el, text, speed = 25) {
  let i = 0;
  function tick() {
    // add a couple of chars per frame for smoother feel on mobile
    el.textContent += text.slice(i, i + 2);
    i += 2;
    if (i < text.length) {
      setTimeout(tick, speed);
    }
  }
  tick();
}

