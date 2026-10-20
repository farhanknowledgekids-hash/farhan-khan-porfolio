/*
 * Site configuration — the only file you need to edit to go live.
 *
 * FORM_ENDPOINT
 *   A form backend that accepts a JSON POST and returns 2xx on success.
 *   Works with Formspree (https://formspree.io/f/xxxxxxx) or
 *   Web3Forms (https://api.web3forms.com/submit — also set WEB3FORMS_KEY).
 *   Leave empty and the studio form falls back to opening an email draft
 *   to CONTACT_EMAIL. If both are empty the form shows a clear
 *   "not connected" error instead of pretending to send.
 *
 * WHATSAPP_NUMBER
 *   International format, digits only, no "+" or spaces. e.g. "919812345678".
 *   Leave empty and every WhatsApp button stays hidden.
 */
window.SITE_CONFIG = {
  FORM_ENDPOINT: "",
  WEB3FORMS_KEY: "",
  CONTACT_EMAIL: "",
  WHATSAPP_NUMBER: "",
  WHATSAPP_MESSAGE: "Hi Farhan, I saw your dental website demos and would like to discuss a website for my clinic."
};
