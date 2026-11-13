/**
 * Custom Lovelace card keeping the Room 3D iframe mounted for the entire
 * Home Assistant tab session so switching views/panels (or resizing between
 * compact Commandes card and fullscreen Vue 3D) never reloads the 3D scene.
 */
(() => {
  const CARD_TAG = 'room3d-keepalive-card';
  const LAYER_ID = 'room3d-keepalive-layer';
  const REGISTRY_KEY = '__room3dKeepaliveRegistry';

  function getRegistry() {
    if (!window[REGISTRY_KEY]) {
      window[REGISTRY_KEY] = new Map();
    }
    return window[REGISTRY_KEY];
  }

  function getHaRoots() {
    const ha = document.querySelector('home-assistant');
    const main = ha?.shadowRoot?.querySelector('home-assistant-main');
    const huiRoot = main?.shadowRoot
      ?.querySelector('partial-panel-resolver')
      ?.firstElementChild?.shadowRoot?.querySelector('hui-root');
    const header = huiRoot?.shadowRoot?.querySelector('.header');
    return { ha, main, header };
  }

  function ensureLayer() {
    const { ha, main } = getHaRoots();
    const parent = main?.shadowRoot || ha?.shadowRoot || document.body;
    let layer = parent.querySelector(`#${LAYER_ID}`);
    if (!layer) {
      layer = document.createElement('div');
      layer.id = LAYER_ID;
      layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:3;';
      parent.appendChild(layer);
    }
    return layer;
  }

  function notifyIframeVisibility(entry, visible) {
    if (entry.visible === visible) return;
    entry.visible = visible;
    try {
      entry.iframe.contentWindow?.postMessage(
        { type: 'room3d:host-visibility', visible },
        '*',
      );
    } catch {
      // Cross-origin postMessage best-effort
    }
  }

  function hideHost(entry) {
    const { style } = entry.host;
    // display: none détache complètement la surface GPU/Wayland et suspend rAF dans l'iframe.
    style.display = 'none';
    style.visibility = 'hidden';
    style.pointerEvents = 'none';
    style.zIndex = '-1';
    style.clipPath = '';
    notifyIframeVisibility(entry, false);
  }

  function showHost(entry, rect, clipTop, clipBottom) {
    const { style } = entry.host;
    style.display = 'block';
    style.left = `${rect.left}px`;
    style.top = `${rect.top}px`;
    style.width = `${rect.width}px`;
    style.height = `${rect.height}px`;
    style.clipPath =
      clipTop > 0 || clipBottom > 0 ? `inset(${clipTop}px 0px ${clipBottom}px 0px)` : '';
    style.visibility = 'visible';
    style.pointerEvents = 'auto';
    style.zIndex = '3';
    notifyIframeVisibility(entry, true);
  }

  function getOrCreateEntry(config) {
    const registry = getRegistry();
    const key = config.url;
    let entry = registry.get(key);
    const layer = ensureLayer();

    if (!entry) {
      const host = document.createElement('div');
      host.dataset.room3dUrl = key;
      host.style.cssText = [
        'position:fixed',
        'left:0px',
        'top:0px',
        'width:800px',
        'height:600px',
        'display:none',
        'visibility:hidden',
        'pointer-events:none',
        'z-index:-1',
        'overflow:hidden',
        'border-bottom-left-radius:var(--ha-card-border-radius, 12px)',
        'border-bottom-right-radius:var(--ha-card-border-radius, 12px)',
        'background:var(--card-background-color, #111)',
      ].join(';');

      const iframe = document.createElement('iframe');
      iframe.src = config.url;
      iframe.title = config.title || 'Room 3D';
      iframe.allow = config.allow || 'fullscreen; clipboard-write';
      iframe.loading = 'eager';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.style.cssText = 'width:100%;height:100%;border:0;display:block;';

      host.appendChild(iframe);
      layer.appendChild(host);

      entry = {
        key,
        host,
        iframe,
        activeCard: null,
        reloading: false,
        visible: false,
        listeners: new Set(),
      };

      iframe.addEventListener('load', () => {
        entry.reloading = false;
        const currentVisible = entry.visible;
        entry.visible = !currentVisible;
        notifyIframeVisibility(entry, currentVisible);
        for (const fn of entry.listeners) fn();
      });

      registry.set(key, entry);
    } else if (!entry.host.isConnected) {
      layer.appendChild(entry.host);
    }

    return entry;
  }

  function formatCssLength(value) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return `${value}px`;
    }
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    return null;
  }

  class Room3DKeepaliveCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._config = null;
      this._entry = null;
      this._ro = null;
      this._rafId = 0;
      this._onViewportChange = () => this._scheduleSync();
      this._onEntryChange = () => this._updateReloadButton();
    }

    setConfig(config) {
      if (!config || typeof config.url !== 'string' || !config.url.trim()) {
        throw new Error('room3d-keepalive-card: la propriété "url" est requise');
      }
      this._config = {
        url: config.url.trim(),
        title: typeof config.title === 'string' && config.title.trim() ? config.title.trim() : 'Room 3D',
        allow: typeof config.allow === 'string' && config.allow.trim() ? config.allow.trim() : 'fullscreen; clipboard-write',
        height: formatCssLength(config.height),
        fullscreenPath:
          typeof config.fullscreen_path === 'string' && config.fullscreen_path.trim()
            ? config.fullscreen_path.trim()
            : null,
      };
      this._render();
      if (this.isConnected) {
        this._attachOverlay();
      }
    }

    set hass(_hass) {
      // Required by Lovelace card contract; state sync is handled inside Room 3D itself.
    }

    getCardSize() {
      return this._config?.height ? 7 : 10;
    }

    connectedCallback() {
      if (!this.shadowRoot.childElementCount && this._config) {
        this._render();
      }
      if (this._config) {
        this._attachOverlay();
      }
    }

    disconnectedCallback() {
      this._detachOverlay();
    }

    _render() {
      const title = this._config?.title || 'Room 3D';
      const heightRule = this._config?.height
        ? this._config.height
        : 'calc(100dvh - var(--room3d-card-top, 72px) - var(--safe-area-inset-bottom, 0px))';
      const showFullscreen = Boolean(this._config?.fullscreenPath);

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            width: 100%;
            height: ${heightRule};
            min-height: 260px;
            box-sizing: border-box;
          }
          ha-card {
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%;
            overflow: hidden;
            box-sizing: border-box;
          }
          .bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            height: 40px;
            padding: 0 12px;
            border-bottom: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12));
            flex-shrink: 0;
            box-sizing: border-box;
          }
          .title-wrap {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
            color: var(--primary-text-color);
            font-size: 14px;
            font-weight: 600;
          }
          .title-wrap ha-icon {
            --mdc-icon-size: 18px;
            color: var(--primary-color);
            flex-shrink: 0;
          }
          .title-text {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .actions {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-shrink: 0;
          }
          .bar-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            height: 28px;
            padding: 0 10px;
            border-radius: var(--ha-border-radius-pill, 9999px);
            border: 1px solid var(--outline-color, var(--divider-color, rgba(255, 255, 255, 0.16)));
            background: var(--secondary-background-color, transparent);
            color: var(--primary-text-color);
            font: inherit;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: border-color 150ms ease, background-color 150ms ease, color 150ms ease;
          }
          .bar-btn:hover {
            border-color: var(--primary-color);
            color: var(--primary-color);
          }
          .bar-btn:focus-visible {
            outline: 2px solid var(--focus-color, var(--primary-color));
            outline-offset: 2px;
          }
          .bar-btn ha-icon {
            --mdc-icon-size: 16px;
          }
          .reload-btn.is-reloading ha-icon {
            animation: room3d-spin 0.8s linear infinite;
          }
          .viewport-slot {
            flex: 1;
            min-height: 0;
            width: 100%;
            position: relative;
          }
          @keyframes room3d-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        </style>
        <ha-card>
          <div class="bar">
            <div class="title-wrap">
              <ha-icon icon="mdi:cube-outline"></ha-icon>
              <span class="title-text"></span>
            </div>
            <div class="actions">
              ${
                showFullscreen
                  ? `<button type="button" class="bar-btn fullscreen-btn" title="Ouvrir Vue 3D en plein écran">
                      <ha-icon icon="mdi:fullscreen"></ha-icon>
                      <span>Plein écran</span>
                    </button>`
                  : ''
              }
              <button type="button" class="bar-btn reload-btn" title="Recharger uniquement la vue 3D">
                <ha-icon icon="mdi:refresh"></ha-icon>
                <span>Recharger</span>
              </button>
            </div>
          </div>
          <div class="viewport-slot"></div>
        </ha-card>
      `;

      this.shadowRoot.querySelector('.title-text').textContent = title;
      this._slot = this.shadowRoot.querySelector('.viewport-slot');
      this._reloadBtn = this.shadowRoot.querySelector('.reload-btn');
      this._reloadBtn.addEventListener('click', () => this._reloadIframe());

      const fsBtn = this.shadowRoot.querySelector('.fullscreen-btn');
      if (fsBtn && this._config?.fullscreenPath) {
        fsBtn.addEventListener('click', () => this._navigate(this._config.fullscreenPath));
      }
    }

    _navigate(path) {
      window.history.pushState(null, '', path);
      window.dispatchEvent(new CustomEvent('location-changed', { detail: { replace: false } }));
    }

    _attachOverlay() {
      if (!this._config || !this._slot) return;
      this._entry = getOrCreateEntry(this._config);
      this._entry.activeCard = this;
      this._entry.listeners.add(this._onEntryChange);
      this._updateReloadButton();

      window.addEventListener('resize', this._onViewportChange, { passive: true });
      window.addEventListener('scroll', this._onViewportChange, { passive: true, capture: true });

      if (typeof ResizeObserver !== 'undefined') {
        this._ro?.disconnect();
        this._ro = new ResizeObserver(() => this._scheduleSync());
        this._ro.observe(this);
        this._ro.observe(this._slot);
      }

      this._syncGeometry();
      this._scheduleSync();
    }

    _detachOverlay() {
      window.removeEventListener('resize', this._onViewportChange);
      window.removeEventListener('scroll', this._onViewportChange, { capture: true });
      this._ro?.disconnect();
      this._ro = null;

      if (this._rafId) {
        cancelAnimationFrame(this._rafId);
        this._rafId = 0;
      }

      if (this._entry) {
        this._entry.listeners.delete(this._onEntryChange);
        if (this._entry.activeCard === this) {
          this._entry.activeCard = null;
          hideHost(this._entry);
        }
      }
    }

    _scheduleSync() {
      if (this._rafId) return;
      this._rafId = requestAnimationFrame(() => {
        this._rafId = 0;
        this._syncGeometry();
      });
    }

    _syncGeometry() {
      if (!this.isConnected || !this._slot || !this._entry || this._entry.activeCard !== this) {
        return;
      }

      const { ha, header } = getHaRoots();
      if (!this._config?.height) {
        const hostRect = this.getBoundingClientRect();
        if (hostRect.top > 0) {
          this.style.setProperty('--room3d-card-top', `${Math.round(hostRect.top)}px`);
        }
      }

      const rect = this._slot.getBoundingClientRect();
      const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
      const bottomInset = ha
        ? parseFloat(getComputedStyle(ha).getPropertyValue('--safe-area-inset-bottom')) || 0
        : 0;
      const viewportBottom = window.innerHeight - bottomInset;

      const clipTop = Math.max(0, headerBottom - rect.top);
      const clipBottom = Math.max(0, rect.bottom - viewportBottom);
      const visibleHeight = rect.height - clipTop - clipBottom;

      if (rect.width < 10 || visibleHeight < 10) {
        hideHost(this._entry);
        return;
      }

      showHost(this._entry, rect, clipTop, clipBottom);
    }

    _updateReloadButton() {
      if (!this._reloadBtn || !this._entry) return;
      this._reloadBtn.classList.toggle('is-reloading', this._entry.reloading);
    }

    _reloadIframe() {
      if (!this._entry || !this._config) return;
      const targetUrl = new URL(this._config.url, window.location.href);
      targetUrl.searchParams.set('_reload', String(Date.now()));
      this._entry.reloading = true;
      this._updateReloadButton();
      this._entry.iframe.src = targetUrl.toString();
    }
  }

  if (!customElements.get(CARD_TAG)) {
    customElements.define(CARD_TAG, Room3DKeepaliveCard);
  }

  window.customCards = window.customCards || [];
  if (!window.customCards.some((c) => c.type === CARD_TAG)) {
    window.customCards.push({
      type: CARD_TAG,
      name: 'Room 3D Keepalive',
      description: 'Maintient la vue 3D Room 3D en mémoire pendant la session Home Assistant.',
    });
  }
})();
