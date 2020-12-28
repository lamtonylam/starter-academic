/*************************************************
 *  Wowchemy
 *  https://github.com/wowchemy/wowchemy-hugo-modules
 *
 *  Core JS functions and initialization.
 **************************************************/

import {hugoEnvironment} from '@params';

import {fixMermaid} from './wowchemy-utils';

import {
  changeThemeModeClick,
  initThemeVariation,
  renderThemeVariation,
  onMediaQueryListEvent,
} from './wowchemy-theming';

console.debug(`Environment: ${hugoEnvironment}`)

/* ---------------------------------------------------------------------------
 * Responsive scrolling for URL hashes.
 * --------------------------------------------------------------------------- */

// Dynamically get responsive navigation bar height for offsetting Scrollspy.
function getNavBarHeight() {
  let $navbar = $('#navbar-main');
  let navbar_offset = $navbar.outerHeight();
  console.debug('Navbar height: ' + navbar_offset);
  return navbar_offset;
}

/**
 * Responsive hash scrolling.
 * Check for a URL hash as an anchor.
 * If it exists on current page, scroll to it responsively.
 * If `target` argument omitted (e.g. after event), assume it's the window's hash.
 */
function scrollToAnchor(target, duration = 600) {
  // If `target` is undefined or HashChangeEvent object, set it to window's hash.
  // Decode the hash as browsers can encode non-ASCII characters (e.g. Chinese symbols).
  target = (typeof target === 'undefined' || typeof target === 'object') ? decodeURIComponent(window.location.hash) : target;

  // If target element exists, scroll to it taking into account fixed navigation bar offset.
  if ($(target).length) {
    // Escape special chars from IDs, such as colons found in Markdown footnote links.
    target = '#' + $.escapeSelector(target.substring(1));  // Previously, `target = target.replace(/:/g, '\\:');`

    let elementOffset = Math.ceil($(target).offset().top - getNavBarHeight());  // Round up to highlight right ID!
    $('body').addClass('scrolling');
    $('html, body').animate({
      scrollTop: elementOffset
    }, duration, function () {
      $('body').removeClass('scrolling');
    });
  } else {
    console.debug('Cannot scroll to target `#' + target + '`. ID not found!');
  }
}

// Make Scrollspy responsive.
function fixScrollspy() {
  let $body = $('body');
  let data = $body.data('bs.scrollspy');
  if (data) {
    data._config.offset = getNavBarHeight();
    $body.data('bs.scrollspy', data);
    $body.scrollspy('refresh');
  }
}

function removeQueryParamsFromUrl() {
  if (window.history.replaceState) {
    let urlWithoutSearchParams = window.location.protocol + "//" + window.location.host + window.location.pathname + window.location.hash;
    window.history.replaceState({path: urlWithoutSearchParams}, '', urlWithoutSearchParams);
  }
}

// Check for hash change event and fix responsive offset for hash links (e.g. Markdown footnotes).
window.addEventListener("hashchange", scrollToAnchor);

/* ---------------------------------------------------------------------------
 * Add smooth scrolling to all links inside the main navbar.
 * --------------------------------------------------------------------------- */

$('#navbar-main li.nav-item a.nav-link, .js-scroll').on('click', function (event) {
  // Store requested URL hash.
  let hash = this.hash;

  // If we are on a widget page and the navbar link is to a section on the same page.
  if (this.pathname === window.location.pathname && hash && $(hash).length && ($(".js-widget-page").length > 0)) {
    // Prevent default click behavior.
    event.preventDefault();

    // Use jQuery's animate() method for smooth page scrolling.
    // The numerical parameter specifies the time (ms) taken to scroll to the specified hash.
    let elementOffset = Math.ceil($(hash).offset().top - getNavBarHeight());  // Round up to highlight right ID!

    // Uncomment to debug.
    // let scrollTop = $(window).scrollTop();
    // let scrollDelta = (elementOffset - scrollTop);
    // console.debug('Scroll Delta: ' + scrollDelta);

    $('html, body').animate({
      scrollTop: elementOffset
    }, 800);
  }
});

/* ---------------------------------------------------------------------------
 * Hide mobile collapsable menu on clicking a link.
 * --------------------------------------------------------------------------- */

$(document).on('click', '.navbar-collapse.show', function (e) {
  //get the <a> element that was clicked, even if the <span> element that is inside the <a> element is e.target
  let targetElement = $(e.target).is('a') ? $(e.target) : $(e.target).parent();

  if (targetElement.is('a') && targetElement.attr('class') != 'dropdown-toggle') {
    $(this).collapse('hide');
  }
});

