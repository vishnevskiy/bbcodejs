(function() {
  this.bbcode = {};
}).call(this);
(function() {
  var key, _COSMETIC_DICT, _COSMETIC_RE, _ESCAPE_DICT, _ESCAPE_RE, _URL_RE;
  var __slice = Array.prototype.slice;
  _ESCAPE_RE = /[&<>"]/g;
  _ESCAPE_DICT = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  };
  _URL_RE = /\b((?:([\w-]+):(\/{1,3})|www[.])(?:(?:(?:[^\s&()]|&amp;|&quot;)*(?:[^!"#$%&'()*+,.:;<=>?@\[\]^`{|}~\s]))|(?:\((?:[^\s&()]|&amp;|&quot;)*\)))+)/g;
  _COSMETIC_DICT = {
    '--': '&ndash;',
    '---': '&mdash;',
    '...': '&#8230;',
    '(c)': '&copy;',
    '(reg)': '&reg;',
    '(tm)': '&trade;'
  };
  _COSMETIC_RE = new RegExp(((function() {
    var _results;
    _results = [];
    for (key in _COSMETIC_DICT) {
      _results.push(key.replace(/(\.|\)|\()/g, '\\$1'));
    }
    return _results;
  })()).join('|'));
  this.bbcode.Renderer = (function() {
    function Renderer() {
      this._contexts = [];
      this.options = {
        linkify: true
      };
    }
    Renderer.prototype.context = function(context, func) {
      var k, newOptions, v, _ref;
      newOptions = {};
      _ref = this.options;
      for (k in _ref) {
        v = _ref[k];
        newOptions[k] = v;
      }
      for (k in context) {
        v = context[k];
        newOptions[k] = v;
      }
      this._contexts.push(this.options);
      this.options = newOptions;
      v = func();
      this.options = this._contexts.pop();
      return v;
    };
    Renderer.prototype.escape = function(value) {
      return value.replace(_ESCAPE_RE, function(match) {
        return _ESCAPE_DICT[match];
      });
    };
    Renderer.prototype.linkify = function(value) {
      return value.replace(_URL_RE, function() {
        var href, match, proto, url;
        match = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        url = match[1];
        proto = match[2];
        if (proto && (proto !== 'http' && proto !== 'https')) {
          return url;
        }
        href = match[1];
        if (!proto) {
          href = 'http://' + href;
        }
        return "<a href=\"" + href + "\" target=\"_blank\">" + url + "</a>";
      });
    };
    Renderer.prototype.strip = function(text) {
      return text.replace(/^\s+|\s+$/g, '');
    };
    Renderer.prototype.cosmeticReplace = function(value) {
      return value.replace(_COSMETIC_RE, function() {
        var item, match;
        match = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        item = match[0];
        return _COSMETIC_DICT[item] || item;
      });
    };
    Renderer.prototype.htmlAttributes = function(attributes) {
      var k, v;
      if (!attributes) {
        return '';
      }
      return ((function() {
        var _results;
        _results = [];
        for (k in attributes) {
          v = attributes[k];
          _results.push("" + k + "=\"" + v + "\"");
        }
        return _results;
      })()).join(' ');
    };
    return Renderer;
  })();
}).call(this);
(function() {
  var CenterTag, CodeTag, ColorTag, HorizontalRuleTag, ImageTag, LinkTag, ListItemTag, ListTag, QuoteTag, RightTag, SizeTag, _LINE_BREAK, _NEWLINE_RE;
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
  this.bbcode.Tag = (function() {
    function Tag(renderer, settings) {
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
    Tag.prototype.getContent = function(raw) {
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
    Tag.prototype.toText = function(contentAsHTML) {
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
    Tag.prototype._toHTML = function() {
      return this.toText(true);
    };
    Tag.prototype.toHTML = function() {
      var pieces;
      pieces = this._toHTML();
      if (typeof pieces === 'string') {
        return pieces;
      } else {
        return pieces.join('');
      }
    };
    return Tag;
  })();
  CodeTag = (function() {
    __extends(CodeTag, this.bbcode.Tag);
    function CodeTag() {
      CodeTag.__super__.constructor.apply(this, arguments);
      this.STRIP_INNER = true;
      this._inline = this.params['code'] === 'inline';
      if (!this._inline) {
        this.STRIP_OUTER = true;
      }
    }
    CodeTag.prototype._toHTML = function() {
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
    return CodeTag;
  }).call(this);
  ImageTag = (function() {
    __extends(ImageTag, this.bbcode.Tag);
    function ImageTag() {
      ImageTag.__super__.constructor.apply(this, arguments);
    }
    ImageTag.prototype._toHTML = function() {
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
      return "<img " + (this.renderer.htmlAttributes(attributes)) + " />";
    };
    return ImageTag;
  }).call(this);
  SizeTag = (function() {
    __extends(SizeTag, this.bbcode.Tag);
    function SizeTag() {
      SizeTag.__super__.constructor.apply(this, arguments);
    }
    SizeTag.prototype._toHTML = function() {
      var size;
      size = this.params['size'];
      if (isNaN(size)) {
        return this.getContent();
      } else {
        return ["<span style=\"font-size:" + size + "px\">", this.getContent(), '</span>'];
      }
    };
    return SizeTag;
  }).call(this);
  ColorTag = (function() {
    __extends(ColorTag, this.bbcode.Tag);
    function ColorTag() {
      ColorTag.__super__.constructor.apply(this, arguments);
    }
    ColorTag.prototype._toHTML = function() {
      var color;
      color = this.params['color'];
      if (color != null) {
        return ["<span style=\"color:" + color + "\">", this.getContent(), '</span>'];
      } else {
        return this.getContent();
      }
    };
    return ColorTag;
  }).call(this);
  CenterTag = (function() {
    __extends(CenterTag, this.bbcode.Tag);
    function CenterTag() {
      CenterTag.__super__.constructor.apply(this, arguments);
    }
    CenterTag.prototype._toHTML = function() {
      return ['<div style="text-align:center;">', this.getContent(), '</div>'];
    };
    return CenterTag;
  }).call(this);
  RightTag = (function() {
    __extends(RightTag, this.bbcode.Tag);
    function RightTag() {
      RightTag.__super__.constructor.apply(this, arguments);
    }
    RightTag.prototype._toHTML = function() {
      return ['<div style="float:right;">', this.getContent(), '</div>'];
    };
    return RightTag;
  }).call(this);
  HorizontalRuleTag = (function() {
    __extends(HorizontalRuleTag, this.bbcode.Tag);
    function HorizontalRuleTag() {
      HorizontalRuleTag.__super__.constructor.apply(this, arguments);
      this.SELF_CLOSE = true;
      this.STRIP_OUTER = true;
    }
    HorizontalRuleTag.prototype._toHTML = function() {
      return '<hr />';
    };
    return HorizontalRuleTag;
  }).call(this);
  ListTag = (function() {
    __extends(ListTag, this.bbcode.Tag);
    function ListTag() {
      ListTag.__super__.constructor.apply(this, arguments);
      this.STRIP_INNER = true;
      this.STRIP_OUTER = true;
    }
    ListTag.prototype._toHTML = function() {
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
    return ListTag;
  }).call(this);
  ListItemTag = (function() {
    __extends(ListItemTag, this.bbcode.Tag);
    function ListItemTag() {
      ListItemTag.__super__.constructor.apply(this, arguments);
      this.CLOSED_BY = ['*', '/list'];
      this.STRIP_INNER = true;
    }
    ListItemTag.prototype._toHTML = function() {
      return ['<li>', this.getContent(), '</li>'];
    };
    return ListItemTag;
  }).call(this);
  QuoteTag = (function() {
    __extends(QuoteTag, this.bbcode.Tag);
    function QuoteTag() {
      QuoteTag.__super__.constructor.apply(this, arguments);
      this.STRIP_INNER = true;
      this.STRIP_OUTER = true;
    }
    QuoteTag.prototype._toHTML = function() {
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
    return QuoteTag;
  }).call(this);
  LinkTag = (function() {
    __extends(LinkTag, this.bbcode.Tag);
    function LinkTag() {
      LinkTag.__super__.constructor.apply(this, arguments);
    }
    LinkTag.prototype._toHTML = function() {
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
        return this.getContent();
      }
    };
    return LinkTag;
  }).call(this);
  this.bbcode.createSimpleTag = __bind(function(name, attributes) {
    var SimpleTag;
    return SimpleTag = (function() {
      __extends(SimpleTag, this.bbcode.Tag);
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
    }).call(this);
  }, this);
  this.bbcode.BUILTIN = {
    b: this.bbcode.createSimpleTag('strong'),
    i: this.bbcode.createSimpleTag('em'),
    u: this.bbcode.createSimpleTag('u'),
    s: this.bbcode.createSimpleTag('strike'),
    h1: this.bbcode.createSimpleTag('h1', {
      STRIP_OUTER: true
    }),
    h2: this.bbcode.createSimpleTag('h2', {
      STRIP_OUTER: true
    }),
    h3: this.bbcode.createSimpleTag('h3', {
      STRIP_OUTER: true
    }),
    h4: this.bbcode.createSimpleTag('h4', {
      STRIP_OUTER: true
    }),
    h5: this.bbcode.createSimpleTag('h5', {
      STRIP_OUTER: true
    }),
    h6: this.bbcode.createSimpleTag('h6', {
      STRIP_OUTER: true
    }),
    pre: this.bbcode.createSimpleTag('pre'),
    table: this.bbcode.createSimpleTag('table', {
      DISCARD_TEXT: true
    }),
    thead: this.bbcode.createSimpleTag('thead', {
      DISCARD_TEXT: true
    }),
    tbody: this.bbcode.createSimpleTag('tbody', {
      DISCARD_TEXT: true
    }),
    tr: this.bbcode.createSimpleTag('tr', {
      DISCARD_TEXT: true
    }),
    th: this.bbcode.createSimpleTag('th'),
    td: this.bbcode.createSimpleTag('td'),
    code: CodeTag,
    img: ImageTag,
    hr: HorizontalRuleTag,
    size: SizeTag,
    center: CenterTag,
    right: RightTag,
    color: ColorTag,
    list: ListTag,
    '*': ListItemTag,
    quote: QuoteTag,
    url: LinkTag,
    link: LinkTag
  };
}).call(this);
(function() {
  var _SPACE_RE, _START_NEWLINE_RE, _TOKEN_RE;
  var __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  };
  _SPACE_RE = /^\s*$/;
  _TOKEN_RE = /(\[\/?.+?\])/;
  _START_NEWLINE_RE = /^\r?\n/;
  this.bbcode.Parser = (function() {
    function Parser(allowedTags) {
      var name, tag, _i, _len, _ref;
      if (allowedTags == null) {
        allowedTags = null;
      }
      this.tags = {};
      if (!allowedTags) {
        _ref = bbcode.BUILTIN;
        for (name in _ref) {
          tag = _ref[name];
          this.registerTag(name, tag);
        }
      } else {
        for (_i = 0, _len = allowedTags.length; _i < _len; _i++) {
          name = allowedTags[_i];
          if (__indexOf.call(bbcode.BUILTIN, name) >= 0) {
            this.registerTag(name, bbcode.BUILTIN[name]);
          }
        }
      }
      this.renderer = new bbcode.Renderer();
    }
    Parser.prototype.registerTag = function(name, tag) {
      return this.tags[name] = tag;
    };
    Parser.prototype._parseParams = function(token) {
      var c, key, params, skipNext, target, terminate, value, _i, _len;
      params = [];
      if (token) {
        target = key = [];
        value = [];
        terminate = ' ';
        skipNext = false;
        for (_i = 0, _len = token.length; _i < _len; _i++) {
          c = token[_i];
          if (skipNext) {
            skipNext = false;
          } else if (target === key && c === '=') {
            target = value;
          } else if (!value.length && c === '"') {
            terminate = c;
          } else if (c !== terminate) {
            target.push(c);
          } else {
            params.push([key.join('').toLowerCase(), value.join('')]);
            if (!_SPACE_RE.test(terminate)) {
              skipNext = true;
            }
            target = key = [];
            value = [];
            terminate = ' ';
          }
        }
        params.push([key.join('').toLowerCase(), value.join('')]);
      }
      return params;
    };
    Parser.prototype._createTextNode = function(parent, text) {
      var _ref;
      if ((_ref = parent.children.slice(-1)[0]) != null ? _ref.STRIP_OUTER : void 0) {
        text = text.replace(_START_NEWLINE_RE, '');
      }
      return new bbcode.Tag(this.renderer, {
        text: text,
        parent: parent
      });
    };
    Parser.prototype.parse = function(input) {
      var cls, current, params, root, tag, tagName, token, tokens;
      current = root = new bbcode.Tag(this.renderer);
      tokens = input.split(_TOKEN_RE);
      while (tokens.length) {
        token = tokens.shift();
        if (token.match(_TOKEN_RE)) {
          params = this._parseParams(token.slice(1, -1));
          tagName = params[0][0];
          if (__indexOf.call(current.CLOSED_BY, tagName) >= 0) {
            tokens.unshift(token);
            tagName = '/' + current.name;
            params = [];
          }
          if (tagName[0] === '/') {
            tagName = tagName.slice(1);
            if (!(tagName in this.tags)) {
              this._createTextNode(current, token);
              continue;
            }
            if (current.name === tagName) {
              current = current.parent;
            }
          } else {
            cls = this.tags[tagName];
            if (!cls) {
              this._createTextNode(current, token);
              continue;
            }
            tag = new cls(this.renderer, {
              name: tagName,
              parent: current,
              params: params
            });
            if (!tag.SELF_CLOSE && (__indexOf.call(tag.CLOSED_BY, tagName) < 0 || current.name !== tagName)) {
              current = tag;
            }
          }
        } else {
          this._createTextNode(current, token);
        }
      }
      return root;
    };
    Parser.prototype.toHTML = function(input) {
      var html;
      return html = this.parse(input).toHTML();
    };
    return Parser;
  })();
}).call(this);
