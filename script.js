// script.js

// 1) GLOBAL CONTACT FORM & MODALS
document.addEventListener("DOMContentLoaded", () => {
    const kontaktBtn          = document.getElementById("kontaktBtn");
    const pokreniBtn          = document.getElementById("pokreniBtn");
    const contactModal        = document.getElementById("contactModal");
    const thankYouModal       = document.getElementById("thankYouModal");
    const closeContactModalBtn= document.getElementById("closeContactModal");
    const closeThankYouModalBtn= document.getElementById("closeThankYouModal");
    const contactForm         = document.getElementById("contactForm");
  
    // If these elements exist on the page, set up event listeners:
    if (kontaktBtn) {
      kontaktBtn.addEventListener("click", () => showModal(contactModal));
    }
    if (pokreniBtn) {
      pokreniBtn.addEventListener("click", () => showModal(contactModal));
    }
    if (closeContactModalBtn) {
      closeContactModalBtn.addEventListener("click", () => hideModal(contactModal));
    }
    if (closeThankYouModalBtn) {
      closeThankYouModalBtn.addEventListener("click", () => hideModal(thankYouModal));
    }
    if (contactForm) {
      contactForm.addEventListener("submit", (e) => {
        e.preventDefault();
        hideModal(contactModal);
        showModal(thankYouModal);
        contactForm.reset();
      });
    }
  
    // 2) CARD CLICK => Detailed View (Existing logic for .card)
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        // If you want to exclude the "three dots" from opening detail:
        // if (e.target.closest('.dots-button') || e.target.closest('.dots-menu')) return;
  
        const { solddate, price, beds, baths, sqft, address, img } = card.dataset;
  
        const query = new URLSearchParams({
          soldDate: solddate,
          price,
          beds,
          baths,
          sqft,
          address,
          img
        }).toString();
  
        window.location.href = 'detailedView.html?' + query;
      });
    });
  
    // 3) NEW: .property-card also opens detailed view 
    // (but skip if it also has .card, to avoid double-listener triggers)
    const propCards = document.querySelectorAll('.property-card');
    propCards.forEach(card => {
      // if this element already has .card, we skip to avoid double triggers
      if (card.classList.contains('card')) return;
  
      card.addEventListener('click', (e) => {
        // Exclude the dots button/menu from opening detail
        if (e.target.closest('.dots-button') || e.target.closest('.dots-menu')) {
          return;
        }
  
        const soldDate = card.dataset.solddate   || '';
        const price    = card.dataset.price      || '';
        const beds     = card.dataset.beds       || '';
        const baths    = card.dataset.baths      || '';
        const sqft     = card.dataset.sqft       || '';
        const address  = card.dataset.address    || '';
        const img      = card.dataset.img        || '';
  
        const query = new URLSearchParams({
          soldDate,
          price,
          beds,
          baths,
          sqft,
          address,
          img
        }).toString();
  
        window.location.href = 'detailedView.html?' + query;
      });
    });
  });
  
  // 4) HELPER MODAL FUNCTIONS
  function showModal(modal) {
    if (modal) modal.style.display = "flex";
  }
  function hideModal(modal) {
    if (modal) modal.style.display = "none";
  }

  // script.js

const translations = {
    hr: {
      navHome: "Početna",
      navBuy: "Kupnja",
      navSell: "Prodaja",
      navLang: "Jezik",
      navLogin: "Log in",
      navSignup: "Sign Up",
  
      heroHeading: "Pronađite nekretninu svojih snova.",
      contactUsTitle: "Kontaktirajte nas",
      submitBtnText: "Pošalji",
      labelName: "Ime:",
      // ... more keys if needed
    },
    en: {
      navHome: "Home",
      navBuy: "Buy",
      navSell: "Sell",
      navLang: "Language",
      navLogin: "Log in",
      navSignup: "Sign Up",
  
      heroHeading: "Find your dream property.",
      contactUsTitle: "Contact Us",
      submitBtnText: "Send",
      labelName: "Name:",
      // ... more keys if needed
    }
  };
  
  function toggleLangMenu(event) {
    event.preventDefault();
    const menu = document.getElementById("langMenu");
    if (menu.style.display === "none" || !menu.style.display) {
      menu.style.display = "block";
    } else {
      menu.style.display = "none";
    }
  }
  
  function setLanguage(lang) {
    localStorage.setItem("siteLang", lang);
  
    document.querySelectorAll("[data-i18n]").forEach(elem => {
      const key = elem.getAttribute("data-i18n");
      if (translations[lang][key]) {
        elem.textContent = translations[lang][key];
      }
    });
  
    // Hide the dropdown after choosing
    const menu = document.getElementById("langMenu");
    if (menu) menu.style.display = "none";
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    // Re-apply saved language
    const savedLang = localStorage.getItem("siteLang") || "hr";
    setLanguage(savedLang);
  
    // The rest of your code:
    // contact modal references, card => detailedView, etc.
    // ...
  });
  