/**
 * Nano GDPR — cookie consent for static sites.
 *
 * Zero dependencies. Zero database. No server state, no endpoint, nothing
 * to attack. Consent lives only in the visitor's own browser (localStorage
 * plus a mirror cookie). Gated scripts do not run until the matching
 * category is accepted, which is what makes this legally compliant rather
 * than merely cosmetic.
 *
 * Embed:
 *   <link rel="stylesheet" href="nano-gdpr.css">
 *   <script>
 *     window.NanoGDPR = {
 *       text: "We use cookies to improve your experience.",
 *       privacyUrl: "/privacy-policy"
 *     };
 *   </script>
 *   <script src="nano-gdpr.js" defer></script>
 *
 * Gate a script behind a category (it runs only after consent):
 *   <script type="text/plain" data-nano-gdpr="analytics"
 *           data-src="https://www.googletagmanager.com/gtag/js?id=G-XXXX"></script>
 *   <script type="text/plain" data-nano-gdpr="analytics">
 *     window.dataLayer = window.dataLayer || [];
 *     function gtag(){ dataLayer.push(arguments); }
 *     gtag('js', new Date()); gtag('config', 'G-XXXX');
 *   </script>
 *
 * Re-open the preferences (e.g. a footer "Cookie settings" link):
 *   <a href="#" data-nano-gdpr-open>Cookie settings</a>
 *   ...or call NanoGDPR.open() from anywhere.
 */
