// Iconos SVG minimalistas.
var Icons = (function () {
  var W = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"';
  function svg(paths, cls) {
    cls = cls || 'icon';
    return '<svg ' + W + ' class="' + cls + '">' + paths + '</svg>';
  }
  return {
    // Logo: hexágono con ecualizador + orbita/pulso central. Más distintivo que dos corcheas.
    logo: function (cls) {
      return svg(
        '<path d="M12 1.7 21.4 7v10L12 22.3 2.6 17V7z"/>' +
        '<circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"/>' +
        '<path d="M7.5 10.2v3.6"/>' +
        '<path d="M9.75 8.4v7.2"/>' +
        '<path d="M14.25 8.4v7.2"/>' +
        '<path d="M16.5 10.2v3.6"/>',
        cls
      );
    },
    moon: function (cls) { return svg('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>', cls); },
    sun:  function (cls) { return svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', cls); },
    search: function (cls) { return svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', cls); },
    star: function (cls) { return svg('<path d="M12 2l3 6.9 7.6.7-5.7 5.1 1.7 7.4L12 18.3 5.4 22.1l1.7-7.4L1.4 9.6l7.6-.7z"/>', cls); },
    heartOn: function (cls) { return svg('<path d="M20.8 5.4a5.5 5.5 0 0 0-8.8-1.4L12 4l-.1-.1a5.5 5.5 0 0 0-7.7 7.8l7.8 7.8 7.8-7.8a5.5 5.5 0 0 0 .9-6.3z" fill="currentColor"/>', cls); },
    heart: function (cls) { return svg('<path d="M20.8 5.4a5.5 5.5 0 0 0-8.8-1.4L12 4l-.1-.1a5.5 5.5 0 0 0-7.7 7.8l7.8 7.8 7.8-7.8a5.5 5.5 0 0 0 .9-6.3z"/>', cls); },
    chev: function (cls) { return svg('<path d="m6 9 6 6 6-6"/>', cls); },
    arrowLeft: function (cls) { return svg('<path d="M19 12H5M12 19l-7-7 7-7"/>', cls); },
    logout: function (cls) { return svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>', cls); },
    menu: function (cls) { return svg('<path d="M3 6h18M3 12h18M3 18h18"/>', cls); },
    home: function (cls) { return svg('<path d="M3 11l9-8 9 8v10a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z"/>', cls); },
    disc: function (cls) { return svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/>', cls); },
    user: function (cls) { return svg('<circle cx="12" cy="8" r="4"/><path d="M4 22a8 8 0 0 1 16 0"/>', cls); },
    key: function (cls) { return svg('<circle cx="8" cy="14" r="4"/><path d="m11 11 9-9 3 3-3 3 2 2-2 2-2-2-4 4"/>', cls); },
    plus: function (cls) { return svg('<path d="M12 5v14M5 12h14"/>', cls); },
    trend: function (cls) { return svg('<path d="M3 17l6-6 4 4 8-8M14 7h7v7"/>', cls); },
    close: function (cls) { return svg('<path d="M18 6 6 18M6 6l12 12"/>', cls); }
  };
})();
