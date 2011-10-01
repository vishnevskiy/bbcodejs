(function() {
  var CenterBBCodeTag, CodeBBCodeTag, ColorBBCodeTag, HorizontalRuleBBCodeTag, ImageBBCodeTag, LinkBBCodeTag, ListBBCodeTag, ListItemBBCodeTag, QuoteBBCodeTag, RightBBCodeTag, SizeBBCodeTag, createSimpleTag, _LINE_BREAK, _NEWLINE_RE;
  var __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  _NEWLINE_RE = /\r?\n/g;
  _LINE_BREAK = '<br />';
  window.BBCodeTag = (function() {
    function BBCodeTag(renderer, settings) {
      var key, value, _i, _len, _ref, _ref2, _ref3;
      this.renderer = renderer;
      if (settings == null) {
        settings = {};
      }
      this.CLOSED_BY = [];
      this.SELF_CLOSE = false;
      this.STRIP_INNER = false;
      this.STRIP_OUTER = false;
      this.DISCARD_TEXT = false;
      this.name = settings['name'] || null;
      this.parent = settings['parent'] || null;
      this.text = settings['text'] || '';
      if (this.parent) {
        this.parent.children.push(this);
      }
      if ((_ref = settings['params']) == null) {
        settings['params'] = [];
      }
      this.params = {};
      _ref2 = settings['params'];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        _ref3 = _ref2[_i], key = _ref3[0], value = _ref3[1];
        if (value) {
          this.params[key] = value;
        }
      }
      this.children = [];
    }
    BBCodeTag.prototype.getContent = function(raw) {
      var child, children, content, pieces, text, _i, _len;
      if (raw == null) {
        raw = false;
      }
      pieces = [];
      if (this.text) {
        text = this.renderer.escape(this.text);
        if (!raw) {
          if (this.renderer.options['linkify']) {
            text = this.renderer.linkify(text);
          }
          text = this.renderer.cosmeticReplace(text.replace(_NEWLINE_RE, _LINE_BREAK));
        }
        pieces.push(text);
      }
      children = this.children;
      for (_i = 0, _len = children.length; _i < _len; _i++) {
        child = children[_i];
        if (raw) {
          pieces.push(child.toText());
        } else {
          if (this.DISCARD_TEXT && child.name === null) {
            continue;
          }
          pieces.push(child.toHTML());
        }
      }
      content = pieces.join('');
      if (!raw && this.STRIP_INNER) {
        content = this.renderer.strip(content);
        while (content.slice(0, _LINE_BREAK.length) === _LINE_BREAK) {
          content = content.slice(_LINE_BREAK.length);
        }
        while (content.slice(-_LINE_BREAK.length) === _LINE_BREAK) {
          content = content.slice(0, -_LINE_BREAK.length);
        }
        content = this.renderer.strip(content);
      }
      return content;
    };
    BBCodeTag.prototype.toText = function(contentAsHTML) {
      var k, params, pieces, v, _ref;
      if (contentAsHTML == null) {
        contentAsHTML = false;
      }
      pieces = [];
      if (this.name !== null) {
        if (this.params.length) {
          params = ((function() {
            var _ref, _results;
            _ref = this.params;
            _results = [];
            for (k in _ref) {
              v = _ref[k];
              _results.push([k, v].join('='));
            }
            return _results;
          }).call(this)).join(' ');
          if (this.name in this.params) {
            pieces.push("[" + params + "]");
          } else {
            pieces.push("[" + this.name + " " + params + "]");
          }
        } else {
          pieces.push("[" + this.name + "]");
        }
      }
      pieces.push(this.getContent(!contentAsHTML));
      if (this.name !== null && (_ref = this.name, __indexOf.call(this.CLOSED_BY, _ref) < 0)) {
        pieces.push("[/" + this.name + "]");
      }
      return pieces.join('');
    };
    BBCodeTag.prototype._toHTML = function() {
      return [this.toText(true)];
    };
    BBCodeTag.prototype.toHTML = function() {
      return this._toHTML().join('');
    };
    return BBCodeTag;
  })();
  CodeBBCodeTag = (function() {
    __extends(CodeBBCodeTag, BBCodeTag);
    function CodeBBCodeTag() {
      CodeBBCodeTag.__super__.constructor.apply(this, arguments);
      this.STRIP_INNER = true;
      this._inline = this.params['code'] === 'inline';
      if (!this._inline) {
        this.STRIP_OUTER = true;
      }
    }
    CodeBBCodeTag.prototype._toHTML = function() {
      var lang;
      if (this._inline) {
        return ['<code>', this.getContent(true), '</code>'];
      }
      lang = this.params['lang'] || this.params[this.name];
      if (lang) {
        return ["<pre class=\"prettyprint lang-" + lang + "\">", this.getContent(true), '</pre>'];
      } else {
        return ['<pre>', this.getContent(true), '</pre>'];
      }
    };
    return CodeBBCodeTag;
  })();
  ImageBBCodeTag = (function() {
    __extends(ImageBBCodeTag, BBCodeTag);
    function ImageBBCodeTag() {
      ImageBBCodeTag.__super__.constructor.apply(this, arguments);
    }
    ImageBBCodeTag.prototype._toHTML = function() {
      var attributes;
      attributes = {
        src: this.renderer.strip(this.getContent(true))
      };
      if ('width' in this.params) {
        attributes['width'] = this.params['width'];
      }
      if ('height' in this.params) {
        attributes['height'] = this.params['height'];
      }
      return ["<img " + (this.renderer.htmlAttributes(attributes)) + " />"];
    };
    return ImageBBCodeTag;
  })();
  SizeBBCodeTag = (function() {
    __extends(SizeBBCodeTag, BBCodeTag);
    function SizeBBCodeTag() {
      SizeBBCodeTag.__super__.constructor.apply(this, arguments);
    }
    SizeBBCodeTag.prototype._toHTML = function() {
      var size;
      size = this.params['size'];
      if (isNaN(size)) {
        return this.getContent();
      }
      return ["<span style=\"font-size:" + size + "px\">", this.getContent(), '</span>'];
    };
    return SizeBBCodeTag;
  })();
  ColorBBCodeTag = (function() {
    __extends(ColorBBCodeTag, BBCodeTag);
    function ColorBBCodeTag() {
      ColorBBCodeTag.__super__.constructor.apply(this, arguments);
    }
    ColorBBCodeTag.prototype._toHTML = function() {
      var color;
      color = this.params['color'];
      if (!color) {
        return this.getContent();
      }
      return ["<span style=\"color:" + color + "\">", this.getContent(), '</span>'];
    };
    return ColorBBCodeTag;
  })();
  CenterBBCodeTag = (function() {
    __extends(CenterBBCodeTag, BBCodeTag);
    function CenterBBCodeTag() {
      CenterBBCodeTag.__super__.constructor.apply(this, arguments);
    }
    CenterBBCodeTag.prototype._toHTML = function() {
      return ['<div style="text-align:center;">', this.getContent(), '</div>'];
    };
    return CenterBBCodeTag;
  })();
  RightBBCodeTag = (function() {
    __extends(RightBBCodeTag, BBCodeTag);
    function RightBBCodeTag() {
      RightBBCodeTag.__super__.constructor.apply(this, arguments);
    }
    RightBBCodeTag.prototype._toHTML = function() {
      return ['<div style="float:right;">', this.getContent(), '</div>'];
    };
    return RightBBCodeTag;
  })();
  HorizontalRuleBBCodeTag = (function() {
    __extends(HorizontalRuleBBCodeTag, BBCodeTag);
    function HorizontalRuleBBCodeTag() {
      HorizontalRuleBBCodeTag.__super__.constructor.apply(this, arguments);
      this.SELF_CLOSE = true;
      this.STRIP_OUTER = true;
    }
    HorizontalRuleBBCodeTag.prototype._toHTML = function() {
      return ['<hr />'];
    };
    return HorizontalRuleBBCodeTag;
  })();
  ListBBCodeTag = (function() {
    __extends(ListBBCodeTag, BBCodeTag);
    function ListBBCodeTag() {
      ListBBCodeTag.__super__.constructor.apply(this, arguments);
      this.STRIP_INNER = true;
      this.STRIP_OUTER = true;
    }
    ListBBCodeTag.prototype._toHTML = function() {
      var listType;
      listType = this.params['list'];
      if (listType === '1') {
        return ['<ol>', this.getContent(), '</ol>'];
      } else if (listType === 'a') {
        return ['<ol style="list-style-type:lower-alpha;">', this.getContent(), '</ol>'];
      } else if (listType === 'A') {
        return ['<ol style="list-style-type:upper-alpha;">', this.getContent(), '</ol>'];
      } else {
        return ['<ul>', this.getContent(), '</ul>'];
      }
    };
    return ListBBCodeTag;
  })();
  ListItemBBCodeTag = (function() {
    __extends(ListItemBBCodeTag, BBCodeTag);
    function ListItemBBCodeTag() {
      ListItemBBCodeTag.__super__.constructor.apply(this, arguments);
      this.CLOSED_BY = ['*', '/list'];
      this.STRIP_INNER = true;
    }
    ListItemBBCodeTag.prototype._toHTML = function() {
      return ['<li>', this.getContent(), '</li>'];
    };
    return ListItemBBCodeTag;
  })();
  QuoteBBCodeTag = (function() {
    __extends(QuoteBBCodeTag, BBCodeTag);
    function QuoteBBCodeTag() {
      QuoteBBCodeTag.__super__.constructor.apply(this, arguments);
      this.STRIP_INNER = true;
      this.STRIP_OUTER = true;
    }
    QuoteBBCodeTag.prototype._toHTML = function() {
      var citation, pieces;
      pieces = ['<blockquote>', this.getContent()];
      citation = this.params['quote'];
      if (citation) {
        pieces.push('<small>');
        pieces.push(citation);
        pieces.push('</small>');
      }
      pieces.push('</blockquote>');
      return pieces;
    };
    return QuoteBBCodeTag;
  })();
  LinkBBCodeTag = (function() {
    __extends(LinkBBCodeTag, BBCodeTag);
    function LinkBBCodeTag() {
      LinkBBCodeTag.__super__.constructor.apply(this, arguments);
    }
    LinkBBCodeTag.prototype._toHTML = function() {
      var url;
      url = this.renderer.strip(this.params[this.name] || this.getContent(true));
      if (/javascript:/i.test(url)) {
        url = '';
      } else if (!/:/.test(url)) {
        url = 'http://' + url;
      }
      if (url) {
        return this.renderer.context({
          'linkify': false
        }, __bind(function() {
          return ["<a href=\"" + url + "\" target=\"_blank\">", this.getContent(), '</a>'];
        }, this));
      } else {
        return [this.getContent()];
      }
    };
    return LinkBBCodeTag;
  })();
  createSimpleTag = function(name, attributes) {
    var SimpleTag;
    return SimpleTag = (function() {
      __extends(SimpleTag, BBCodeTag);
      function SimpleTag() {
        var k, v;
        SimpleTag.__super__.constructor.apply(this, arguments);
        for (k in attributes) {
          v = attributes[k];
          this[k] = v;
        }
      }
      SimpleTag.prototype._toHTML = function() {
        var htmlAttributes;
        htmlAttributes = this.renderer.htmlAttributes(this.params);
        if (htmlAttributes) {
          htmlAttributes = ' ' + htmlAttributes;
        }
        return ["<" + name + htmlAttributes + ">", this.getContent(), "</" + name + ">"];
      };
      return SimpleTag;
    })();
  };
  window.BBCODE_TAGS = {
    b: createSimpleTag('strong'),
    i: createSimpleTag('em'),
    u: createSimpleTag('u'),
    s: createSimpleTag('strike'),
    h1: createSimpleTag('h1', {
      STRIP_OUTER: true
    }),
    h2: createSimpleTag('h2', {
      STRIP_OUTER: true
    }),
    h3: createSimpleTag('h3', {
      STRIP_OUTER: true
    }),
    h4: createSimpleTag('h4', {
      STRIP_OUTER: true
    }),
    h5: createSimpleTag('h5', {
      STRIP_OUTER: true
    }),
    h6: createSimpleTag('h6', {
      STRIP_OUTER: true
    }),
    pre: createSimpleTag('pre'),
    table: createSimpleTag('table', {
      DISCARD_TEXT: true
    }),
    thead: createSimpleTag('thead', {
      DISCARD_TEXT: true
    }),
    tbody: createSimpleTag('tbody', {
      DISCARD_TEXT: true
    }),
    tr: createSimpleTag('tr', {
      DISCARD_TEXT: true
    }),
    th: createSimpleTag('th'),
    td: createSimpleTag('td'),
    code: CodeBBCodeTag,
    img: ImageBBCodeTag,
    hr: HorizontalRuleBBCodeTag,
    size: SizeBBCodeTag,
    center: CenterBBCodeTag,
    right: RightBBCodeTag,
    color: ColorBBCodeTag,
    list: ListBBCodeTag,
    '*': ListItemBBCodeTag,
    quote: QuoteBBCodeTag,
    url: LinkBBCodeTag,
    link: LinkBBCodeTag
  };
}).call(this);