(function () {
    'use strict';

    // Reference to this script tag (used to find nano-gdpr.css next to it).
    var SELF = document.currentScript;

    var KEY    = 'nano_gdpr';
    var COOKIE = 'nano_gdpr';

    /* =====================================================================
       SETTINGS - edit these, then save and upload the file.
       This is the only part you need to change.
       ===================================================================== */
    var DEFAULTS = {
        text:         'We use cookies to improve your experience on this site.',
        privacyUrl:   '/privacy-policy',
        privacyLabel: 'Privacy Policy',
        position:     'bottom',            // 'bottom' | 'top'
        colors:       {},                  // bg, text, accept, reject, link
        logUrl:       '',                  // optional. e.g. '/gdpr/optional-logging/log.php' to save a record
        categories: [
            { id: 'analytics',  label: 'Analytics',  description: 'Helps us understand how visitors use the site (e.g. page views, traffic sources).' },
            { id: 'functional', label: 'Functional', description: 'Enables enhanced features such as live chat, embedded videos, and social sharing.' }
        ]
    };

    // Read operator config that was set before this script loaded.
    var userCfg = (typeof window.NanoGDPR === 'object' && window.NanoGDPR) || {};
    var cfg = {
        text:         userCfg.text         || DEFAULTS.text,
        privacyUrl:   userCfg.privacyUrl   || DEFAULTS.privacyUrl,
        privacyLabel: userCfg.privacyLabel || DEFAULTS.privacyLabel,
        position:     userCfg.position === 'top' ? 'top' : 'bottom',
        colors:       userCfg.colors       || DEFAULTS.colors,
        categories:   Array.isArray(userCfg.categories) && userCfg.categories.length
                          ? userCfg.categories : DEFAULTS.categories,
        logUrl:       userCfg.logUrl || DEFAULTS.logUrl
    };

    // ---- Small helpers ----------------------------------------------------

    function esc(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function setCookie(value) {
        var d = new Date();
        d.setTime(d.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
        document.cookie = COOKIE + '=' + encodeURIComponent(value) +
            ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
    }

    function readStored() {
        var raw = null;
        try { raw = localStorage.getItem(KEY); } catch (e) { raw = null; }
        if (!raw) return null;
        try { return JSON.parse(raw); } catch (e) { return null; }
    }

    function writeStored(data) {
        try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
        setCookie(data.consent);
    }

    function cssVarStyle() {
        var c = cfg.colors || {};
        var parts = [];
        if (c.bg)     parts.push('--ng-bg:' + c.bg);
        if (c.text)   parts.push('--ng-text:' + c.text);
        if (c.accept) parts.push('--ng-accept:' + c.accept);
        if (c.reject) parts.push('--ng-reject:' + c.reject);
        if (c.link)   parts.push('--ng-link:' + c.link);
        return parts.join(';');
    }

    // ---- Script gating ----------------------------------------------------
    // Activate <script type="text/plain" data-nano-gdpr="<cat>"> nodes for a
    // category that has been accepted, by swapping them for live scripts.

    function activateCategory(cat) {
        var nodes = document.querySelectorAll(
            'script[type="text/plain"][data-nano-gdpr="' + cat + '"]'
        );
        Array.prototype.forEach.call(nodes, function (node) {
            var live = document.createElement('script');
            // Copy through any attributes except our control ones.
            Array.prototype.forEach.call(node.attributes, function (attr) {
                if (attr.name === 'type' || attr.name === 'data-nano-gdpr' || attr.name === 'data-src') {
                    return;
                }
                live.setAttribute(attr.name, attr.value);
            });
            var src = node.getAttribute('data-src');
            if (src) {
                live.src = src;
            } else {
                live.text = node.textContent;
            }
            node.parentNode.replaceChild(live, node);
        });
    }

    function applyConsent(data) {
        cfg.categories.forEach(function (c) {
            if (data[c.id] === 'accepted') activateCategory(c.id);
        });
    }

    // Optional: send the choice to log.php for a record. Off unless logUrl set.
    function sendLog(data) {
        if (!cfg.logUrl) return;
        var cats = cfg.categories.map(function (c) {
            return c.id + '=' + (data[c.id] === 'accepted' ? 'yes' : 'no');
        }).join(';');
        try {
            var fd = new FormData();
            fd.append('consent', data.consent);
            fd.append('categories', cats);
            if (navigator.sendBeacon) {
                navigator.sendBeacon(cfg.logUrl, fd);
            } else {
                var xhr = new XMLHttpRequest();
                xhr.open('POST', cfg.logUrl, true);
                xhr.send(fd);
            }
        } catch (e) {}
    }

    // ---- Markup -----------------------------------------------------------

    function buildRows() {
        return cfg.categories.map(function (c) {
            return '' +
                '<div class="ng-toggle-row">' +
                  '<div class="ng-toggle-info">' +
                    '<strong>' + esc(c.label) + '</strong>' +
                    '<p>' + esc(c.description || '') + '</p>' +
                  '</div>' +
                  '<label class="ng-switch">' +
                    '<input type="checkbox" id="ng-pref-' + esc(c.id) + '" />' +
                    '<span class="ng-slider"></span>' +
                  '</label>' +
                '</div>';
        }).join('');
    }

    function buildMarkup() {
        var style = cssVarStyle();
        var styleAttr = style ? ' style="' + style + '"' : '';

        return '' +
        '<div id="ng-banner" class="ng-banner ng-banner--' + cfg.position + '"' + styleAttr + '>' +
          '<div class="ng-inner">' +
            '<p>' + esc(cfg.text) + ' <a href="' + esc(cfg.privacyUrl) + '">' + esc(cfg.privacyLabel) + '</a></p>' +
            '<div class="ng-btns">' +
              '<button id="ng-btn-reject" type="button">Reject All</button>' +
              '<button id="ng-btn-manage" type="button">Manage Preferences</button>' +
              '<button id="ng-btn-accept" type="button">Accept All</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div id="ng-overlay" class="ng-overlay"></div>' +
        '<div id="ng-prefs" class="ng-prefs"' + styleAttr + '>' +
          '<div class="ng-prefs__header">' +
            '<h3>Cookie Preferences</h3>' +
            '<button id="ng-prefs-close" type="button" aria-label="Close">&times;</button>' +
          '</div>' +
          '<div class="ng-prefs__body">' +
            '<div class="ng-toggle-row">' +
              '<div class="ng-toggle-info">' +
                '<strong>Essential</strong>' +
                '<p>Required for the site to function. Cannot be disabled.</p>' +
              '</div>' +
              '<label class="ng-switch">' +
                '<input type="checkbox" checked disabled />' +
                '<span class="ng-slider"></span>' +
              '</label>' +
            '</div>' +
            buildRows() +
          '</div>' +
          '<div class="ng-prefs__footer">' +
            '<button id="ng-prefs-reject" type="button">Reject All</button>' +
            '<button id="ng-prefs-save" type="button">Save Preferences</button>' +
            '<button id="ng-prefs-accept" type="button">Accept All</button>' +
          '</div>' +
        '</div>';
    }

    // ---- Controller -------------------------------------------------------

    // Option B: if the stylesheet was not linked on the page, load it from
    // next to this script so the one-line install still has styles.
    function ensureCss() {
        if (document.querySelector('link[href*="nano-gdpr.css"]')) return;
        var src = SELF && SELF.src ? SELF.src : '';
        var href = src ? src.replace(/nano-gdpr\.js(\?.*)?$/, 'nano-gdpr.css') : 'nano-gdpr.css';
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }

    function init() {
        ensureCss();
        var existing = readStored();

        // Inject UI (always, so preferences can be reopened later).
        var host = document.createElement('div');
        host.id = 'ng-root';
        host.innerHTML = buildMarkup();
        document.body.appendChild(host);

        var banner  = document.getElementById('ng-banner');
        var prefs   = document.getElementById('ng-prefs');
        var overlay = document.getElementById('ng-overlay');

        function openPrefs() {
            var stored = readStored();
            cfg.categories.forEach(function (c) {
                var box = document.getElementById('ng-pref-' + c.id);
                if (box) box.checked = stored ? stored[c.id] === 'accepted' : false;
            });
            prefs.classList.add('show');
            overlay.classList.add('show');
        }

        function closePrefs() {
            prefs.classList.remove('show');
            overlay.classList.remove('show');
        }

        function save(data, prev) {
            data.timestamp = new Date().toISOString();
            writeStored(data);
            sendLog(data);
            if (banner) banner.classList.remove('show');
            closePrefs();

            // Newly accepted categories can activate live. A withdrawal
            // (was accepted, now rejected) needs a reload, because a script
            // that already ran cannot be unrun.
            var withdrew = false;
            cfg.categories.forEach(function (c) {
                if (prev && prev[c.id] === 'accepted' && data[c.id] !== 'accepted') {
                    withdrew = true;
                }
            });
            if (withdrew) { location.reload(); return; }
            applyConsent(data);
        }

        function saveAll(value) {
            var data = { consent: value };
            cfg.categories.forEach(function (c) { data[c.id] = value; });
            save(data, readStored());
        }

        function saveGranular() {
            var prev = readStored();
            var data = { consent: 'partial' };
            var allYes = true, allNo = true;
            cfg.categories.forEach(function (c) {
                var box = document.getElementById('ng-pref-' + c.id);
                var v = box && box.checked ? 'accepted' : 'rejected';
                data[c.id] = v;
                if (v === 'accepted') allNo = false; else allYes = false;
            });
            data.consent = allYes ? 'accepted' : (allNo ? 'rejected' : 'partial');
            save(data, prev);
        }

        // Wire controls.
        document.getElementById('ng-btn-accept').addEventListener('click', function () { saveAll('accepted'); });
        document.getElementById('ng-btn-reject').addEventListener('click', function () { saveAll('rejected'); });
        document.getElementById('ng-btn-manage').addEventListener('click', openPrefs);
        document.getElementById('ng-prefs-accept').addEventListener('click', function () { saveAll('accepted'); });
        document.getElementById('ng-prefs-reject').addEventListener('click', function () { saveAll('rejected'); });
        document.getElementById('ng-prefs-save').addEventListener('click', saveGranular);
        document.getElementById('ng-prefs-close').addEventListener('click', closePrefs);
        overlay.addEventListener('click', closePrefs);

        // Auto-wire any "Cookie settings" triggers on the page.
        Array.prototype.forEach.call(
            document.querySelectorAll('[data-nano-gdpr-open]'),
            function (el) {
                el.addEventListener('click', function (e) { e.preventDefault(); openPrefs(); });
            }
        );

        // Apply stored consent or show the banner.
        if (existing) {
            applyConsent(existing);
        } else if (banner) {
            banner.classList.add('show');
        }

        // Public API (preserves any config the operator set on the object).
        window.NanoGDPR = window.NanoGDPR || {};
        window.NanoGDPR.open  = openPrefs;
        window.NanoGDPR.close = closePrefs;
        window.NanoGDPR.get   = readStored;
        window.NanoGDPR.reset = function () {
            try { localStorage.removeItem(KEY); } catch (e) {}
            setCookie('');
            location.reload();
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