/* ---------------------------------------------------------------------------
 * Filter publications.
 * --------------------------------------------------------------------------- */

// Active publication filters.
let pubFilters = {};

// Search term.
let searchRegex;

// Filter values (concatenated).
let filterValues;

// Publication container.
let $grid_pubs = $('#container-publications');

// Initialise Isotope publication layout if required.
if ($grid_pubs.length) {
  $grid_pubs.isotope({
    itemSelector: '.isotope-item',
    percentPosition: true,
    masonry: {
      // Use Bootstrap compatible grid layout.
      columnWidth: '.grid-sizer'
    },
    filter: function () {
      let $this = $(this);
      let searchResults = searchRegex ? $this.text().match(searchRegex) : true;
      let filterResults = filterValues ? $this.is(filterValues) : true;
      return searchResults && filterResults;
    }
  });

  // Filter by search term.
  let $quickSearch = $('.filter-search').keyup(debounce(function () {
    searchRegex = new RegExp($quickSearch.val(), 'gi');
    $grid_pubs.isotope();
  }));

  $('.pub-filters').on('change', function () {
    let $this = $(this);

    // Get group key.
    let filterGroup = $this[0].getAttribute('data-filter-group');

    // Set filter for group.
    pubFilters[filterGroup] = this.value;

    // Combine filters.
    filterValues = concatValues(pubFilters);

    // Activate filters.
    $grid_pubs.isotope();

    // If filtering by publication type, update the URL hash to enable direct linking to results.
    if (filterGroup === "pubtype") {
      // Set hash URL to current filter.
      let url = $(this).val();
      if (url.substr(0, 9) === '.pubtype-') {
        window.location.hash = url.substr(9);
      } else {
        window.location.hash = '';
      }
    }
  });
}

// Debounce input to prevent spamming filter requests.
function debounce(fn, threshold) {
  let timeout;
  threshold = threshold || 100;
  return function debounced() {
    clearTimeout(timeout);
    let args = arguments;
    let _this = this;

    function delayed() {
      fn.apply(_this, args);
    }

    timeout = setTimeout(delayed, threshold);
  };
}

// Flatten object by concatenating values.
function concatValues(obj) {
  let value = '';
  for (let prop in obj) {
    value += obj[prop];
  }
  return value;
}

// Filter publications according to hash in URL.
function filter_publications() {
  // Check for Isotope publication layout.
  if (!$grid_pubs.length)
    return

  let urlHash = window.location.hash.replace('#', '');
  let filterValue = '*';

  // Check if hash is numeric.
  if (urlHash != '' && !isNaN(urlHash)) {
    filterValue = '.pubtype-' + urlHash;
  }

  // Set filter.
  let filterGroup = 'pubtype';
  pubFilters[filterGroup] = filterValue;
  filterValues = concatValues(pubFilters);

  // Activate filters.
  $grid_pubs.isotope();

  // Set selected option.
  $('.pubtype-select').val(filterValue);
}

/* ---------------------------------------------------------------------------
* Google Maps or OpenStreetMap via Leaflet.
* --------------------------------------------------------------------------- */
mapboxgl.accessToken = 'pk.eyJ1IjoiZWluZXMiLCJhIjoiY2toa3ZkaDBwMDByYTJ2cm51M2tidXp1cCJ9.vF1xEAD5Iuu0jR31UOu5VA';
// WEBGL alert if not supported
if (!mapboxgl.supported()) {
  alert('Your browser does not support Mapbox GL');
  } else
var map = new mapboxgl.Map({
container: 'map', // container id
style: 'mapbox://styles/mapbox/streets-v11?optimize=true', //stylesheet location
center: [24.964935, 60.290658], // starting position
zoom: 8,// starting zoom
maxZoom:10.5,


});

// https://github.com/mapbox/mapbox-gl-js/pull/9852 mobile scrolling
map.dragPan._touchPan._minTouches = 2;

function touchmove(e, points, mapTouches) {
  if (!this._active) return;

  if (e.targetTouches.length >= this._minTouches) {
    e.preventDefault();
  }

  return this._calculateTransform(e, points, mapTouches);
}

 map.dragPan._touchPan.touchmove = touchmove.bind(map.dragPan._touchPan);

map.touchZoomRotate.disableRotation();
map.touchPitch.disable();



