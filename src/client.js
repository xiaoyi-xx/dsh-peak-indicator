/**
 * dsh-peak-status — browser half.
 *
 * A compact status chip in the session header's right-aligned utilities
 * strip (conversation.session.header.utilities) — the very top of the
 * conversation — fully themed with the web UI's native --dsw-alias-*
 * variables so it blends into the interface.
 *
 * Shows whether the current Beijing time falls in DeepSeek's API peak
 * window. Official definition (effective 2026-08-17):
 *   peak:     daily 09:00–12:00 and 14:00–18:00 (Beijing time)
 *   off-peak: everything else (priced at half of peak)
 *
 * Red = peak (bold), green = off-peak; live Beijing clock, countdown to the
 * next transition, click to expand a small popover with the full detail.
 * Mounted persistently via the profile's cordis.patch.yml, so it survives
 * restarts.
 */
(function () {
  // The host client-modules expects a bundle to register the id of the entry
  // it is mounted as — the package name ("@local/dsh-peak-status" for a
  // profile @local install, "dsh-peak-status" when installed from npm).
  // Derive it from the bundle URL at runtime so one artifact works in every
  // mount shape (bundles are loaded via <script>, so document.currentScript
  // is the plugin script while this top-level code runs).
  var MODULE_ID = (function () {
    try {
      var el = document.currentScript
      if (el && el.src) {
        var m = /\/plugins\/(.+?)\/client\.js/.exec(el.src)
        if (m) return decodeURIComponent(m[1])
      }
    } catch (error) { /* ignore */ }
    return null
  })()

  var MODULE_FACTORY = (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    var react = require('react')

    var TZ = 'Asia/Shanghai'
    // Peak window boundaries in minutes of day: 09:00, 12:00, 14:00, 18:00.
    var BOUNDS = [540, 720, 840, 1080]

    var FONT = 'var(--dsw-font-family, system-ui, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif)'
    var DIM = 'var(--dsw-alias-label-secondary, var(--dsh-text-dim, #8a8f98))'
    var PEAK_COLOR = 'var(--dsw-alias-state-error-primary, #e5484d)'
    var OFF_COLOR = 'var(--dsw-alias-state-success-primary, #30a46c)'

    function bjParts() {
      var parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: TZ, hour12: false,
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      }).formatToParts(new Date())
      var get = function (type) {
        for (var i = 0; i < parts.length; i++) {
          if (parts[i].type === type) return Number(parts[i].value)
        }
        return 0
      }
      return { h: get('hour'), m: get('minute'), s: get('second') }
    }

    function compute(t) {
      var now = t.h * 60 + t.m
      var peak = (now >= BOUNDS[0] && now < BOUNDS[1]) || (now >= BOUNDS[2] && now < BOUNDS[3])
      var next = null
      for (var i = 0; i < BOUNDS.length; i++) {
        if (BOUNDS[i] > now) { next = { min: BOUNDS[i], tomorrow: false }; break }
      }
      if (next === null) next = { min: BOUNDS[0], tomorrow: true }
      var secsToNext = (next.min - now) * 60 - t.s + (next.tomorrow ? 24 * 3600 : 0)
      var phaseStart = 0
      for (var j = BOUNDS.length - 1; j >= 0; j--) {
        if (BOUNDS[j] <= now) { phaseStart = BOUNDS[j]; break }
      }
      var phaseLenMin = (next.min - now) + (next.tomorrow ? 1440 : 0) + (now - phaseStart)
      var progress = phaseLenMin > 0 ? Math.min(100, Math.max(0, ((now - phaseStart) / phaseLenMin) * 100)) : 0
      return { peak: peak, next: next, secsToNext: secsToNext, progress: progress }
    }

    function pad(n) { return (n < 10 ? '0' : '') + n }
    function fmtClock(t) { return pad(t.h) + ':' + pad(t.m) + ':' + pad(t.s) }
    function fmtBoundary(min) { return pad(Math.floor(min / 60)) + ':' + pad(min % 60) }
    function fmtDur(totalSecs) {
      var s = Math.max(0, Math.round(totalSecs))
      var h = Math.floor(s / 3600)
      var m = Math.floor((s % 3600) / 60)
      return (h > 0 ? h + 'h ' : '') + m + 'm'
    }
    function fmtDurFull(totalSecs) {
      var s = Math.max(0, Math.round(totalSecs))
      var h = Math.floor(s / 3600)
      var m = Math.floor((s % 3600) / 60)
      var sec = s % 60
      return pad(h) + ':' + pad(m) + ':' + pad(sec)
    }

    function PeakChip() {
      var tickState = react.useState(bjParts())
      var tick = tickState[0]
      var setTick = tickState[1]
      var open = react.useState(false)
      var setOpen = open[1]

      react.useEffect(function () {
        var id = setInterval(function () { setTick(bjParts()) }, 1000)
        return function () { clearInterval(id) }
      }, [])

      var s = compute(tick)
      var color = s.peak ? PEAK_COLOR : OFF_COLOR
      var clock = fmtClock(tick)
      var boundaryLabel = fmtBoundary(s.next.min) + (s.next.tomorrow ? '（明天）' : '')

      var chip = react.createElement(
        'div',
        {
          onClick: function () { setOpen(!open[0]) },
          title: s.peak
            ? '高峰期（北京时间 9:00-12:00 / 14:00-18:00）：价格 = 空闲 ×2。' + boundaryLabel + ' 结束，点击展开详情'
            : '空闲期：价格为高峰一半。下一高峰 ' + boundaryLabel + '，点击展开详情',
          style: {
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: FONT, fontSize: 12, lineHeight: '20px',
            padding: '1px 10px', borderRadius: 999,
            background: 'var(--dsw-alias-bg-layer-1, #f7f8fa)',
            border: '1px solid var(--dsw-alias-border-l1, #e4e7ec)',
            color: DIM, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
          },
        },
        [
          react.createElement('span', { key: 'dot', style: { width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 } }),
          react.createElement('span', { key: 'state', style: { fontWeight: s.peak ? 700 : 500, color: color } },
            s.peak ? '高峰期' : '空闲期'),
          react.createElement('span', { key: 'clock', style: { fontVariantNumeric: 'tabular-nums' } }, clock),
          react.createElement('span', { key: 'count', style: { fontVariantNumeric: 'tabular-nums' } },
            s.peak
              ? ('剩 ' + fmtDur(s.secsToNext) + ' · 价格 ×2')
              : ('距高峰 ' + fmtDur(s.secsToNext) + ' · 半价')),
          react.createElement('span', { key: 'caret', style: { fontSize: 9, opacity: 0.7 } }, open[0] ? '▾' : '▸'),
        ],
      )

      if (!open[0]) return chip

      var popover = react.createElement(
        'div',
        {
          style: {
            position: 'absolute', top: 'calc(100% + 6px)', right: 0, width: 264,
            zIndex: 60, display: 'flex', flexDirection: 'column', gap: 5,
            fontFamily: FONT, fontSize: 11.5, lineHeight: 1.6,
            color: DIM,
            background: 'var(--dsw-alias-bg-overlay, var(--dsw-alias-bg-base, #ffffff))',
            border: '1px solid var(--dsw-alias-border-l1, #e4e7ec)',
            borderRadius: 10, padding: '8px 11px',
            boxShadow: 'var(--dsw-shadow-lv2, 0 8px 24px rgba(15,23,42,.14))',
          },
        },
        [
          react.createElement('div', { key: 'l1', style: { display: 'flex', alignItems: 'center', gap: 6 } }, [
            react.createElement('span', { key: 'st', style: { fontWeight: 700, color: color } },
              s.peak ? '高峰时段' : '空闲时段'),
            react.createElement('span', { key: 'tm', style: { fontVariantNumeric: 'tabular-nums' } },
              clock + '（北京）'),
            react.createElement('span', { key: 'price', style: { color: color, fontWeight: 500 } },
              s.peak ? '价格 ×2' : '半价'),
          ]),
          react.createElement('div', { key: 'l2' },
            '高峰窗口：09:00–12:00 / 14:00–18:00（每日）'),
          react.createElement('div', { key: 'l3', style: { fontVariantNumeric: 'tabular-nums' } },
            '下一转折：' + boundaryLabel + ' · 倒计时 ' + fmtDurFull(s.secsToNext)),
          react.createElement('div', { key: 'bar', style: { display: 'flex', alignItems: 'center', gap: 8 } }, [
            react.createElement('div', { key: 'track', style: { flex: 1, height: 4, borderRadius: 2, background: 'var(--dsw-alias-border-l1, #e4e7ec)', overflow: 'hidden' } },
              react.createElement('div', { key: 'fill', style: {
                height: '100%', width: s.progress.toFixed(1) + '%',
                background: color, borderRadius: 2, transition: 'width .4s ease',
              } }),
            ),
            react.createElement('span', { key: 'pct', style: { fontSize: 10.5, fontVariantNumeric: 'tabular-nums' } },
              s.progress.toFixed(0) + '%'),
          ]),
          react.createElement('div', { key: 'foot', style: { fontSize: 10.5, lineHeight: 1.5, opacity: 0.85 } },
            '官方峰谷定价 2026-08-17 生效：空闲时段价格为高峰一半。'),
        ],
      )

      return react.createElement(
        'div',
        { style: { position: 'relative', display: 'inline-block' } },
        [chip, popover],
      )
    }

    function apply(ctx) {
      try {
        var slots = ctx.get('slots')
        if (slots === undefined) return
        slots.inject('conversation.session.header.utilities', function () {
          return slots.register(
            { name: 'conversation.session.header.utilities', id: 'dsh-peak-status', order: 1 },
            PeakChip,
          )
        })
      } catch (error) {
        console.warn('[dsh-peak-status] apply failed:', error)
      }
    }

    var inject = ['slots']

    exports.apply = apply
    exports.inject = inject
    return module.exports
  }

  function registerModule(id) {
    window.__ModuleLoader__.load({ id: id, factory: MODULE_FACTORY })
  }

  if (MODULE_ID !== null) {
    registerModule(MODULE_ID)
  } else {
    // Script URL unavailable — cover both install shapes so neither mount
    // fails the "loaded without registering" check.
    registerModule('@local/dsh-peak-status')
    registerModule('dsh-peak-status')
  }
})()
