_NEWLINE_RE = /\r?\n/g
_LINE_BREAK = '<br />'

class window.BBCodeTag
  constructor: (@renderer, settings={}) ->
    @CLOSED_BY = []
    @SELF_CLOSE = false
    @STRIP_INNER = false
    @STRIP_OUTER = false
    @DISCARD_TEXT = false

    @name = settings['name'] or null
    @parent = settings['parent'] or null
    @text = settings['text'] or ''

    if @parent
      @parent.children.push(@)

    settings['params'] ?= []

    @params = {}

    for [key, value] in settings['params']
      if value
        @params[key] = value

    @children = []

  getContent: (raw=false) ->
    pieces = []

    if @text
      text = @renderer.escape(@text)
      
      if not raw
        if @renderer.options['linkify']
          text = @renderer.linkify(text)

        text = @renderer.cosmeticReplace(text.replace(_NEWLINE_RE, _LINE_BREAK))

      pieces.push(text)

    children = @children

    for child in children
      if raw
        pieces.push(child.toText())
      else
        if @DISCARD_TEXT and child.name is null
          continue

        pieces.push(child.toHTML())

    content = pieces.join('')

    if not raw and @STRIP_INNER
        content = @renderer.strip(content)

        while content[0..._LINE_BREAK.length] is _LINE_BREAK
            content = content.slice(_LINE_BREAK.length)

        while content.slice(-_LINE_BREAK.length) is _LINE_BREAK
            content = content.slice(0, -_LINE_BREAK.length)

        content = @renderer.strip(content)

    return content

  toText: (contentAsHTML=false) ->
    pieces = []

    if @name isnt null
      if @params.length
        params = ([k, v].join('=') for k, v of @params).join(' ')

        if @name of @params
          pieces.push("[#{params}]")
        else
          pieces.push("[#{@name} #{params}]")
      else
        pieces.push("[#{@name}]")

    pieces.push(@getContent(not contentAsHTML))

    if @name isnt null and @name not in @CLOSED_BY
      pieces.push("[/#{@name}]")

    pieces.join('')

  _toHTML: ->
    [@toText(true)]

  toHTML: ->
    @_toHTML().join('')

class CodeBBCodeTag extends BBCodeTag
  constructor: ->
    super

    @STRIP_INNER = true

    @_inline = @params['code'] is 'inline'

    if not @_inline
      @STRIP_OUTER = true

  _toHTML: ->
      if @_inline
          return ['<code>', @getContent(true), '</code>']

      lang = @params['lang'] or @params[@name]

      if lang
          ["<pre class=\"prettyprint lang-#{lang}\">", @getContent(true), '</pre>']
      else
          ['<pre>', @getContent(true), '</pre>']

class ImageBBCodeTag extends BBCodeTag
  _toHTML: ->
    attributes =
      src: @renderer.strip(@getContent(true))

    if 'width' of @params
      attributes['width'] = @params['width']

    if 'height' of @params
      attributes['height'] = @params['height']

    ["<img #{@renderer.htmlAttributes(attributes)} />"]

class SizeBBCodeTag extends BBCodeTag
  _toHTML: ->
    size = @params['size']

    if isNaN(size)
      return @getContent()

    ["<span style=\"font-size:#{size}px\">", @getContent(), '</span>']

class ColorBBCodeTag extends BBCodeTag
  _toHTML: ->
    color = @params['color']

    if not color
      return @getContent()

    ["<span style=\"color:#{color}\">", @getContent(), '</span>']

class CenterBBCodeTag extends BBCodeTag
  _toHTML: ->
    ['<div style="text-align:center;">', @getContent(), '</div>']

class RightBBCodeTag extends BBCodeTag
  _toHTML: ->
    ['<div style="float:right;">', @getContent(), '</div>']

class HorizontalRuleBBCodeTag extends BBCodeTag
  constructor: ->
    super

    @SELF_CLOSE = true
    @STRIP_OUTER = true

  _toHTML: ->
    ['<hr />']

class ListBBCodeTag extends BBCodeTag
  constructor: ->
    super

    @STRIP_INNER = true
    @STRIP_OUTER = true

  _toHTML: ->
    listType = @params['list']

    if listType is '1'
        ['<ol>', @getContent(), '</ol>']
    else if listType is 'a'
        ['<ol style="list-style-type:lower-alpha;">', @getContent(), '</ol>']
    else if listType == 'A'
        ['<ol style="list-style-type:upper-alpha;">', @getContent(), '</ol>']
    else
        ['<ul>', @getContent(), '</ul>']

class ListItemBBCodeTag extends BBCodeTag
  constructor: ->
    super

    @CLOSED_BY = ['*', '/list']
    @STRIP_INNER = true

  _toHTML: ->
      ['<li>', @getContent(), '</li>']

class QuoteBBCodeTag extends BBCodeTag
  constructor: ->
    super

    @STRIP_INNER = true
    @STRIP_OUTER = true

  _toHTML: ->
    pieces = ['<blockquote>', @getContent()]

    citation = @params['quote']

    if citation
      pieces.push('<small>')
      pieces.push(citation)
      pieces.push('</small>')

    pieces.push('</blockquote>')

    return pieces

class LinkBBCodeTag extends BBCodeTag
  _toHTML: ->
    url = @renderer.strip(@params[@name] or @getContent(true))

    if /javascript:/i.test(url)
      url = ''
    else if  not /:/.test(url)
      url = 'http://' + url

    if url
      @renderer.context {'linkify': false}, =>
        ["<a href=\"#{url}\" target=\"_blank\">", @getContent(), '</a>']
    else
      [@getContent()]

createSimpleTag = (name, attributes) ->
  class SimpleTag extends BBCodeTag
    constructor: ->
      super

      for k ,v of attributes
        @[k] = v

    _toHTML: ->
      htmlAttributes = @renderer.htmlAttributes(@params)

      if htmlAttributes
        htmlAttributes = ' ' + htmlAttributes

      return ["<#{name}#{htmlAttributes}>", @getContent(), "</#{name}>"]

window.BBCODE_TAGS =
  b: createSimpleTag('strong')
  i: createSimpleTag('em')
  u: createSimpleTag('u')
  s: createSimpleTag('strike')
  h1: createSimpleTag('h1', {STRIP_OUTER: true})
  h2: createSimpleTag('h2', {STRIP_OUTER: true})
  h3: createSimpleTag('h3', {STRIP_OUTER: true})
  h4: createSimpleTag('h4', {STRIP_OUTER: true})
  h5: createSimpleTag('h5', {STRIP_OUTER: true})
  h6: createSimpleTag('h6', {STRIP_OUTER: true})
  pre: createSimpleTag('pre')
  table: createSimpleTag('table', {DISCARD_TEXT: true})
  thead: createSimpleTag('thead', {DISCARD_TEXT: true})
  tbody: createSimpleTag('tbody', {DISCARD_TEXT: true})
  tr: createSimpleTag('tr', {DISCARD_TEXT: true})
  th: createSimpleTag('th')
  td: createSimpleTag('td')
  code: CodeBBCodeTag
  img: ImageBBCodeTag
  hr: HorizontalRuleBBCodeTag
  size: SizeBBCodeTag
  center: CenterBBCodeTag
  right: RightBBCodeTag
  color: ColorBBCodeTag
  list: ListBBCodeTag
  '*': ListItemBBCodeTag
  quote: QuoteBBCodeTag
  url: LinkBBCodeTag
  link: LinkBBCodeTag