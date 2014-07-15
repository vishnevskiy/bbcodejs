_ESCAPE_RE = /[&<>"]/g
_ESCAPE_DICT =
  '&': '&amp;'
  '<': '&lt;'
  '>': '&gt;'
  '"': '&quot;'

_URL_RE = /\b((?:([\w-]+):(\/{1,3})|www[.])(?:(?:(?:[^\s&()]|&amp;|&quot;)*(?:[^!"#$%&'()*+,.:;<=>?@\[\]^`{|}~\s]))|(?:\((?:[^\s&()]|&amp;|&quot;)*\)))+)/g

_COSMETIC_DICT =
    '--': '&ndash;'
    '---': '&mdash;'
    '...': '&#8230;'
    '(c)': '&copy;'
    '(reg)': '&reg;'
    '(tm)': '&trade;'

_COSMETIC_RE = new RegExp((key.replace(/(\.|\)|\()/g, '\\$1') for key of _COSMETIC_DICT).join('|'))

bbcode = @bbcode;

class @bbcode.Renderer
  constructor: ->
    @_contexts = []
    @options =
      linkify: true

  context: (context, func) ->
    newOptions = {}

    for k, v of @options
      newOptions[k] = v

    for k, v of context
      newOptions[k] = v
      
    @_contexts.push(@options)
    @options = newOptions
    v = func()
    @options = @_contexts.pop()
    return v

  escape: (value) ->
    # Escapes a string so it is valid within XML or XHTML
    value.replace(_ESCAPE_RE, (match) -> _ESCAPE_DICT[match])

  linkify: (value) ->
    value.replace _URL_RE, (match...) ->
      url = match[1]
      proto = match[2]

      if proto and proto not in ['http', 'https']
        return url # bad protocol, no linkify

      href = match[1]

      if not proto
        href = 'http://' + href # no proto specified, use http

      return "<a href=\"#{href}\" target=\"_blank\">#{url}</a>"

  strip: (text) ->
    text.replace(/^\s+|\s+$/g, '')

  cosmeticReplace: (value) ->
    value.replace _COSMETIC_RE, (match...) ->
      item = match[0]
      return _COSMETIC_DICT[item] or item

  htmlAttributes: (attributes) ->
    if not attributes 
      return ''

    return ("#{k}=\"#{v}\"" for k, v of attributes).join(' ')