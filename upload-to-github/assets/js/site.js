/* Shared behaviour: navigation, enquiry forms, WhatsApp links. No dependencies. */
(function () {
  "use strict";
  var cfg = window.SITE_CONFIG || {};

  /* ---------- Mobile navigation ---------- */
  document.querySelectorAll("[data-nav-toggle]").forEach(function (btn) {
    var menu = document.getElementById(btn.getAttribute("aria-controls"));
    if (!menu) return;
    function close() {
      btn.setAttribute("aria-expanded", "false");
      menu.classList.remove("is-open");
    }
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      menu.classList.toggle("is-open", !open);
    });
    menu.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", close); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && btn.getAttribute("aria-expanded") === "true") { close(); btn.focus(); }
    });
  });

  /* ---------- WhatsApp: only shown when a number is configured ---------- */
  var wa = String(cfg.WHATSAPP_NUMBER || "").replace(/\D/g, "");
  if (wa.length >= 10) {
    var href = "https://wa.me/" + wa + "?text=" + encodeURIComponent(cfg.WHATSAPP_MESSAGE || "");
    document.querySelectorAll("[data-whatsapp]").forEach(function (el) {
      el.setAttribute("href", href);
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener");
      el.hidden = false;
    });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Forms ---------- */
  var MESSAGES = {
    name: "Enter your name.",
    clinic: "Enter your clinic's name.",
    phone: "Enter a 10-digit Indian mobile number, e.g. 98123 45678.",
    email: "Enter an email address like name@clinic.com.",
    consent: "Tick the box so we're allowed to contact you.",
    select: "Choose an option.",
    generic: "Fill in this field."
  };

  function normalisePhone(v) {
    var d = v.replace(/\D/g, "");
    if (d.length === 12 && d.indexOf("91") === 0) d = d.slice(2);
    if (d.length === 11 && d.charAt(0) === "0") d = d.slice(1);
    return d;
  }

  function validateField(field) {
    var v = field.type === "checkbox" ? field.checked : field.value.trim();
    var key = field.dataset.msg || field.name;
    var msg = "";
    if (field.required && (field.type === "checkbox" ? !v : v === "")) {
      msg = MESSAGES[key] || (field.tagName === "SELECT" ? MESSAGES.select : MESSAGES.generic);
    } else if (v && field.type === "tel" && !/^[6-9]\d{9}$/.test(normalisePhone(field.value))) {
      msg = MESSAGES.phone;
    } else if (v && field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(field.value.trim())) {
      msg = MESSAGES.email;
    }
    var err = document.getElementById(field.id + "-error");
    if (err) err.textContent = msg;
    field.setAttribute("aria-invalid", msg ? "true" : "false");
    var wrap = field.closest(".field");
    if (wrap) wrap.classList.toggle("has-error", !!msg);
    return !msg;
  }

  function setStatus(form, type, html) {
    var box = form.querySelector("[data-form-status]");
    if (!box) return;
    box.className = "form-status is-" + type;
    box.innerHTML = html;
    box.hidden = false;
    box.setAttribute("tabindex", "-1");
    box.focus({ preventScroll: false });
  }

  function collect(form) {
    var data = {};
    new FormData(form).forEach(function (val, key) { data[key] = typeof val === "string" ? val.trim() : val; });
    if (data.phone) data.phone = "+91 " + normalisePhone(data.phone);
    delete data.company_website; // honeypot
    return data;
  }

  function mailtoFallback(data) {
    var lines = Object.keys(data).filter(function (k) { return k !== "consent"; })
      .map(function (k) { return k.replace(/_/g, " ") + ": " + data[k]; });
    return "mailto:" + cfg.CONTACT_EMAIL +
      "?subject=" + encodeURIComponent("Website enquiry — " + (data.clinic || data.name || "dental clinic")) +
      "&body=" + encodeURIComponent(lines.join("\n"));
  }

  document.querySelectorAll("form[data-enquiry]").forEach(function (form) {
    var mode = form.getAttribute("data-enquiry"); // "studio" | "demo"
    var fields = Array.prototype.slice.call(form.querySelectorAll("input:not([type=hidden]):not([name=company_website]), select, textarea"));
    var submit = form.querySelector("[type=submit]");
    var label = submit ? submit.textContent : "";

    fields.forEach(function (f) {
      f.addEventListener("blur", function () { if (f.value || f.type === "checkbox") validateField(f); });
      f.addEventListener("input", function () { if (f.getAttribute("aria-invalid") === "true") validateField(f); });
      f.addEventListener("change", function () { if (f.getAttribute("aria-invalid") === "true") validateField(f); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstBad = null;
      fields.forEach(function (f) { if (!validateField(f) && !firstBad) firstBad = f; });
      if (firstBad) {
        var n = fields.filter(function (f) { return f.getAttribute("aria-invalid") === "true"; }).length;
        setStatus(form, "error", "<strong>" + n + (n === 1 ? " field needs" : " fields need") + " attention.</strong> Check the highlighted fields and try again.");
        firstBad.focus();
        return;
      }
      var hp = form.querySelector("[name=company_website]");
      if (hp && hp.value) { form.reset(); return; } // silently drop bots

      var data = collect(form);

      if (mode === "demo") {
        submit.disabled = true; submit.textContent = "Checking…";
        setTimeout(function () {
          submit.disabled = false; submit.textContent = label;
          form.reset();
          fields.forEach(function (f) { f.removeAttribute("aria-invalid"); });
          setStatus(form, "success", "<strong>Request received — in a live site.</strong> This is a demo concept, so nothing was sent and nothing was stored. On a real clinic site this goes straight to the front desk.");
        }, 600);
        return;
      }

      if (cfg.FORM_ENDPOINT) {
        submit.disabled = true; submit.textContent = "Sending…";
        var payload = Object.assign({}, data, { _subject: "Website enquiry — " + (data.clinic || data.name) });
        if (cfg.WEB3FORMS_KEY) payload.access_key = cfg.WEB3FORMS_KEY;
        fetch(cfg.FORM_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(payload)
        }).then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          form.reset();
          fields.forEach(function (f) { f.removeAttribute("aria-invalid"); });
          setStatus(form, "success", "<strong>Enquiry sent.</strong> I'll reply within one working day on the number or email you gave.");
        }).catch(function () {
          setStatus(form, "error", "<strong>Your enquiry didn't send.</strong> Check your connection and press “Send enquiry” again." +
            (cfg.CONTACT_EMAIL ? " Or email <a href=\"mailto:" + cfg.CONTACT_EMAIL + "\">" + cfg.CONTACT_EMAIL + "</a>." : ""));
        }).finally(function () {
          submit.disabled = false; submit.textContent = label;
        });
        return;
      }

      if (cfg.CONTACT_EMAIL) {
        window.location.href = mailtoFallback(data);
        setStatus(form, "success", "<strong>Your email app should now be open with the enquiry filled in.</strong> Press send there to finish. If nothing opened, email <a href=\"mailto:" + cfg.CONTACT_EMAIL + "\">" + cfg.CONTACT_EMAIL + "</a>.");
        return;
      }

      setStatus(form, "error", "<strong>This form isn't connected yet.</strong> The site owner needs to add a form endpoint or email address in <code>assets/js/config.js</code>. Nothing was sent.");
    });
  });
})();
