/* @requires mapshaper-gui-lib */

function MapExtent(el, opts) {
  var _position = new ElementPosition(el),
      _padPix = opts.padding,
      _scale = 1,
      _cx,
      _cy,
      _contentBounds;

  _position.on('resize', function() {
    this.dispatchEvent('change');
    this.dispatchEvent('navigate');
    this.dispatchEvent('resize');
  }, this);

  this.reset = function() {
    this.recenter(_contentBounds.centerX(), _contentBounds.centerY(), 1);
  };

  this.recenter = function(cx, cy, scale) {
    if (!scale) scale = _scale;
    if (!(cx == _cx && cy == _cy && scale == _scale)) {
      _cx = cx;
      _cy = cy;
      _scale = scale;
      this.dispatchEvent('change');
      this.dispatchEvent('navigate');
    }
  };

  this.pan = function(xpix, ypix) {
    var t = this.getTransform();
    this.recenter(_cx - xpix / t.mx, _cy - ypix / t.my);
  };

  // Zoom to @scale (a multiple of the map's full scale)
  // @xpct, @ypct: optional focus, [0-1]...
  this.rescale = function(scale, xpct, ypct) {
    if (arguments.length < 3) {
      xpct = 0.5;
      ypct = 0.5;
    }
    var b = this.getBounds(),
        fx = b.xmin + xpct * b.width(),
        fy = b.ymax - ypct * b.height(),
        dx = b.centerX() - fx,
        dy = b.centerY() - fy,
        ds = _scale / scale,
        dx2 = dx * ds,
        dy2 = dy * ds,
        cx = fx + dx2,
        cy = fy + dy2;
    this.recenter(cx, cy, scale);
  };

  this.resize = _position.resize;
  this.width = _position.width;
  this.height = _position.height;
  this.position = _position.position;

  // get zoom factor (1 == full extent, 2 == 2x zoom, etc.)
  this.scale = function() {
    return _scale;
  };

  this.getPixelSize = function() {
    return 1 / this.getTransform().mx;
  };

  // Get params for converting geographic coords to pixel coords
  this.getTransform = function() {
    // get transform (y-flipped);
    var viewBounds = new Bounds(0, 0, _position.width(), _position.height());
    return this.getBounds().getTransform(viewBounds, true);
  };

  this.getBounds = function() {
    return centerAlign(calcBounds(_cx, _cy, _scale));
  };

  // Update the extent of 'full' zoom without navigating the current view
  this.setBounds = function(b) {
    var prev = _contentBounds;
    _contentBounds = b;
    if (prev) {
      _scale = _scale * centerAlign(b).width() / centerAlign(prev).width();
    } else {
      _cx = b.centerX();
      _cy = b.centerY();
    }
  };

  function calcBounds(cx, cy, scale) {
    var w = _contentBounds.width() / scale,
        h = _contentBounds.height() / scale;
    return new Bounds(cx - w/2, cy - h/2, cx + w/2, cy + h/2);
  }

  // Receive: Geographic bounds of content to be centered in the map
  // Return: Geographic bounds of map window centered on @_contentBounds,
  //    with padding applied
  function centerAlign(_contentBounds) {
    var bounds = _contentBounds.clone(),
        wpix = _position.width() - 2 * _padPix,
        hpix = _position.height() - 2 * _padPix,
        padGeo;
    if (wpix <= 0 || hpix <= 0) {
      return new Bounds(0, 0, 0, 0);
    }
    bounds.fillOut(wpix / hpix);
    padGeo = _padPix * bounds.width() / wpix; // per-pixel scale
    bounds.padBounds(padGeo, padGeo, padGeo, padGeo);
    return bounds;
  }
}

utils.inherit(MapExtent, EventDispatcher);