// disable map zoom when using scroll
map.scrollZoom.disable();
// disable map rotation using right click + drag
map.dragRotate.disable();
// add full screen
map.addControl(new mapboxgl.FullscreenControl());
// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl());
var size = 200;
 
// implementation of CustomLayerInterface to draw a pulsing dot icon on the map
// see https://docs.mapbox.com/mapbox-gl-js/api/#customlayerinterface for more info
var pulsingDot = {
width: size,
height: size,
data: new Uint8Array(size * size * 4),
 
// get rendering context for the map canvas when layer is added to the map
onAdd: function () {
var canvas = document.createElement('canvas');
canvas.width = this.width;
canvas.height = this.height;
this.context = canvas.getContext('2d');
},
 
// called once before every frame where the icon will be used
render: function () {
var duration = 1000;
var t = (performance.now() % duration) / duration;
 
var radius = (size / 2) * 0.3;
var outerRadius = (size / 2) * 0.7 * t + radius;
var context = this.context;
 
// draw outer circle
context.clearRect(0, 0, this.width, this.height);
context.beginPath();
context.arc(
this.width / 2,
this.height / 2,
outerRadius,
0,
Math.PI * 2
);
context.fillStyle = 'rgba(255, 200, 200,' + (1 - t) + ')';
context.fill();
 
// draw inner circle
context.beginPath();
context.arc(
this.width / 2,
this.height / 2,
radius,
0,
Math.PI * 2
);
context.fillStyle = 'rgba(255, 100, 100, 1)';
context.strokeStyle = 'white';
context.lineWidth = 2 + 4 * (1 - t);
context.fill();
context.stroke();
 
// update this image's data with data from the canvas
this.data = context.getImageData(
0,
0,
this.width,
this.height
).data;
 
// continuously repaint the map, resulting in the smooth animation of the dot
map.triggerRepaint();
 
// return `true` to let the map know that the image was updated
return true;
}
};
 
map.on('load', function () {
map.addImage('pulsing-dot', pulsingDot, { pixelRatio: 2 });
 
map.addSource('points', {
'type': 'geojson',
'data': {
'type': 'FeatureCollection',
'features': [
{
'type': 'Feature',
'geometry': {
'type': 'Point',
'coordinates': [24.964935, 60.290658]
}
}
]
}
});
map.addLayer({
'id': 'points',
'type': 'symbol',
'source': 'points',
'layout': {
'icon-image': 'pulsing-dot'
}
});
});
/* ---------------------------------------------------------------------------
 * GitHub API.
 * --------------------------------------------------------------------------- */

function printLatestRelease(selector, repo) {
  if (hugoEnvironment === 'production') {
  $.getJSON('https://api.github.com/repos/' + repo + '/tags').done(function (json) {
    let release = json[0];
    $(selector).append(' ' + release.name);
  }).fail(function (jqxhr, textStatus, error) {
    let err = textStatus + ", " + error;
    console.log("Request Failed: " + err);
  });
}
}

/* ---------------------------------------------------------------------------
* Toggle search dialog.
* --------------------------------------------------------------------------- */

function toggleSearchDialog() {
  if ($('body').hasClass('searching')) {
    // Clear search query and hide search modal.
    $('[id=search-query]').blur();
    $('body').removeClass('searching compensate-for-scrollbar');

    // Remove search query params from URL as user has finished searching.
    removeQueryParamsFromUrl();

    // Prevent fixed positioned elements (e.g. navbar) moving due to scrollbars.
    $('#fancybox-style-noscroll').remove();
  } else {
    // Prevent fixed positioned elements (e.g. navbar) moving due to scrollbars.
    if (!$('#fancybox-style-noscroll').length && document.body.scrollHeight > window.innerHeight) {
      $('head').append(
        '<style id="fancybox-style-noscroll">.compensate-for-scrollbar{margin-right:' +
        (window.innerWidth - document.documentElement.clientWidth) +
        'px;}</style>'
      );
      $('body').addClass('compensate-for-scrollbar');
    }

    // Show search modal.
    $('body').addClass('searching');
    $('.search-results').css({opacity: 0, visibility: 'visible'}).animate({opacity: 1}, 200);
    $('#search-query').focus();
  }
}

/* ---------------------------------------------------------------------------
* Normalize Bootstrap Carousel Slide Heights.
* --------------------------------------------------------------------------- */

