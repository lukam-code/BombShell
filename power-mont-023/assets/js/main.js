/* POWER MONT 023 — navigacija, suptilne animacije i kontakt forma */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Header: pozadina na scroll ---------- */
  var header = document.querySelector("[data-header]");
  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobilni meni ---------- */
  var toggle = document.querySelector("[data-menu-toggle]");
  var menu = document.querySelector("[data-mobile-menu]");

  function setMenu(open) {
    if (!toggle || !menu) return;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.querySelector(".visually-hidden").textContent = open ? "Zatvori meni" : "Otvori meni";
    menu.hidden = !open;
    header.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
    if (open) {
      var first = menu.querySelector("a");
      if (first) first.focus();
    }
  }

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !menu.hidden) {
        setMenu(false);
        toggle.focus();
      }
    });
    window.matchMedia("(min-width: 960px)").addEventListener("change", function (mq) {
      if (mq.matches) setMenu(false);
    });
  }

  /* ---------- Reveal animacije ---------- */
  var revealEls = document.querySelectorAll("[data-reveal], [data-reveal-media]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    // blagi redosled za elemente koji se pojavljuju zajedno
    var groups = new Map();
    revealEls.forEach(function (el) {
      var parent = el.parentElement;
      var i = groups.get(parent) || 0;
      el.style.transitionDelay = Math.min(i * 70, 280) + "ms";
      groups.set(parent, i + 1);
      io.observe(el);
    });
  }

  /* ---------- Kontakt forma ---------- */
  var form = document.querySelector("[data-contact-form]");
  if (!form) return;

  var CONTACT_EMAIL = "milutinjankovic@hotmail.rs";
  var success = document.querySelector("[data-form-success]");
  var successText = document.querySelector("[data-success-text]");
  var status = form.querySelector("[data-form-status]");
  var submitBtn = form.querySelector("[data-submit]");
  var submitLabel = form.querySelector("[data-submit-label]");
  var defaultSuccessHTML = successText ? successText.innerHTML : "";

  var rules = {
    ime: function (v) {
      if (!v) return "Unesite ime i prezime.";
      if (v.length < 2) return "Ime i prezime je prekratko.";
      return "";
    },
    telefon: function (v) {
      if (!v) return "Unesite broj telefona.";
      var digits = v.replace(/\D/g, "");
      if (!/^[+\d\s()\/.-]+$/.test(v) || digits.length < 8 || digits.length > 15) {
        return "Unesite ispravan broj telefona, npr. 064 123 4567.";
      }
      return "";
    },
    email: function (v) {
      if (!v) return "";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "Unesite ispravnu email adresu.";
      return "";
    },
    poruka: function (v) {
      if (!v) return "Napišite poruku.";
      if (v.length < 10) return "Poruka treba da ima najmanje 10 karaktera.";
      return "";
    }
  };

  function validateField(input) {
    var rule = rules[input.name];
    if (!rule) return true;
    var msg = rule(input.value.trim());
    var err = document.getElementById(input.name + "-error");
    if (err) err.textContent = msg;
    if (msg) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
    return !msg;
  }

  Object.keys(rules).forEach(function (name) {
    var input = form.elements[name];
    if (!input) return;
    // greške se prikazuju tek kada korisnik napusti polje, a uklanjaju čim je unos ispravan
    input.addEventListener("blur", function () {
      if (input.value.trim() || input.hasAttribute("aria-invalid")) validateField(input);
    });
    input.addEventListener("input", function () {
      if (input.hasAttribute("aria-invalid")) validateField(input);
    });
  });

  function setLoading(loading) {
    submitBtn.disabled = loading;
    submitLabel.textContent = loading ? "Slanje…" : "Pošalji upit";
  }

  function showSuccess(html) {
    if (successText) successText.innerHTML = html || defaultSuccessHTML;
    form.hidden = true;
    success.hidden = false;
    success.focus();
  }

  function collect() {
    return {
      ime: form.elements.ime.value.trim(),
      telefon: form.elements.telefon.value.trim(),
      email: form.elements.email.value.trim(),
      poruka: form.elements.poruka.value.trim()
    };
  }

  function mailtoFallback(data) {
    var body =
      "Ime i prezime: " + data.ime + "\n" +
      "Telefon: " + data.telefon + "\n" +
      (data.email ? "Email: " + data.email + "\n" : "") +
      "\n" + data.poruka;
    window.location.href =
      "mailto:" + CONTACT_EMAIL +
      "?subject=" + encodeURIComponent("Upit sa sajta – " + data.ime) +
      "&body=" + encodeURIComponent(body);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    status.textContent = "";
    status.classList.remove("is-error");

    var firstInvalid = null;
    Object.keys(rules).forEach(function (name) {
      var input = form.elements[name];
      if (!validateField(input) && !firstInvalid) firstInvalid = input;
    });
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    // zamka za botove: tiho "uspešno", bez slanja
    if (form.elements.website.value) {
      showSuccess();
      return;
    }

    var data = collect();
    var endpoint = (form.getAttribute("data-endpoint") || "").trim();

    if (!endpoint) {
      // Backend još nije povezan: otvara se email program posetioca sa popunjenim upitom.
      mailtoFallback(data);
      showSuccess(
        "Otvoren je vaš email program sa pripremljenom porukom – potrebno je samo da je pošaljete. " +
        "Ako se ništa nije otvorilo, pišite na <a href=\"mailto:" + CONTACT_EMAIL + "\">" + CONTACT_EMAIL +
        "</a> ili pozovite <a href=\"tel:0641204359\">064 120 4359</a>."
      );
      success.querySelector(".form-success-title").textContent = "Upit je pripremljen.";
      return;
    }

    setLoading(true);
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(Object.assign({ _subject: "Upit sa sajta – " + data.ime }, data))
    })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        form.reset();
        showSuccess();
      })
      .catch(function () {
        status.classList.add("is-error");
        status.innerHTML =
          "Slanje trenutno nije uspelo. Pokušajte ponovo ili nas pozovite na " +
          "<a href=\"tel:0641204359\">064 120 4359</a>.";
      })
      .then(function () { setLoading(false); });
  });

  var resetBtn = document.querySelector("[data-form-reset]");
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      form.reset();
      success.hidden = true;
      success.querySelector(".form-success-title").textContent = "Hvala, upit je poslat.";
      form.hidden = false;
      form.elements.ime.focus();
    });
  }
})();