function normalizeCarouselSlideHeights() {
  $('.carousel').each(function () {
    // Get carousel slides.
    let items = $('.carousel-item', this);
    // Reset all slide heights.
    items.css('min-height', 0);
    // Normalize all slide heights.
    let maxHeight = Math.max.apply(null, items.map(function () {
      return $(this).outerHeight()
    }).get());
    items.css('min-height', maxHeight + 'px');
  })
}

/* ---------------------------------------------------------------------------
* Fix Hugo's Goldmark output and Mermaid code blocks.
* --------------------------------------------------------------------------- */

/**
 * Fix Hugo's Goldmark output.
 */
function fixHugoOutput() {
  // Fix Goldmark table of contents.
  // - Must be performed prior to initializing ScrollSpy.
  $('#TableOfContents').addClass('nav flex-column');
  $('#TableOfContents li').addClass('nav-item');
  $('#TableOfContents li a').addClass('nav-link');

  // Fix Goldmark task lists (remove bullet points).
  $("input[type='checkbox'][disabled]").parents('ul').addClass('task-list');
}

// Get an element's siblings.
function getSiblings(elem) {
  // Filter out itself.
  return Array.prototype.filter.call(elem.parentNode.children, function (sibling) {
    return sibling !== elem;
    });
  }

/* ---------------------------------------------------------------------------
 * On document ready.
 * --------------------------------------------------------------------------- */

$(document).ready(function () {
  fixHugoOutput();
  fixMermaid();

  // Initialise code highlighting if enabled for this page.
  // Note: this block should be processed after the Mermaid code-->div conversion.
  if (code_highlighting) {
    hljs.initHighlighting();
  }

   // Render theme variation, including any HLJS and Mermaid themes.
   let {isDarkTheme, themeMode} = initThemeVariation();
   renderThemeVariation(isDarkTheme, themeMode, true);
});

/* ---------------------------------------------------------------------------
 * On window loaded.
 * --------------------------------------------------------------------------- */

$(window).on('load', function () {
 // Init Isotope Layout Engine for instances of the Portfolio widget.
 let isotopeInstances = document.querySelectorAll('.projects-container');
 let isotopeInstancesCount = isotopeInstances.length;
 let isotopeCounter = 0;
 isotopeInstances.forEach(function (isotopeInstance, index) {
   console.debug(`Loading Isotope instance ${index}`);

   // Isotope instance
   let iso;

  // Get the layout for this Isotope instance
  let isoSection = isotopeInstance.closest('section');
  let layout = '';
  if (isoSection.querySelector('.isotope').classList.contains('js-layout-row')) {
      layout = 'fitRows';
    } else {
      layout = 'masonry';
    }

 // Get default filter (if any) for this instance
 let defaultFilter = isoSection.querySelector('.default-project-filter');
 let filterText = '*';
 if (defaultFilter !== null) {
   filterText = defaultFilter.textContent;
 }
 console.debug(`Default Isotope filter: ${filterText}`);

 // Init Isotope instance once its images have loaded.
 imagesLoaded(isotopeInstance, function () {
   iso = new Isotope(isotopeInstance, {
        itemSelector: '.isotope-item',
        layoutMode: layout,
        masonry: {
          gutter: 20
        },
        filter: filterText
      });

      // Filter Isotope items when a toolbar filter button is clicked.
      let isoFilterButtons = isoSection.querySelectorAll('.project-filters a');
      isoFilterButtons.forEach(button => button.addEventListener('click', (e) => {
        e.preventDefault();
        let selector = button.getAttribute('data-filter');

        // Apply filter
        console.debug(`Updating Isotope filter to ${selector}`);
        iso.arrange({filter: selector});

        // Update active toolbar filter button
        button.classList.remove('active');
        button.classList.add('active');
        let buttonSiblings = getSiblings(button);
        buttonSiblings.forEach(buttonSibling => {
          buttonSibling.classList.remove('active');
          buttonSibling.classList.remove('all');
        });
      }));

          // Check if all Isotope instances have loaded.
          incrementIsotopeCounter();
        });
      });

 // Hook to perform actions once all Isotope instances have loaded.
 function incrementIsotopeCounter() {
  isotopeCounter++;
  if (isotopeCounter === isotopeInstancesCount) {
    console.debug(`All Portfolio Isotope instances loaded.`);
    // Once all Isotope instances and their images have loaded, scroll to hash (if set).
    // Prevents scrolling to the wrong location due to the dynamic height of Isotope instances.
    // Each Isotope instance height is affected by applying filters and loading images.
    // Without this logic, the scroll location can appear correct, but actually a few pixels out and hence Scrollspy
    // can highlight the wrong nav link.
    if (window.location.hash) {
      scrollToAnchor(decodeURIComponent(window.location.hash), 0);
    }
  }
}

  // Enable publication filter for publication index page.
  if ($('.pub-filters-select')) {
    filter_publications();
    // Useful for changing hash manually (e.g. in development):
    // window.addEventListener('hashchange', filter_publications, false);
  }

  // Load citation modal on 'Cite' click.
  $('.js-cite-modal').click(function (e) {
    e.preventDefault();
    let filename = $(this).attr('data-filename');
    let modal = $('#modal');
    modal.find('.modal-body code').load(filename, function (response, status, xhr) {
      if (status == 'error') {
        let msg = "Error: ";
        $('#modal-error').html(msg + xhr.status + " " + xhr.statusText);
      } else {
        $('.js-download-cite').attr('href', filename);
      }
    });
    modal.modal('show');
  });

  // Copy citation text on 'Copy' click.
  $('.js-copy-cite').click(function (e) {
    e.preventDefault();
    // Get selection.
    let range = document.createRange();
    let code_node = document.querySelector('#modal .modal-body');
    range.selectNode(code_node);
    window.getSelection().addRange(range);
    try {
      // Execute the copy command.
      document.execCommand('copy');
    } catch (e) {
      console.log('Error: citation copy failed.');
    }
    // Remove selection.
    window.getSelection().removeRange(range);
  });

  // Initialise Google Maps if necessary.
  initMap();

  // Print latest version of GitHub projects.
  let githubReleaseSelector = '.js-github-release';
  if ($(githubReleaseSelector).length > 0) {
    printLatestRelease(githubReleaseSelector, $(githubReleaseSelector).data('repo'));
  }

  // On search icon click toggle search dialog.
  $('.js-search').click(function (e) {
    e.preventDefault();
    toggleSearchDialog();
  });
  $(document).on('keydown', function (e) {
    if (e.which == 27) {
      // `Esc` key pressed.
      if ($('body').hasClass('searching')) {
        toggleSearchDialog();
      }
    } else if (e.which == 191 && e.shiftKey == false && !$('input,textarea').is(':focus')) {
      // `/` key pressed outside of text input.
      e.preventDefault();
      toggleSearchDialog();
    }
  });

  // Init. author notes (tooltips).
  $('[data-toggle="tooltip"]').tooltip();

  // Re-initialize Scrollspy with dynamic navbar height offset.
  fixScrollspy();
});

// Theme chooser events.
let linkLight = document.querySelector('.js-set-theme-light');
let linkDark = document.querySelector('.js-set-theme-dark');
let linkAuto = document.querySelector('.js-set-theme-auto');
if (linkLight && linkDark && linkAuto) {
  linkLight.addEventListener('click', event => {
    event.preventDefault();
    changeThemeModeClick(0);
  });
  linkDark.addEventListener('click', event => {
    event.preventDefault();
    changeThemeModeClick(1);
  });
  linkAuto.addEventListener('click', event => {
    event.preventDefault();
    changeThemeModeClick(2);
  });
}

// Media Query events.
// Live update of day/night mode on system preferences update (no refresh required).
// Note: since we listen only for *dark* events, we won't detect other scheme changes such as light to no-preference.
const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
darkModeMediaQuery.addEventListener("change", (event) => {
  onMediaQueryListEvent(event);
});

// Normalize Bootstrap carousel slide heights for Slider widget instances.
window.addEventListener('load', normalizeCarouselSlideHeights);
window.addEventListener('resize', normalizeCarouselSlideHeights);
window.addEventListener('orientationchange', normalizeCarouselSlideHeights);

// Automatic main menu dropdowns on mouse over.
$('body').on('mouseenter mouseleave', '.dropdown', function (e) {
  var dropdown = $(e.target).closest('.dropdown');
  var menu = $('.dropdown-menu', dropdown);
  dropdown.addClass('show');
  menu.addClass('show');
  setTimeout(function () {
    dropdown[dropdown.is(':hover') ? 'addClass' : 'removeClass']('show');
    menu[dropdown.is(':hover') ? 'addClass' : 'removeClass']('show');
  }, 300);
});

// Call `fixScrollspy` when window is resized.
let resizeTimer;
$(window).resize(function () {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(fixScrollspy, 200);
});
